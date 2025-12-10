// /..\backend\src\services\manualTransaction.service.js
import prisma from "../db/prisma.js";
import { recalculateSummaries } from "./summary.service.js";

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
        const dailyTransactions = await tx.manualTransaction.findMany({
            where: finalWhere,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { id: 'desc' }
        });

        const total = await tx.manualTransaction.count({
            where: finalWhere,
        });

        return {
            dailyTransactions,
            total,
        }
    })
};

export const createDailyTransaction = async (data) => {
    return await prisma.$transaction(async (tx) => {
        const transaction = await tx.manualTransaction.create({
            data: {
                ...data,
                date: new Date(data.date),
            },
        });

        if (transaction.type === 'EXPENSE')
            await recalculateSummaries(tx, [transaction.date]);

        return transaction;
    });
}

export const updateDailyTransaction = async (data) => {
    return await prisma.$transaction(async (tx) => {
        const transaction = await tx.manualTransaction.update({
            where: { id: data.id },
            data: {
                ...data,
                date: new Date(data.date),
            },
        });

        if (transaction.type === 'EXPENSE')
            await recalculateSummaries(tx, [transaction.date]);

        return transaction;
    });
}


export const deleteDailyTransaction = async (id) => {
    return await prisma.$transaction(async (tx) => {
        const transaction = await tx.manualTransaction.delete({ where: { id } });

        if (transaction.type === 'EXPENSE')
            await recalculateSummaries(tx, [transaction.date]);

        return transaction;
    });
}