import prisma from "../db/prisma.js";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween.js';
import minMax from 'dayjs/plugin/minMax.js';
import pkg from "@prisma/client";

// EXTEND dayjs to enable the new functions (min/max and isBetween)
dayjs.extend(isBetween);
dayjs.extend(minMax);

const { Decimal } = pkg;

// ===========================================
// INTERNAL HELPERS
// ===========================================

/**
 * INTERNAL: Aggregates all financial data strictly as MONTHLY FLOWS/CHANGES.
 */
const createSummary = async (tx, { month, year }) => {
    const start = dayjs(`${year}-${month}-01`).startOf("month").toDate();
    const end = dayjs(`${year}-${month}-01`).endOf("month").toDate();

    const existingSummary = await tx.monthlySummary.findUnique({
        where: { year_month: { year, month } },
    });

    const summaryData = {
        month, year,
        totalExpense: new Decimal(0), totalDebt: new Decimal(0),
        totalBank: new Decimal(0), totalCash: new Decimal(0), // These are NET MONTHLY CHANGES
        totalSales: new Decimal(0), costOfStock: new Decimal(0),
        grossProfit: new Decimal(0), netProfit: new Decimal(0),
        stockValue: new Decimal(0), totalInvestment: new Decimal(0), // These are MONTHLY FLOWS
    };

    // 1. Daily Transaction Aggregation
    const dailyTransactions = await tx.dailyTransaction.findMany({
        where: { date: { gte: start, lte: end } },
        select: { type: true, amount: true, direction: true, },
    });

    // 3. Process Daily Transactions (Calculates NET change for Cash/Bank)
    dailyTransactions.forEach((t) => {
        const amount = new Decimal(t.amount);
        const sign = t.direction === "IN" ? amount : amount.neg();

        if (t.type === "EXPENSE" && t.direction === "OUT") {
            summaryData.totalExpense = summaryData.totalExpense.plus(amount);
        } else if (t.type === "DEBT" && t.direction === "OUT") {
            summaryData.totalDebt = summaryData.totalDebt.plus(amount);
        } else if (t.type === "BANK") {
            summaryData.totalBank = summaryData.totalBank.plus(sign); // Net Change
        } else if (t.type === "CASH") {
            summaryData.totalCash = summaryData.totalCash.plus(sign); // Net Change
        }
    });

    // 4 & 5. Sales and COGS (Flow metrics - correct)
    const saleSummary = await tx.sale.aggregate({ _sum: { totalAmount: true }, where: { saleDate: { gte: start, lte: end } }, });
    summaryData.totalSales = new Decimal(saleSummary._sum.totalAmount || 0);

    const soldStock = await tx.stockTransaction.findMany({ where: { type: "SALE", date: { gte: start, lte: end } }, include: { product: true }, });
    summaryData.costOfStock = soldStock.reduce((sum, s) => sum.plus(new Decimal(s.quantity).mul(s.product.buyingPrice)), new Decimal(0));

    // 6. Profit Calculation (Flow metrics - correct)
    summaryData.grossProfit = summaryData.totalSales.sub(summaryData.costOfStock);
    summaryData.netProfit = summaryData.grossProfit.sub(summaryData.totalExpense).sub(summaryData.totalDebt);


    // 7. Available Stock Value (CRITICAL: THIS IS NOW A LIVE SNAPSHOT)
    // NOTE: This must remain a live snapshot for the dashboard 'Current Stock Value' card.
    const availableStock = await tx.product.findMany();
    summaryData.stockValue = availableStock.reduce((sum, p) => sum.plus(new Decimal(p.stockQuantity).mul(p.buyingPrice)), new Decimal(0));

    // 8. Total Investment (FLOW: Only count investments made within this month)
    const investment = await tx.investment.aggregate({
        _sum: { investment: true },
        where: {
            date: { gte: start, lte: end } // Filters to monthly flow
        }
    });
    summaryData.totalInvestment = new Decimal(investment._sum.investment || 0);

    const saleKpiSummary = await tx.sale.aggregate({
        _sum: {
            totalAmount: true, // Total Sale Revenue (Accrual)
            paidAmount: true, // Total Payments Received
            remainingAmount: true, // Total Remaining Debt/Receivable
        },
        where: {
            saleDate: { gte: start, lte: end }
        },
    });

    
    // 9. Upsert and Return
    const saved = await tx.monthlySummary.upsert({
        where: { year_month: { year, month } },
        update: summaryData,
        create: summaryData,
    });
    
    saved.totalCustomerDebt = new Decimal(saleKpiSummary._sum.remainingAmount || 0);

    saved.message = existingSummary
        ? `Monthly summary for ${dayjs(existingSummary.date).format("MMM YYYY")} updated successfully.`
        : `Monthly summary for ${dayjs(saved.date).format("MMM YYYY")} Created successfully.`;
    return saved;
};

/**
 * INTERNAL: Aggregates multiple monthly summaries by SUMMING ALL FLOW METRICS.
 */
const createDashboardSummary = async (summariesArray, tx) => {
    if (summariesArray.length === 0) return null;

    const formatTrendData = (summaries) =>
        summaries.map((s) => ({
            month: s.month, year: s.year,
            grossProfit: new Decimal(s.grossProfit || 0).toString(),
            netProfit: new Decimal(s.netProfit || 0).toString(),
            totalSales: new Decimal(s.totalSales || 0).toString(),
        }));

    const trendData = formatTrendData(summariesArray);

    let aggregated = {
        totalExpense: new Decimal(0), totalDebt: new Decimal(0),
        totalBank: new Decimal(0), totalCash: new Decimal(0),
        totalSales: new Decimal(0), costOfStock: new Decimal(0),
        grossProfit: new Decimal(0), netProfit: new Decimal(0),
        totalInvestment: new Decimal(0),
        stockValue: new Decimal(0),
        trendData,
        totalCustomerDebt: new Decimal(0),
    };

    const financialKeys = Object.keys(aggregated).filter(key => aggregated[key] instanceof Decimal);

    // 1. SUM ALL FLOW/NET CHANGE METRICS (including Cash/Bank/Investment)
    summariesArray.forEach((s) => {
        financialKeys.forEach((key) => {
            if (key in s && (typeof s[key] === 'number' || s[key] instanceof Decimal)) {
                const incomingValue = new Decimal(s[key]);
                aggregated[key] = aggregated[key].plus(incomingValue);
            }
        });
    });

    // 2. STOCK VALUE EXCEPTION: Overwrite only Stock Value as a live snapshot.
    // Use the value from the last month for the 'Current Stock Value' card.
    const lastSummary = summariesArray[summariesArray.length - 1];
    aggregated.stockValue = new Decimal(lastSummary.stockValue || 0);


    // 3. Fetch Live Totals (Stock Quantity and Customers)
    const totalStock = await tx.product.aggregate({ _sum: { stockQuantity: true } });
    const totalCustomers = await tx.customer.count();

    // 4. Convert all final Decimals to Strings
    for (const key of financialKeys) {
        if (aggregated[key] instanceof Decimal) {
            aggregated[key] = aggregated[key].toString();
        }
    }

    // 5. Add Live Totals and metadata
    aggregated.totalStockValue = totalStock._sum.stockQuantity || 0;
    aggregated.totalCustomers = totalCustomers;
    aggregated.months = summariesArray.length;
    aggregated.from = { month: summariesArray[0].month, year: summariesArray[0].year };
    if (summariesArray.length > 1)
        aggregated.to = { month: lastSummary.month, year: lastSummary.year };

    return aggregated;
};

// ===========================================
// EXPORTED SERVICES
// ===========================================

export const generateSummary = async (data, next) => {
    return await prisma.$transaction((tx) =>
        createSummary(tx, { month: data.startM, year: data.startY })
    );
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

/**
 * 3. Public service to GENERATE/FETCH the aggregated Dashboard Report for a single month or range.
 */
export const generateDashboardSummary = async (data, next) => {
    return await prisma.$transaction(async (tx) => {
        const { startM, startY, endM, endY } = data;
        const summaries = [];

        // 1. Define Boundaries and Correct Order 
        const start = dayjs(`${startY}-${startM}-01`);
        const end = (endY && endM) ? dayjs(`${endY}-${endM}-01`) : start;

        const finalStart = dayjs.min(start, end);
        const finalEnd = dayjs.max(start, end);

        // 2. Iterate Month by Month
        let currentDate = finalStart;

        while (currentDate.isSame(finalEnd, 'month') || currentDate.isBefore(finalEnd, 'month')) {
            const year = currentDate.year();
            const month = currentDate.month() + 1;

            // Generate or update the summary for the current month
            const summary = await createSummary(tx, { month, year });
            summaries.push(summary);

            currentDate = currentDate.add(1, 'month');
        }

        if (summaries.length === 0) return null;

        console.log({ summaries });

        const dashboard = await createDashboardSummary(summaries, tx);
        return dashboard;
    });
};

export const deleteSummary = async (id) => {
    return await prisma.monthlySummary.delete({ where: { id } });
}