//..\src\services\sale.service.js
import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";
import { createStock } from "./stock.service.js";
import pkg from "@prisma/client";

const { Decimal } = pkg;

export const getSales = async (where, { page, limit }) => {
    return await prisma.$transaction(async (tx) => {
        const AND = {};
        const or = [];

        if (where.customerId) {
            AND.customerId = Number(where.customerId);
        } else if (where.customerName) {
            or.push({
                customer: {
                    name: {
                        contains: where.customerName,
                        mode: "insensitive",
                    },
                },
            });
        } else if (where.phone) {
            or.push({
                customer: {
                    phone: {
                        contains: where.phone,
                        mode: "insensitive",
                    },
                },
            });
        } else if (where.cnic) {
            or.push({
                customer: {
                    cnic: {
                        contains: where.cnic,
                        mode: "insensitive",
                    },
                },
            });
        }

        if (or.length > 0) AND.OR = or;

        if (where.productName) {
            AND.product = {
                name: {
                    contains: where.productName,
                    mode: "insensitive",
                },
            };
        }

        const sales = await tx.sale.findMany({
            where: AND,
            include: {
                customer: { select: { name: true } },
                product: { select: { name: true } },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { saleDate: "desc" },
        });

        const total = await tx.sale.count({ where: AND });

        return { sales, total };
    });
};

export const getSale = async (id) => {
    const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    cnic: true,
                    address: true,
                },
            },
            product: {
                select: {
                    id: true,
                    name: true,
                    buyingPrice: true,
                    sellingPrice: true,
                    stockQuantity: true,
                },
            },
            installments: {
                select: {
                    id: true,
                    amount: true,
                    paidDate: true,
                    dueDate: true,
                    status: true,
                },
                orderBy: { dueDate: "asc" },
            },
        },
    });

    return sale;
};

export const createSale = async (data, next) => {
    return await prisma.$transaction(async (tx) => {
        let {
            saleDate,
            customerId,
            productId,
            saleType, paymentMethod,
            quantity = 1,
            discount: rawDiscount = 0, // Renamed to handle conversion
            downPayment: rawDownPayment = 0, // Renamed to handle conversion
            totalInstallments = 0,
            paidInstallments = 0,
            product,
            note,
        } = data;

        // --- FIX 1: Convert raw number inputs to Decimal instances ---
        let discount = new Decimal(rawDiscount);
        let downPayment = new Decimal(rawDownPayment);
        // -----------------------------------------------------------

        const productPurchaseDate = product.stockTransaction.find((t) => t.initial).date;

        if (productPurchaseDate && productPurchaseDate > saleDate)
            return next(
                new AppError(
                    `Sale date cannot be before ${productPurchaseDate.toLocaleDateString()} product purchase date`,
                    400
                )
            );

        const currentProduct = await tx.product.findUnique({
            where: { id: productId },
            select: { stockQuantity: true },
        });

        if (currentProduct.stockQuantity < quantity)
            return next(new AppError("Not enough stock available", 400));

        let paidAmount = new Decimal(0);
        let remainingAmount = new Decimal(0);
        let saleStatus = "ACTIVE";
        let perInstallment = new Decimal(0);

        const totalAmount = new Decimal(product.sellingPrice).mul(quantity);

        if (saleType === "CASH") {
            paidAmount = totalAmount.sub(discount);
            downPayment = paidAmount;
            perInstallment = new Decimal(0);
            totalInstallments = 0;
            remainingAmount = new Decimal(0);
            saleStatus = "COMPLETED";
            paidInstallments = paidAmount.gt(0) ? 1 : 0;
        } else if (saleType === "INSTALLMENT") {
            paidAmount = downPayment; // downPayment is now a Decimal
            remainingAmount = totalAmount.sub(paidAmount).sub(discount);

            if (totalInstallments > 10)
                return next(new AppError("Too many installments. Max 10.", 400));

            if (totalInstallments <= 0)
                return next(new AppError("At least one installment is required", 400));

            perInstallment = remainingAmount.div(totalInstallments);
            saleStatus = "ACTIVE";
            // This line now works correctly as downPayment is a Decimal:
            paidInstallments = downPayment.gt(0) ? 1 : 0;
        }

        if (paidAmount.gt(totalAmount))
            return next(new AppError("Paid amount cannot be greater than total amount", 400));

        const sale = await tx.sale.create({
            data: {
                saleDate: new Date(saleDate),
                customerId,
                productId,
                saleType: saleType,
                paymentMethod: paymentMethod,
                quantity,
                discount,
                totalAmount,
                downPayment,
                perInstallment,
                totalInstallments,
                paidInstallments,
                paidAmount,
                remainingAmount,
                status: saleStatus,
            },
        });

        // --- Record the CASH/BANK INFLOW ---
        if (paidAmount.gt(0)) {
            await tx.dailyTransaction.create({
                data: {
                    type: paymentMethod,
                    amount: paidAmount,
                    note: `Sale #${sale.id} payment from customer. Method: ${paymentMethod}`,
                    date: new Date(saleDate),
                    direction: "IN",
                    saleId: sale.id
                },
            });
        }
        // ------------------------------------------

        if (saleType === "INSTALLMENT" && totalInstallments > 0) {
            const totalRemainingDecimal = remainingAmount;
            const installmentBase = totalRemainingDecimal.div(totalInstallments);
            let installments = [];

            for (let i = 0; i < totalInstallments; i++) {
                let amount = installmentBase;

                if (i === totalInstallments - 1) {
                    const sumOfPrev = installmentBase.mul(totalInstallments - 1);
                    amount = totalRemainingDecimal.sub(sumOfPrev);
                }

                const today = new Date();

                installments.push({
                    saleId: sale.id,
                    amount,
                    paidDate: null,
                    dueDate: new Date(today.getFullYear(), today.getMonth() + (i + 1), today.getDate()),
                    status: (i === 0 && downPayment.gt(0)) ? "PAID" : "PENDING",
                });
            }

            await tx.installment.createMany({ data: installments });
        }

        await createStock(
            {
                id: productId,
                stockQuantity: quantity,
                type: "SALE",
                date: saleDate,
                note,
                saleId: sale.id,
                direction: "OUT",
            },
            tx
        );

        return sale;
    });
};

export const updateSale = async (data) =>
    // ... (rest of the file remains unchanged) ...
    await prisma.sale.update({
        where: { id: data.id },
        data,
    });

export const deleteSale = async (saleId) => {
    return await prisma.$transaction(async (tx) => {
        const initialPaymentTx = await tx.dailyTransaction.findFirst({
            where: { saleId, type: { in: ["CASH", "BANK"] } },
        });

        if (initialPaymentTx) {
            await tx.dailyTransaction.delete({
                where: { id: initialPaymentTx.id },
            });
        }

        await tx.installment.deleteMany({ where: { saleId } });

        const saleStockTx = await tx.stockTransaction.findFirst({
            where: { saleId, type: "SALE" },
        });

        if (!saleStockTx)
            return await tx.sale.delete({ where: { id: saleId } });

        const productId = saleStockTx.productId;
        const quantityToRestore = saleStockTx.quantity;

        await tx.stockTransaction.delete({
            where: { id: saleStockTx.id },
        });

        const currentProduct = await tx.product.findUnique({
            where: { id: productId },
            select: { stockQuantity: true },
        });

        const newStockQuantity = currentProduct.stockQuantity + quantityToRestore;

        await tx.product.update({
            where: { id: productId },
            data: { stockQuantity: newStockQuantity },
        });

        return await tx.sale.delete({
            where: { id: saleId },
        });
    });
};

export const returnSale = async ({ id: saleId, refundMethod, note }, next) => {
    return await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.findUnique({
            where: { id: saleId },
            include: { product: true, customer: true },
        });

        if (!sale) return next(new AppError("Sale not found.", 404));
        if (sale.status === "RETURNED") return next(new AppError("Sale already returned.", 400));

        const refundAmount = Number(sale.paidAmount);

        await tx.stockTransaction.createMany({
            data: [
                {
                    productId: sale.productId,
                    quantity: sale.quantity,
                    type: "RETURN",
                    date: new Date(),
                    saleId: sale.id,
                    direction: "IN",
                },
            ],
        });

        await tx.product.update({
            where: { id: sale.productId },
            data: { stockQuantity: { increment: sale.quantity } },
        });

        const updatedSale = await tx.sale.update({
            where: { id: saleId },
            data: {
                status: "RETURNED",
                totalAmount: 0,
                paidAmount: 0,
                remainingAmount: 0,
            },
        });

        if (refundAmount > 0) {
            await tx.dailyTransaction.create({
                data: {
                    type: refundMethod,
                    amount: refundAmount,
                    note: note || `REFUND: Sale return for customer ${sale.customer.name}. Sale ID: ${sale.id}`,
                    date: new Date(),
                    direction: "OUT",
                }
            });
        }

        return updatedSale;
    });
};