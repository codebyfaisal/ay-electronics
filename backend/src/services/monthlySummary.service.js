// src/services/monthlySummary.service.js
import prisma from "../db/prisma.js";
import dayjs from "dayjs";
import AppError from "../utils/error.util.js";
import pkg from "@prisma/client";

const { Decimal } = pkg;

const createSummaryInternal = async (tx, data) => {
    const { month, year } = data;

    const start = dayjs(`${year}-${month}-01`).startOf("month").toDate();
    const end = dayjs(`${year}-${month}-01`).endOf("month").toDate();

    const existingSummary = await tx.monthlySummary.findUnique({
        where: { year_month: { year, month } },
    });

    // 1. Daily Transaction Aggregation
    // FIX: Group by BOTH 'type' AND 'direction' to calculate balance correctly
    const dailyTransactions = await tx.dailyTransaction.findMany({
        where: { date: { gte: start, lte: end } },
        select: {
            type: true,
            amount: true,
            direction: true,
        },
    });

    // 2. Initialize Summary Data
    const summaryData = {
        month,
        year,
        totalExpense: new Decimal(0),
        totalDebt: new Decimal(0),
        totalBank: new Decimal(0),
        totalCash: new Decimal(0),
        totalSales: new Decimal(0),
        costOfStock: new Decimal(0),
        grossProfit: new Decimal(0),
        netProfit: new Decimal(0),
        stockValue: new Decimal(0),
        totalInvestment: new Decimal(0),
    };
    
    // 3. Process Daily Transactions based on Type and Direction
    dailyTransactions.forEach((t) => {
        const amount = new Decimal(t.amount);
        const sign = t.direction === "IN" ? amount : amount.neg(); // Positive for IN, Negative for OUT

        // A. Simple OUTFLOWS (Always negative or positive sum of outflows)
        if (t.type === "EXPENSE" && t.direction === "OUT") {
            summaryData.totalExpense = summaryData.totalExpense.plus(amount); // Sum of expenses (as costs)
        } else if (t.type === "DEBT" && t.direction === "OUT") {
            summaryData.totalDebt = summaryData.totalDebt.plus(amount); // Sum of debt (as costs)
        } 
        // B. Managed ACCOUNTS (Balance calculation)
        else if (t.type === "BANK") {
            summaryData.totalBank = summaryData.totalBank.plus(sign); // Apply sign for Bank balance
        } else if (t.type === "CASH") {
            summaryData.totalCash = summaryData.totalCash.plus(sign); // Apply sign for Cash balance
        }
    });

    // 4. Sale Summary (Total Sales Revenue)
    const saleSummary = await tx.sale.aggregate({
        _sum: { totalAmount: true },
        where: { saleDate: { gte: start, lte: end } },
    });
    summaryData.totalSales = new Decimal(saleSummary._sum.totalAmount || 0);

    // 5. Cost of Stock Sold (COGS)
    const soldStock = await tx.stockTransaction.findMany({
        where: { type: "SALE", date: { gte: start, lte: end } },
        include: { product: true },
    });
    
    summaryData.costOfStock = soldStock.reduce(
        (sum, s) => sum.plus(new Decimal(s.quantity).mul(s.product.buyingPrice)),
        new Decimal(0)
    );

    // 6. Profit Calculation (Using Decimal methods)
    summaryData.grossProfit = summaryData.totalSales.sub(summaryData.costOfStock);
    summaryData.netProfit = summaryData.grossProfit
        .sub(summaryData.totalExpense) // Expenses are costs
        .sub(summaryData.totalDebt); // Debt payments are costs (though usually handled separately from expense in P&L)

    // 7. Available Stock Value
    const availableStock = await tx.product.findMany(); 
    summaryData.stockValue = availableStock.reduce(
        (sum, p) => sum.plus(new Decimal(p.stockQuantity).mul(p.buyingPrice)),
        new Decimal(0)
    );

    // 8. Total Investment
    const investment = await tx.investment.aggregate({ 
        _sum: { investment: true },
    });
    summaryData.totalInvestment = new Decimal(investment._sum.investment || 0);

    // 9. Upsert and Return
    const saved = await tx.monthlySummary.upsert({
        where: { year_month: { year, month } },
        update: summaryData,
        create: summaryData,
    });

    let message = `Monthly summary for ${dayjs(saved.date).format("MMM")} ${dayjs(saved.date).format("YYYY")} Created successfully.`;
    if (existingSummary) message = `Monthly summary for ${dayjs(existingSummary.date).format("MMM")} ${dayjs(existingSummary.date).format("YYYY")} updated successfully.`;
    saved.message = message;

    return saved;
};

// ---------------------------------------------------------------------------------

export const getMonthlySummaries = async (where, { page, limit }) => {
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

// ---------------------------------------------------------------------------------

export const getSummaryByMonth = async ({ startM, startY, endM, endY }, next) => {
    const dateKey = (y, m) => y * 100 + m;

    const formatTrendData = (summaries) =>
        summaries.map((s) => ({
            month: s.month,
            year: s.year,
            grossProfit: s.grossProfit.toString(),
            netProfit: s.netProfit.toString(),
            totalSales: s.totalSales.toString(),
        }));

    return await prisma.$transaction(async (tx) => {
        let initialSummary = null;

        // --- Case 1: Single Month ---
        if (!endM || !endY) {
            initialSummary = await tx.monthlySummary.findUnique({
                where: { year_month: { year: startY, month: startM } },
            });

            if (!initialSummary) {
                initialSummary = await createSummaryInternal(tx, { month: startM, year: startY });
                if (!initialSummary) return next(new AppError("Failed to generate summary.", 500));
            }

            const totalStock = await tx.product.aggregate({ _sum: { stockQuantity: true } });
            const totalCustomers = await tx.customer.count();

            const singleMonthArray = [initialSummary];

            const summary = {
                ...initialSummary,
                trendData: formatTrendData(singleMonthArray),
                totalStockValue: totalStock._sum.stockQuantity || 0,
                totalCustomers,
                months: 1,
                from: { year: startY, month: startM },
            };

            // Convert Decimal fields to strings for frontend compatibility
            for (const key in summary) {
                if (
                    summary[key] &&
                    typeof summary[key].toString === "function" &&
                    !Array.isArray(summary[key]) &&
                    typeof summary[key] !== "object"
                ) {
                    summary[key] = summary[key].toString();
                }
            }

            delete summary.id;
            delete summary.month;
            delete summary.year;

            return summary;
        }

        // --- Case 2: Range of Months ---
        const summaries = await tx.monthlySummary.findMany({
            where: {
                OR: [
                    { year: startY, month: { gte: startM } },
                    { year: endY, month: { lte: endM } },
                ],
            },
            orderBy: [{ year: "asc" }, { month: "asc" }],
        });

        const startKey = dateKey(startY, startM);
        const endKey = dateKey(endY, endM);
        const filtered = summaries.filter((s) => {
            const currentKey = dateKey(s.year, s.month);
            return currentKey >= startKey && currentKey <= endKey;
        });

        if (filtered.length === 0) return null;

        const trendData = formatTrendData(filtered);

        // Aggregate Decimals from filtered summaries
        let aggregated = {
            totalExpense: new Decimal(0),
            totalDebt: new Decimal(0),
            totalBank: new Decimal(0),
            totalCash: new Decimal(0),
            totalSales: new Decimal(0),
            costOfStock: new Decimal(0),
            grossProfit: new Decimal(0),
            netProfit: new Decimal(0),
            totalInvestment: new Decimal(0),
            stockValue: new Decimal(0), // Handled outside the loop
            
            months: filtered.length,
            from: { month: startM, year: startY },
            to: { month: endM, year: endY },
            trendData,
        };

        filtered.forEach((s) => {
            for (const key in aggregated) {
                // Aggregation applies to fields present in the MonthlySummary model
                if (key in s && typeof s[key]?.toNumber === "function") {
                    aggregated[key] = aggregated[key].plus(s[key].toNumber());
                }
            }
        });

        // Convert final aggregated Decimal metrics to strings
        for (const key in aggregated) {
            if (typeof aggregated[key]?.toString === "function" && aggregated[key] instanceof Decimal) {
                aggregated[key] = aggregated[key].toString();
            }
        }
        
        // Final non-time-series aggregations (needs to be outside the Decimal loop)
        const totalStock = await tx.product.aggregate({ _sum: { stockQuantity: true } });
        const totalCustomers = await tx.customer.count();

        // Stock value is a single sum, and should be added as a string/number after Decimal conversion
        aggregated.totalStockValue = totalStock._sum.stockQuantity || 0;
        aggregated.totalCustomers = totalCustomers;

        return aggregated;
    });
};

// ---------------------------------------------------------------------------------

export const createMonthlySummary = async (data, next) =>
    await prisma.$transaction((tx) => createSummaryInternal(tx, data));

export const deleteMonthlySummary = async (id) =>
    await prisma.monthlySummary.delete({ where: { id } });