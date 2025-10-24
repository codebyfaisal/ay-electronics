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

        if (or.length > 0) AND.OR = or;
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
                    buyingPrice: true,
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

export const createSale = async (data, next) => {
    return await prisma.$transaction(async (tx) => {
        let {
            saleDate,
            customerId,
            productId,
            saleType, paymentMethod,
            quantity = 1,
            discount: rawDiscount = 0,
            downPayment: rawDownPayment = 0,
            totalInstallments = 0,
            product,
            note,
        } = data;

        let discount = new Decimal(rawDiscount);
        let downPayment = new Decimal(rawDownPayment);
        let paidInstallments = 0;
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
            paidAmount = downPayment;
            remainingAmount = totalAmount.sub(discount).sub(paidAmount);

            if (totalInstallments > 10)
                return next(new AppError("Too many installments. Max 10.", 400));
            if (totalInstallments <= 0)
                return next(new AppError("At least one installment is required", 400));

            perInstallment = remainingAmount.div(totalInstallments);
            saleStatus = "ACTIVE";

            paidInstallments = 0;
        }

        if (paidAmount.gt(totalAmount))
            return next(new AppError("Paid amount cannot be greater than total amount", 400));

        if (discount.gt(totalAmount))
            return next(new AppError("Discount cannot be greater than total amount", 400));

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

        if (downPayment.gt(0)) {
            await tx.dailyTransaction.create({
                data: {
                    type: paymentMethod,
                    amount: downPayment,
                    note: `Sale #${sale.id} Down Payment from customer. Method: ${paymentMethod}`,
                    date: new Date(saleDate),
                    direction: "IN",
                    saleId: sale.id,
                },
            });
        }

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
                    status: "PENDING",
                });
            }

            await tx.installment.createMany({ data: installments });
        }

        await tx.stockTransaction.create({
            data: {
                productId: sale.productId,
                quantity: sale.quantity,
                type: "SALE",
                date: new Date(saleDate),
                saleId: sale.id,
                direction: "OUT",
                note: `Sale #${sale.id} from customer. Method: ${paymentMethod}`,
            },
        })

        await tx.product.update({
            where: { id: sale.productId },
            data: { stockQuantity: { decrement: sale.quantity } },
        });

        return sale;
    });
};

export const updateSale = async (data) =>
    await prisma.sale.update({
        where: { id: data.id },
        data,
    });

export const deleteSale = async (saleId) => {
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
        
        await tx.dailyTransaction.deleteMany({ where: { saleId: sale.id } });

        if (quantityToRestore > 0) {
            const currentProduct = await tx.product.findUnique({
                where: { id: productId },
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

export const returnSale = async ({ id: saleId, date, quantity: returnQuantity, refundMethod, note }, next) => {
    return await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.findUnique({
            where: { id: saleId },
            include: {
                product: true,
                customer: true,
                installments: true
            },
        });

        if (!sale) return next(new AppError("Sale not found.", 404));

        // --- Core Value Extraction ---
        const originalSoldQuantity = sale.quantity;
        const originalTotalAmount = new Decimal(sale.totalAmount);
        const originalDiscount = new Decimal(sale.discount);
        
        // CRITICAL: Values to be updated
        const currentReturnQuantity = sale.returnQuantity;
        const currentPaidAmount = new Decimal(sale.paidAmount);
        const totalRefundedAmount = new Decimal(sale.returnAmount || 0);
        const currentDownPayment = new Decimal(sale.downPayment); // This will be the mutable refund pool
        const currentRemainingAmount = new Decimal(sale.remainingAmount);

        const totalUnitsToBeReturned = currentReturnQuantity + returnQuantity;
        const remainingToReturn = originalSoldQuantity - currentReturnQuantity;
        const newQuantityRemaining = originalSoldQuantity - totalUnitsToBeReturned;

        // 1. Validation Checks 
        if (sale.status === "RETURNED")
            return next(new AppError("Sale is already fully returned.", 400));
        if (returnQuantity > remainingToReturn) 
            return next(new AppError(`Cannot return ${returnQuantity} units. Only ${remainingToReturn} units remain to be returned.`, 400));
        if (returnQuantity <= 0)
            return next(new AppError("Return quantity must be greater than zero.", 400));

        // 2. Determine Final Status
        let newStatus = newQuantityRemaining === 0 ? "RETURNED" : "PARTIAL";

        // --- Core Custom Refund/Deduction Logic ---

        // Value of returned goods (based on Selling Price, as requested)
        const unitSellingPrice = new Decimal(sale.product.sellingPrice);
        const valueOfReturnedGoods = unitSellingPrice.mul(returnQuantity);
        
        // Refund amount is derived from the custom logic below
        let finalRefundAmountDecimal = new Decimal(0);
        let newDownPayment = currentDownPayment;
        
        if (newStatus === "RETURNED") {
            // SCENARIO 2: FULL RETURN - Cashout ALL current paid amount
            // NOTE: This assumes the refund amount is always the total amount the customer has paid (net of prior refunds).
            finalRefundAmountDecimal = currentPaidAmount.sub(totalRefundedAmount); 
            if (finalRefundAmountDecimal.isNegative()) finalRefundAmountDecimal = new Decimal(0);

        } else { 
            // SCENARIO 1: PARTIAL RETURN - Deduct from Down Payment (Refund Pool)
            
            if (currentDownPayment.gte(valueOfReturnedGoods)) {
                // If Down Payment >= Value of Returned Goods: Refund the full value, deduct from Down Payment
                finalRefundAmountDecimal = valueOfReturnedGoods;
                newDownPayment = currentDownPayment.sub(finalRefundAmountDecimal);
                
            } else {
                // If Down Payment < Value of Returned Goods: No cash out (Refund Amount is 0), but still proceed with return.
                // Down Payment remains unchanged.
                finalRefundAmountDecimal = new Decimal(0);
            }
        }
        
        const refundAmount = finalRefundAmountDecimal.toNumber();
        
        // --- Calculate New Sale Metrics ---
        
        // A. Total Amount: Original Total Amount - Gross Value of Returned Goods
        const grossUnitValue = originalTotalAmount.div(originalSoldQuantity);
        const proportionalGrossReturn = grossUnitValue.mul(returnQuantity);
        const newTotalAmount = originalTotalAmount.sub(proportionalGrossReturn); 

        // B. Discount is reduced proportionally
        const proportionalDiscountReduction = originalDiscount.div(originalSoldQuantity).mul(returnQuantity);
        const newDiscount = originalDiscount.sub(proportionalDiscountReduction);

        // C. Calculate New Remaining Amount and Paid Amount
        const newPaidAmount = currentPaidAmount.sub(finalRefundAmountDecimal); // Paid Amount reduced by actual refund given
        const newRefundedAmount = totalRefundedAmount.plus(finalRefundAmountDecimal);
        
        // The remaining amount must be recalculated based on the loss of items sold/total price
        const totalNetSalePrice = originalTotalAmount.sub(originalDiscount);
        const unitNetValue = totalNetSalePrice.div(originalSoldQuantity);
        const proportionalNetReturn = unitNetValue.mul(returnQuantity);
        
        // Remaining = Old Remaining - Proportional Net Value of Returned Item (regardless of cash out)
        let newRemainingAmount = currentRemainingAmount.sub(proportionalNetReturn);
        if (newRemainingAmount.isNegative()) newRemainingAmount = new Decimal(0);

        // 4. Stock and Daily Transactions (assumed correct)
        await tx.stockTransaction.create({
            data: {
                productId: sale.productId, quantity: returnQuantity, type: "RETURN",
                date: new Date(date), saleId: sale.id, direction: "IN",
                note: `RETURN: Sale #${saleId}. ${returnQuantity} units returned. Note: ${note || ""}`,
            },
        });

        await tx.product.update({
            where: { id: sale.productId },
            data: { stockQuantity: { increment: returnQuantity } },
        });
        
        // 5. Cash Flow Outflow (Only for the determined refund amount)
        if (refundAmount > 0) {
            // NOTE: For full returns, the system must delete the INFLOWS before creating this OUTFLOW.
            if (newStatus === "RETURNED") {
                 await tx.dailyTransaction.deleteMany({ where: { saleId: saleId, direction: "IN" } });
            }
            
            await tx.dailyTransaction.create({
                data: {
                    type: refundMethod, amount: refundAmount,
                    note: `REFUND: Sale return for customer ${sale.customer.name}. Sale ID: ${saleId}. Method: ${refundMethod}.`,
                    date: new Date(date), direction: "OUT", saleId: sale.id,
                }
            });
        }
        
        // 6. Update Sale Record
        const saleUpdateData = {
            quantity: newQuantityRemaining,
            totalAmount: newTotalAmount.toNumber(),
            discount: newDiscount.toNumber(),
            downPayment: newDownPayment.toNumber(), // <-- Updated Down Payment pool
            remainingAmount: newRemainingAmount.toNumber(),
            status: newStatus,
            paidAmount: newPaidAmount.toNumber(), 
            returnQuantity: totalUnitsToBeReturned,
            returnAmount: newRefundedAmount.toNumber(),
        };

        // 7. Finalize on Full Return (Apply zeroing logic)
        if (newStatus === "RETURNED") {
            saleUpdateData.remainingAmount = 0;
            saleUpdateData.paidAmount = 0; 
            saleUpdateData.quantity = 0; 
            saleUpdateData.downPayment = 0; // Down payment pool is fully consumed/reversed.

            // Clear out all associated installment amounts
            await tx.installment.updateMany({
                where: { saleId: saleId, status: { in: ["PENDING", "LATE", "PAID"] } },
                data: {
                    amount: 0, status: "PAID", paidDate: new Date(date)
                }
            });
        }

        const updatedSale = await tx.sale.update({
            where: { id: saleId },
            data: saleUpdateData,
        });

        return updatedSale;
    });
};