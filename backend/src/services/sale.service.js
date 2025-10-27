//..\src\services\sale.service.js
import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";
import pkg from "@prisma/client";
const { Decimal } = pkg;

export const getSales = async (where, { page, limit }) => {
    return await prisma.$transaction(async (tx) => {
        const AND = {};
        const or = [];

        const { customerId, customerName, phone, cnic, productName, saleDate } = where

        if (customerId) AND.customerId = Number(customerId);
        else if (customerName) {
            or.push({
                customer: {
                    name: {
                        contains: customerName,
                    },
                },
            });
        } else if (phone || cnic) {
            const key = cnic ? "cnic" : "phone";
            const value = cnic || phone;
            or.push({
                customer: {
                    [key]: {
                        contains: value,
                    },
                },
            });
        }

        if (or.length > 0) AND.OR
            = or;
        if (productName) {
            AND.product = {
                name: {
                    contains: productName,
                },
            };
        }

        if (saleDate) {
            if (saleDate.from || saleDate.to) {
                AND.saleDate = {};
                if (saleDate.from) AND.saleDate.gte = new Date(saleDate.from);
                if (saleDate.to) AND.saleDate.lte = new Date(saleDate.to);
            } else AND.saleDate = new Date(saleDate);
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
    return await prisma.sale.findUnique({
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
                    sellingPrice: true,
                    stockQuantity: true,
                    category: true,
                    brand: true,
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
};

export const crtSale = async (tx, data, next) => {
    let {
        agreementNo: id,
        saleDate,
        customerId,
        productId,
        saleType,
        quantity = 1,
        discount: rawDiscount = 0,
        paidAmount: rawPaidAmount = 0,
        firstInstallment: rawFirstInstallment = 0,
        totalInstallments = 0,
        product,
    } = data;

    let discount = new Decimal(rawDiscount);

    let initialPayment = new Decimal(0);
    let paidAmountTotal = new Decimal(0);
    let remainingAmount = new Decimal(0);
    let saleStatus = "ACTIVE";
    let perInstallment = new Decimal(0);
    let paidInstallments = 0;

    const totalAmount = new Decimal(product.sellingPrice).mul(quantity);

    if (saleType === "CASH") {
        initialPayment = totalAmount.sub(discount);

        if (rawPaidAmount > 0)
            initialPayment = new Decimal(rawPaidAmount);

        paidAmountTotal = initialPayment;
        perInstallment = new Decimal(0);
        totalInstallments = 0;
        remainingAmount = new Decimal(0);
        saleStatus = "COMPLETED";
        paidInstallments = paidAmountTotal.gt(0) ? 1 : 0;

    } else if (saleType === "INSTALLMENT") {
        initialPayment = new Decimal(rawFirstInstallment);

        paidAmountTotal = initialPayment;

        remainingAmount = totalAmount.sub(discount).sub(paidAmountTotal);

        if (totalInstallments < 1)
            return next(new AppError("At least one installment is required", 400));

        const remainingInstallmentsCount = totalInstallments - 1;

        if (remainingInstallmentsCount < 0)
            return next(new AppError("Total installments must be greater than or equal to the paid installments.", 400));

        if (remainingInstallmentsCount > 0) {
            perInstallment = remainingAmount.div(remainingInstallmentsCount);
        } else if (remainingAmount.isZero()) {
            perInstallment = new Decimal(0);
        }

        saleStatus = remainingAmount.isZero() ? "COMPLETED" : "ACTIVE";
        paidInstallments = initialPayment.gt(0) ? 1 : 0;
        totalInstallments = totalInstallments;
    }

    if (paidAmountTotal.gt(totalAmount))
        return next(new AppError("Paid amount cannot be greater than total amount", 400));
    if (discount.gt(totalAmount))
        return next(new AppError("Discount cannot be greater than total amount", 400));

    const initialStockTx = product.stockTransaction.find((t) => t.initial);
    const productPurchaseDate = initialStockTx?.date;
    if (productPurchaseDate && productPurchaseDate > saleDate)
        return next(
            new AppError(
                `Sale date cannot be before ${productPurchaseDate.toLocaleDateString()} product purchase date`,
                400
            )
        );

    if (discount.isNegative())
        return next(new AppError("Discount cannot be negative", 400));

    if (product.stockQuantity < quantity)
        return next(new AppError(`Not enough stock available max available quantity is ${product.stockQuantity}`, 400));

    const buyingPrice = await tx.stockTransaction.findMany({
        where: {
            productId,
            direction: "IN",
            type: "PURCHASE",
        },
        orderBy: { date: "desc" },
        select: { buyingPrice: true },
        take: 1,
    });

    const sale = await tx.sale.create({
        data: {
            id,
            customerId,
            productId,
            saleType,
            quantity,
            buyingPrice: buyingPrice[0].buyingPrice,
            sellingPrice: product.sellingPrice,
            discount,
            totalAmount,
            perInstallment,
            totalInstallments,
            paidInstallments,
            paidAmount: paidAmountTotal,
            remainingAmount,
            saleDate: new Date(saleDate),
            status: saleStatus,
        },
    });

    if (saleType === "INSTALLMENT" && totalInstallments > 0) {
        let installments = [];
        const today = new Date(saleDate);

        installments.push({
            saleId: sale.id,
            amount: initialPayment,
            paidDate: new Date(saleDate),
            dueDate: new Date(saleDate),
            status: "PAID",
        });

        const remainingInstallmentsCount = totalInstallments - 1;

        if (remainingInstallmentsCount > 0 && remainingAmount.gt(0)) {

            const totalRemainingDecimal = remainingAmount;
            const installmentBase = perInstallment;

            for (let i = 0; i < remainingInstallmentsCount; i++) {
                let amount = installmentBase;

                if (i === remainingInstallmentsCount - 1) {
                    const sumOfPrev = installmentBase.mul(remainingInstallmentsCount - 1);
                    amount = totalRemainingDecimal.sub(sumOfPrev);
                }

                installments.push({
                    saleId: sale.id,
                    amount,
                    paidDate: null,
                    dueDate: new Date(today.getFullYear(), today.getMonth() + (i + 1), today.getDate()),
                    status: "UPCOMING",
                });
            }
        }

        await tx.installment.createMany({ data: installments });
    }

    const sellingProductStockTx = await tx.stockTransaction.findFirst({
        where: { productId: sale.productId, type: "PURCHASE" },
        orderBy: { date: "asc" },
        select: { buyingPrice: true }
    });

    await tx.stockTransaction.create({
        data: {
            productId: sale.productId,
            quantity: sale.quantity,
            type: "SALE",
            date: new Date(saleDate),
            saleId: sale.id,
            direction: "OUT",
            note: `Sale #${sale.id} from customer.`,
            buyingPrice: sellingProductStockTx?.buyingPrice || 0,
        },
    })

    await tx.product.update({
        where: { id: sale.productId },
        data: { stockQuantity: { decrement: sale.quantity } },
    });

    return sale;
};

export const createSale = async (data, next) =>
    await prisma.$transaction(async (tx) =>
        await crtSale(tx, data, next)
    );


export const updateSale = async (data) =>
    await prisma.sale.update({
        where: { id: data.id },
        data,
    });

export const deleteSale = async (saleId, next) => {
    return await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.findUnique({
            where: { id: saleId },
            select: {
                id: true,
                productId: true,
                quantity: true,
                status: true,
                returnQuantity: true
            },
        });

        if (!sale) throw new AppError("Sale not found", 404);

        const productId = sale.productId;
        const quantityToRestore = sale.quantity;


        await tx.installment.deleteMany({ where: { saleId: sale.id } });

        await tx.stockTransaction.deleteMany({ where: { saleId: sale.id } });

        if (quantityToRestore > 0) {
            const currentProduct = await tx.product.findUnique({
                where: {
                    id: productId
                },
                select: { stockQuantity: true },
            });
            const newStockQuantity = currentProduct.stockQuantity + quantityToRestore;

            await tx.product.update({
                where: { id: productId },
                data: { stockQuantity: newStockQuantity },
            });
        }

        return await tx.sale.delete({
            where: { id: saleId },
        });
    });
};