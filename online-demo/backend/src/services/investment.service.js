// /..\backend\src\services\investment.service.js
import prisma from "../db/prisma.js";
import dayjs from "dayjs";
import AppError from "../utils/error.util.js";

export const getInvestments = async (where, { page, limit }) => {
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
        const investments = await tx.investment.findMany({
            where: finalWhere,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { date: 'desc' }
        });

        const total = await tx.investment.count({
            where: finalWhere,
        });

            return {
            investments,
            total,
        }
    })
};

export const createInvestment = async (data) => {
    return await prisma.$transaction(async (tx) => {
        const { date } = data;
        const currentInvMonth = new Date(date).getMonth();
        const currentInvYear = new Date(date).getFullYear();

        const investments = await tx.investment.findMany();

        const investmentExist = investments.find((i) => {
            const invMonth = new Date(i.date).getMonth();
            const invYear = new Date(i.date).getFullYear();

            return invMonth === currentInvMonth && invYear === currentInvYear;
        });

        if (investmentExist)
            throw new AppError(`Investment for ${dayjs(date).format("MMM")} ${currentInvYear} already exists.`, 400);

        const investment = await tx.investment.create({ data });
        return investment
    })
}

export const updateInvestment = async (data) => {
    return await prisma.$transaction(async (tx) => {
        const investment = await tx.investment.update({
            where: { id: data.id },
            data
        });

        const message = `Investment for ${dayjs(investment.date).format("MMM")} ${dayjs(investment.date).format("YYYY")} updated successfully.`;

        investment.message = message

        return investment
    })
}
export const deleteInvestment = async (id) =>
    await prisma.investment.delete({ where: { id } });