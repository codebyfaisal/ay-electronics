// src/services/summary.service.js
import prisma from "../db/prisma.js";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween.js';
import minMax from 'dayjs/plugin/minMax.js';
import pkg from "@prisma/client";

dayjs.extend(isBetween);
dayjs.extend(minMax);

const { Decimal } = pkg;

const getInvestment = async (tx, { sm, sy }) => {
    return await tx.investment.findFirst({
        where: {
            date: {
                gte: new Date(sy, sm - 1, 1),
                lte: new Date(sy, sm, 30),
            }
        }
    })
}

export const generateSummary = async (tx, { month, year }) => {
    const sDate = new Date(year, month - 1, 1);
    const eDate = new Date(year, month, 0);

    const manualTransactions = await tx.manualTransaction.findMany({
        where: {
            date: {
                gte: sDate,
                lt: eDate,
            },
        },
    })

    const totalExpense = manualTransactions
        .filter(m => m.type === 'EXPENSE')
        .reduce((a, b) => a + b.amount, 0)

    const totalDebtIncurred = manualTransactions
        .filter(m => m.type === 'DEBT')
        .reduce((a, b) => a + b.amount, 0)

    const totalCash = manualTransactions
        .filter(m => m.type === 'CASH')
        .reduce((a, b) => a + b.amount, 0)

    const totalBank = manualTransactions
        .filter(m => m.type === 'BANK')
        .reduce((a, b) => a + b.amount, 0)

    const sales = await tx.sale.findMany({
        where: {
            OR: [
                { saleDate: { gte: sDate, lt: eDate } },
            ],
        },
        include: {
            product: true,
            customer: true,
        },
    })

    const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)
    const costOfStock = sales.reduce((sum, s) => sum + (s.buyingPrice * s.quantity), 0)
    const grossProfit = totalSalesRevenue - costOfStock

    const netProfit = grossProfit - totalExpense

    const totalDebtOnCustomers = sales.reduce((sum, s) => sum + s.remainingAmount, 0)

    const products = await tx.product.findMany({
        where: {
            OR: [
                {
                    stockTransaction: {
                        some: {
                            date: {
                                gte: sDate,
                                lt: eDate
                            }
                        }
                    }
                },
            ]
        },
        include: {
            stockTransaction: {
                select: {
                    id: true,
                    date: true,
                    quantity: true,
                },
                orderBy: {
                    date: 'desc'
                }
            }
        }
    })

    const currentStockValue = products.reduce(
        (sum, p) => sum + (p.stockQuantity * p.sellingPrice),
        0
    )
    const totalStockQuantity = products.reduce((sum, p) => sum + p.stockQuantity, 0)

    const totalCustomers = await tx.customer.count()
    const totalProducts = products.length

    const totalInvestment = await getInvestment(tx, { sm: month, sy: year });
    const totalAssetsValue = currentStockValue + totalSalesRevenue;

    const metrics = {
        month,
        year,
        totalExpense,
        totalDebt: totalDebtIncurred,
        totalBank,
        totalCash,
        totalInvestment,
        totalAssetsValue,
        totalSales: totalSalesRevenue,
        costOfStock,
        grossProfit,
        netProfit,
        stockValue: currentStockValue,
        totalDebtOnCustomers,
        totalCustomers,
        totalProducts,
        totalStockQuantity,
    }

    return await tx.monthlySummary.upsert({
        where: {
            year_month: {
                month,
                year,
            },
        },
        update: metrics,
        create: metrics,
    });
}

function getMonthRange(sm, sy, em, ey) {
    const result = [];

    let start = sy * 12 + (sm - 1);
    let end = ey * 12 + (em - 1);

    if (start > end) [start, end] = [end, start];

    for (let i = start; i <= end; i++) {
        const year = Math.floor(i / 12);
        const month = (i % 12) + 1;
        result.push({ month, year });
    }

    return result;
}

function normalizeRange(sm, sy, em, ey) {
    const currentYear = new Date().getFullYear();

    sy = sy || currentYear;
    ey = ey || sy || currentYear;

    if (sm && sy && !em && !ey) {
        return {
            from: { month: sm, year: sy },
            to: { month: sm, year: sy }
        };
    }

    if (em && ey && !sm && !sy) {
        return {
            from: { month: em, year: ey },
            to: { month: em, year: ey }
        };
    }

    if (!sm) sm = new Date().getMonth() + 1;
    if (!em) em = sm;
    if (!sy) sy = currentYear;
    if (!ey) ey = sy;

    let startIndex = sy * 12 + (sm - 1);
    let endIndex = ey * 12 + (em - 1);

    if (startIndex > endIndex) {
        [sm, sy, em, ey] = [em, ey, sm, sy];
    }
    const range = {
        from: {
            month: sm,
            year: sy === ey ? "" : sy
        },
        to: {
            month: em,
            year: ey
        }
    };

    return range;
}

export const getSummary = async (data) => {
    const {
        sMonth: sm,
        sYear: sy,
        eMonth: em,
        eYear: ey
    } = data;

    return await prisma.$transaction(async (tx) => {
        const dateRange = [];
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        if (sm && sy && em && ey) {
            getMonthRange(sm, sy, em, ey).forEach((r) => dateRange.push(r));
        }
        else if (!sm && !sy && !em && !ey) {
            dateRange.push({ month: currentMonth, year: currentYear });
        }
        else if (sm && sy && !em && !ey) {
            dateRange.push({ month: sm, year: sy });
        }
        else if (sm && !sy && !em && !ey) {
            dateRange.push({ month: sm, year: currentYear });
        }
        else if (!sm && sy && !em && !ey) {
            for (let i = 1; i <= 12; i++) dateRange.push({ month: i, year: sy });
        }
        else if (!sm && !sy && em && !ey) {
            dateRange.push({ month: em, year: currentYear });
        }
        else if (!sm && !sy && !em && ey) {
            for (let i = 1; i <= 12; i++) dateRange.push({ month: i, year: ey });
        }
        else if (sm && !sy && em && !ey) {
            getMonthRange(sm, currentYear, em, currentYear).forEach((r) => dateRange.push(r));
        }
        else if (!sm && sy && em && !ey) {
            getMonthRange(1, sy, em, sy).forEach((r) => dateRange.push(r));
        }
        else if (sm && sy && !em && ey) {
            getMonthRange(sm, sy, 12, ey).forEach((r) => dateRange.push(r));
        }

        const summaries = [];
        for (let i = 0; i < dateRange.length; i++) {
            const { month, year } = dateRange[i];
            const summary = await tx.monthlySummary.findUnique({
                where: {
                    year_month: {
                        month,
                        year
                    }
                }
            })
            if (summary) {
                delete summary.id;
                delete summary.month;
                delete summary.year;
                delete summary.createdAt;
                delete summary.totalCustomers;
                delete summary.totalInvestment;
                delete summary.totalProducts;
                summaries.push(summary);
            }
        }

        const summary = summaries.reduce((acc, obj) => {
            for (const key in obj) {
                acc[key] = (acc[key] || 0) + obj[key];
            }
            return acc;
        }, {});



        const totalProducts = await tx.product.count();
        const totalCustomers = await tx.customer.count();
        const totalInvestment = await getInvestment(tx, { sm, sy });

        summary.totalProducts = totalProducts;
        summary.totalCustomers = totalCustomers;
        summary.totalInvestment = new Decimal(totalInvestment?.investment || 0);

        const range = normalizeRange(sm, sy, em, ey)
        if (((sy && sm) && (!ey || !em)) || (sy === ey && sm === em))
            summary.from = { month: sm, year: sy }
        else {
            summary.from = range.from;
            summary.to = range.to;
        }

        return summary;
    });
}

export const getSummaries = async (where, { page, limit }) => {
    return await prisma.$transaction(async (tx) => {
        const monthlySummaries = await tx.monthlySummary.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await tx.monthlySummary.count({ where });

        return { monthlySummaries, total };
    });
};

export const deleteSummary = async (id) =>
    await prisma.monthlySummary.delete({ where: { id } });