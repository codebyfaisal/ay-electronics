import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";

export const getDailyTransactions = async (where, { page, limit }) => {
    const { startDate, endDate, ...otherFilters } = where;

    let dateRangeCondition = {};

    if (startDate && endDate)
        dateRangeCondition = {
            date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        };
    else if (startDate)
        dateRangeCondition = { date: { gte: new Date(startDate) } };
    else if
        (endDate) dateRangeCondition = { date: { lte: new Date(endDate) } };


    const finalWhere = {
        ...otherFilters,
        ...dateRangeCondition,
    };

    return await prisma.$transaction(async (tx) => {
        const dailyTransactions = await tx.dailyTransaction.findMany({
            where: finalWhere,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { id: 'desc' }
        });

        const total = await tx.dailyTransaction.count({
            where: finalWhere,
        });

        return {
            dailyTransactions,
            total,
        }
    })
};

const direction = (type) => type === "EXPENSE" || type === "DEBT" ? "OUT" : "IN";


export const createDailyTransaction = async (data) =>
    await prisma.dailyTransaction.create({
        data: {
            ...data,
            direction: direction(data.type)
        }
    });

export const updateDailyTransaction = async (data, next) => {
    return await prisma.$transaction(async (tx) => {
        data.direction = direction(data.type);

        const haveSaleId = await tx.dailyTransaction.findFirst({
            where: { id: data.id },
            select: {
                saleId: true, productId: true,
                stockId: true, installmentId: true,
                investmentId: true
            },
        });

        if (haveSaleId.saleId === null && haveSaleId.productId === null &&
            haveSaleId.stockId === null && haveSaleId.installmentId === null &&
            haveSaleId.investmentId === null)
            return await tx.dailyTransaction.update({
                where: { id: data.id },
                data
            });

        return next(new AppError("Cannot update a Payment transaction when it is linked to a Product, Stock, Installment or Sale", 400));

    })
}

export const deleteDailyTransaction = async (id, next) => {
    return await prisma.$transaction(async (tx) => {
        const haveSaleId = await tx.dailyTransaction.findFirst({
            where: { id },
            select: {
                saleId: true, productId: true,
                stockId: true, installmentId: true,
                investmentId: true
            },
        });

        if (haveSaleId.saleId === null && haveSaleId.productId === null &&
            haveSaleId.stockId === null && haveSaleId.installmentId === null &&
            haveSaleId.investmentId === null)
            return await tx.dailyTransaction.delete({ where: { id } });

        return next(new AppError("Cannot delete a Payment transaction when it is linked to a Product, Stock, Installment or Sale", 400));
    })
}