// /..\backend\src\services\manualTransaction.service.js
import prisma from "../db/prisma.js";

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

export const createDailyTransaction = async (data) =>
    await prisma.manualTransaction.create({ data });

export const updateDailyTransaction = async (data, next) =>
    await prisma.manualTransaction.update({
        where: { id: data.id },
        data
    });

export const deleteDailyTransaction = async (id, next) =>
    await prisma.manualTransaction.delete({ where: { id } });
