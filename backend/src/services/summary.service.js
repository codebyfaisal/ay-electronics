// src/services/summary.service.js
import prisma from "../db/prisma.js";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween.js';
import minMax from 'dayjs/plugin/minMax.js';
import pkg from "@prisma/client";

dayjs.extend(isBetween);
dayjs.extend(minMax);

const { Decimal } = pkg;

const createSummaryInternal = async (tx, { month, year }) => {
    const start = dayjs(`${year}-${month}-01`).startOf("month").toDate();
    const end = dayjs(`${year}-${month}-01`).endOf("month").toDate();

    const existingSummary = await tx.monthlySummary.findUnique({
        where: { year_month: { year, month } },
    });

    const summaryData = {
        month, year,
        totalExpense: new Decimal(0), totalDebt: new Decimal(0),
        totalBank: new Decimal(0), totalCash: new Decimal(0),
        totalSales: new Decimal(0), costOfStock: new Decimal(0),
        grossProfit: new Decimal(0), netProfit: new Decimal(0),
        stockValue: new Decimal(0), totalInvestment: new Decimal(0),
    };

    const dailyTransactions = await tx.dailyTransaction.findMany({
        where: { date: { gte: start, lte: end } },
        select: { type: true, amount: true, direction: true, },
    });

    dailyTransactions.forEach((t) => {
        const amount = new Decimal(t.amount);
        const sign = t.direction === "IN" ? amount : amount.neg();

        if (t.type === "EXPENSE" && t.direction === "OUT") {
            summaryData.totalExpense = summaryData.totalExpense.plus(amount);
        } else if (t.type === "DEBT" && t.direction === "OUT") {
            summaryData.totalDebt = summaryData.totalDebt.plus(amount);
        } else if (t.type === "BANK") {
            summaryData.totalBank = summaryData.totalBank.plus(sign);
        } else if (t.type === "CASH") {
            summaryData.totalCash = summaryData.totalCash.plus(sign);
        }
    });

    const saleSummary = await tx.sale.aggregate({ _sum: { totalAmount: true }, where: { saleDate: { gte: start, lte: end } }, });
    summaryData.totalSales = new Decimal(saleSummary._sum.totalAmount || 0);

    const soldStock = await tx.stockTransaction.findMany({ where: { type: "SALE", date: { gte: start, lte: end } }, include: { product: true }, });
    summaryData.costOfStock = soldStock.reduce((sum, s) => sum.plus(new Decimal(s.quantity).mul(s.product.buyingPrice)), new Decimal(0));

    summaryData.grossProfit = summaryData.totalSales.sub(summaryData.costOfStock);
    summaryData.netProfit = summaryData.grossProfit.sub(summaryData.totalExpense).sub(summaryData.totalDebt);

    const availableStock = await tx.product.findMany();
    summaryData.stockValue = availableStock.reduce((sum, p) => sum.plus(new Decimal(p.stockQuantity).mul(p.buyingPrice)), new Decimal(0));

    const investment = await tx.investment.aggregate({
        _sum: { investment: true },
        where: { date: { gte: start, lte: end } }
    });
    summaryData.totalInvestment = new Decimal(investment._sum.investment || 0);

    const saved = await tx.monthlySummary.upsert({
        where: { year_month: { year, month } },
        update: summaryData,
        create: summaryData,
    });

    saved.message = existingSummary
        ? `Monthly summary for ${dayjs(existingSummary.date).format("MMM YYYY")} updated successfully.`
        : `Monthly summary for ${dayjs(saved.date).format("MMM YYYY")} Created successfully.`;
    return saved;
};

export const generateSummary = async (data, next) => {
    return await prisma.$transaction((tx) =>
        createSummaryInternal(tx, { month: data.startM, year: data.startY })
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

export const deleteSummary = async (id) =>
    await prisma.monthlySummary.delete({ where: { id } });

export const generateDashboardSummary1 = async (data, next) => {
    return await prisma.$transaction(async (tx) => {
        const { startM, startY, endM, endY } = data;

        let queryStartDate, queryEndDate, isGrandTotal = false;

        // 1. Determine Date Range based on input
        if (!startM || !startY) {
            isGrandTotal = true;

            const earliestSale = await tx.sale.findFirst({ orderBy: { saleDate: 'asc' } });
            const earliestDailyTx = await tx.dailyTransaction.findFirst({ orderBy: { date: 'asc' } });
            const earliestStockTx = await tx.stockTransaction.findFirst({ orderBy: { date: 'asc' } });

            let earliestDate = dayjs('2000-01-01');

            if (earliestSale) earliestDate = dayjs.min(earliestDate, dayjs(earliestSale.saleDate));
            if (earliestDailyTx) earliestDate = dayjs.min(earliestDate, dayjs(earliestDailyTx.date));
            if (earliestStockTx) earliestDate = dayjs.min(earliestDate, dayjs(earliestStockTx.date));

            queryStartDate = earliestDate.startOf('day').toDate();
            queryEndDate = dayjs().endOf('day').toDate();
        }

        else if (!endM || !endY) {
            const start = dayjs(`${startY}-${startM}-01`);
            queryStartDate = start.startOf('month').toDate();
            queryEndDate = start.endOf('month').toDate();
        }

        else {
            const start = dayjs(`${startY}-${startM}-01`);
            const end = dayjs(`${endY}-${endM}-01`);

            const finalStart = dayjs.min(start, end);
            const finalEnd = dayjs.max(start, end);

            queryStartDate = finalStart.startOf('month').toDate();
            queryEndDate = finalEnd.endOf('month').toDate();
        }

        // 2. Fetch All Required Data within the determined Range

        const dailyTransactions = await tx.dailyTransaction.findMany({
            where: { date: { gte: queryStartDate, lte: queryEndDate } },
            select: { type: true, amount: true, direction: true, productId: true },
        });

        const sales = await tx.sale.findMany({
            where: { saleDate: { gte: queryStartDate, lte: queryEndDate } },
            select: { totalAmount: true, remainingAmount: true, saleType: true, returnAmount: true },
        });

        const stockTransactions = await tx.stockTransaction.findMany({
            where: { type: { in: ["SALE", "RETURN"] }, date: { gte: queryStartDate, lte: queryEndDate } },
            include: { product: true }
        });

        const investments = await tx.investment.aggregate({
            _sum: { investment: true },
            where: { date: { gte: queryStartDate, lte: queryEndDate } }
        });

        // 3. Initialize Aggregated Flow Metrics
        let aggregated = {
            totalExpense: new Decimal(0), totalDebt: new Decimal(0),
            totalBank: new Decimal(0), totalCash: new Decimal(0),
            totalSales: new Decimal(0), costOfStock: new Decimal(0),
            grossProfit: new Decimal(0), netProfit: new Decimal(0),
            totalInvestment: new Decimal(investments._sum.investment || 0),

            // Snapshot Metrics
            stockValue: new Decimal(0),
            totalCustomerDebt: new Decimal(0),
            totalAssetsValue: new Decimal(0),
            currentLiveReceivable: new Decimal(0),
            totalCustomers: Number(0),
            totalProducts: Number(0),
            totalStockValue: new Decimal(0),

            // Snapshot Metrics (Range-Bound)
            totalSalesRevenue: new Decimal(0),
            totalSalesCost: new Decimal(0),
        };

        // 4. Calculate Flow Metrics (Range-Bound)

        dailyTransactions.forEach((t) => {
            const amount = new Decimal(t.amount);
            const sign = t.direction === "IN" ? amount : amount.neg();

            // Re-enabling standard cash flow calculation (NO ASSET SWAP EXCLUSION)
            // to ensure Cash on Hand reflects the net difference (20k).
            if (t.type === "BANK") {
                aggregated.totalBank = aggregated.totalBank.plus(sign);
            } else if (t.type === "CASH") {
                aggregated.totalCash = aggregated.totalCash.plus(sign);
            }

            // Other flow metrics (Expenses, Debt) are calculated regardless
            if (t.type === "EXPENSE" && t.direction === "OUT") {
                aggregated.totalExpense = aggregated.totalExpense.plus(amount);
            } else if (t.type === "DEBT" && t.direction === "OUT") {
                aggregated.totalDebt = aggregated.totalDebt.plus(amount);
            }
        });

        // B. Total Sales Revenue (Accrual basis)
        aggregated.totalSales = sales.reduce((sum, s) => sum.plus(new Decimal(s.totalAmount)), new Decimal(0));

        // C. Cost of Stock Sold (COGS)
        aggregated.costOfStock = stockTransactions.reduce(
            (sum, s) => {
                const cost = new Decimal(s.quantity).mul(s.product.buyingPrice);

                if (s.type === "SALE" && s.direction === "OUT") {
                    return sum.plus(cost);
                }
                else if (s.type === "RETURN" && s.direction === "IN") {
                    return sum.sub(cost);
                }
                return sum;
            },
            new Decimal(0)
        );

        // D. Total Customer Debt (Receivable originated in the period - Flow Metric)
        aggregated.totalCustomerDebt = sales
            .filter(s => s.saleType === 'INSTALLMENT')
            .reduce((sum, s) => sum.plus(new Decimal(s.remainingAmount)), new Decimal(0));

        // E. Profit Calculation
        aggregated.grossProfit = aggregated.totalSales.sub(aggregated.costOfStock);
        aggregated.netProfit = aggregated.grossProfit.sub(aggregated.totalExpense).sub(aggregated.totalDebt);


        // 5. Calculate Live Snapshot Metrics (Current State - Independent of Range)

        // A. Live Stock Value & Quantity
        const availableStock = await tx.product.findMany();
        aggregated.stockValue = availableStock.reduce(
            (sum, p) => sum.plus(new Decimal(p.stockQuantity).mul(p.buyingPrice)),
            new Decimal(0)
        );
        const totalStock = availableStock.reduce((sum, p) => sum + p.stockQuantity, 0);

        // B. Live Total Customer Debt (TOTAL CURRENT ASSET/RECEIVABLE)
        const liveReceivable = await tx.sale.aggregate({
            _sum: { remainingAmount: true },
            where: { status: "ACTIVE" }
        });
        aggregated.currentLiveReceivable = new Decimal(liveReceivable._sum.remainingAmount || 0);

        const totalCustomers = await tx.customer.count();

        // 6. Calculate Composite/Display Metrics

        // Net Assets (The correct comprehensive formula)
        // This MUST be 100,000 PKR (80k stock + 20k cash)
        aggregated.totalAssetsValue = aggregated.stockValue
            .plus(aggregated.currentLiveReceivable)
            .plus(aggregated.totalBank)
            .plus(aggregated.totalCash)

        // 7. Generate Monthly Trend Data (Reads pre-stored summaries for chart)
        const startMonth = dayjs(queryStartDate).month() + 1;
        const startYear = dayjs(queryStartDate).year();
        const endMonth = dayjs(queryEndDate).month() + 1;
        const endYear = dayjs(queryEndDate).year();

        const summariesForTrend = await tx.monthlySummary.findMany({
            where: {
                OR: [
                    { year: startYear, month: { gte: startMonth } },
                    { year: endYear, month: { lte: endMonth } },
                    { year: { gt: startYear, lt: endYear } },
                ],
            },
            orderBy: [{ year: "asc" }, { month: "asc" }],
        });

        const dateKey = (y, m) => y * 100 + m;
        const startKey = dateKey(startYear, startMonth);
        const endKey = dateKey(endYear, endMonth);

        const filteredForTrend = summariesForTrend.filter(s => {
            const currentKey = s.year * 100 + s.month;
            return currentKey >= startKey && currentKey <= endKey;
        });

        const trendData = filteredForTrend.map(s => ({
            month: s.month, year: s.year,
            grossProfit: s.grossProfit.toString(),
            netProfit: s.netProfit.toString(),
            totalSales: s.totalSales.toString(),
        }));
        aggregated.trendData = trendData;

        // 8. Format and Return
        const allFinancialKeys = Object.keys(aggregated).filter(key => aggregated[key] instanceof Decimal);
        for (const key of allFinancialKeys) {
            if (aggregated[key] instanceof Decimal) {
                aggregated[key] = aggregated[key].toString();
            }
        }

        aggregated.totalStockValue = totalStock;
        aggregated.totalCustomers = totalCustomers;

        // Set date metadata based on input type
        if (isGrandTotal) {
            aggregated.from = { month: 1, year: dayjs(queryStartDate).year() };
            aggregated.to = { month: 12, year: dayjs(queryEndDate).year() };
            aggregated.months = dayjs().diff(dayjs(queryStartDate), 'month') + 1;
        } else {
            aggregated.months = dayjs(queryEndDate).diff(dayjs(queryStartDate), 'month') + 1;
            aggregated.from = { month: startMonth, year: startYear };
            aggregated.to = { month: endMonth, year: endYear };
        }

        const totalProducts = await prisma.product.count();
        aggregated.totalProducts = totalProducts;

        delete aggregated.currentLiveReceivable;

        return aggregated;
    });
};

export const generateDashboardSummary = async (data, next) => {
  return await prisma.$transaction(async (tx) => {
    const { startM, startY, endM, endY } = data;

    // 1️⃣ Determine range
    let startDate, endDate;
    if (!startM || !startY) {
      const earliestSale = await tx.sale.findFirst({ orderBy: { saleDate: 'asc' } });
      const earliestDailyTx = await tx.dailyTransaction.findFirst({ orderBy: { date: 'asc' } });
      const earliestStockTx = await tx.stockTransaction.findFirst({ orderBy: { date: 'asc' } });
      let earliest = dayjs('2000-01-01');
      if (earliestSale) earliest = dayjs.min(earliest, dayjs(earliestSale.saleDate));
      if (earliestDailyTx) earliest = dayjs.min(earliest, dayjs(earliestDailyTx.date));
      if (earliestStockTx) earliest = dayjs.min(earliest, dayjs(earliestStockTx.date));
      startDate = earliest.startOf('month');
      endDate = dayjs().endOf('month');
    } else if (!endM || !endY) {
      startDate = dayjs(`${startY}-${startM}-01`).startOf('month');
      endDate = startDate.endOf('month');
    } else {
      const start = dayjs(`${startY}-${startM}-01`);
      const end = dayjs(`${endY}-${endM}-01`);
      startDate = dayjs.min(start, end).startOf('month');
      endDate = dayjs.max(start, end).endOf('month');
    }

    // 2️⃣ Split range into months
    const months = [];
    let cursor = startDate;
    while (cursor.isBefore(endDate) || cursor.isSame(endDate, 'month')) {
      months.push({ month: cursor.month() + 1, year: cursor.year() });
      cursor = cursor.add(1, 'month');
    }

    // 3️⃣ Compute each month’s summary individually
    const monthlySummaries = [];
    for (const m of months) {
      const monthStart = dayjs(`${m.year}-${m.month}-01`).startOf('month').toDate();
      const monthEnd = dayjs(`${m.year}-${m.month}-01`).endOf('month').toDate();

      const [dailyTx, sales, stockTx, investments, products, liveReceivable] = await Promise.all([
        tx.dailyTransaction.findMany({
          where: { date: { gte: monthStart, lte: monthEnd } },
          select: { type: true, amount: true, direction: true, productId: true },
        }),
        tx.sale.findMany({
          where: { saleDate: { gte: monthStart, lte: monthEnd } },
          select: { totalAmount: true, remainingAmount: true, saleType: true },
        }),
        tx.stockTransaction.findMany({
          where: { type: { in: ["SALE", "RETURN"] }, date: { gte: monthStart, lte: monthEnd } },
          include: { product: true }
        }),
        tx.investment.aggregate({ _sum: { investment: true }, where: { date: { gte: monthStart, lte: monthEnd } } }),
        tx.product.findMany(),
        tx.sale.aggregate({ _sum: { remainingAmount: true }, where: { status: 'ACTIVE', saleDate: { lte: monthEnd } } }),
      ]);

      let summary = {
        totalExpense: new Decimal(0),
        totalDebt: new Decimal(0),
        totalBank: new Decimal(0),
        totalCash: new Decimal(0),
        totalSales: new Decimal(0),
        costOfStock: new Decimal(0),
        grossProfit: new Decimal(0),
        netProfit: new Decimal(0),
        totalInvestment: new Decimal(investments._sum.investment || 0),
        stockValue: new Decimal(0),
        totalCustomerDebt: new Decimal(0),
        totalAssetsValue: new Decimal(0),
        totalStockValue: new Decimal(0),
        totalSalesRevenue: new Decimal(0),
        totalSalesCost: new Decimal(0),
      };

      // Flow metrics
      dailyTx.forEach(t => {
        const amt = new Decimal(t.amount);
        const sign = t.direction === "IN" ? amt : amt.neg();
        if (t.type === "BANK") summary.totalBank = summary.totalBank.plus(sign);
        if (t.type === "CASH") summary.totalCash = summary.totalCash.plus(sign);
        if (t.type === "EXPENSE" && t.direction === "OUT") summary.totalExpense = summary.totalExpense.plus(amt);
        if (t.type === "DEBT" && t.direction === "OUT") summary.totalDebt = summary.totalDebt.plus(amt);
      });

      // Sales & COGS
      summary.totalSales = sales.reduce((sum, s) => sum.plus(new Decimal(s.totalAmount)), new Decimal(0));
      summary.totalCustomerDebt = sales
        .filter(s => s.saleType === 'INSTALLMENT')
        .reduce((sum, s) => sum.plus(new Decimal(s.remainingAmount)), new Decimal(0));
      summary.costOfStock = stockTx.reduce((sum, s) => {
        const cost = new Decimal(s.quantity).mul(s.product.buyingPrice);
        if (s.type === "SALE" && s.direction === "OUT") return sum.plus(cost);
        if (s.type === "RETURN" && s.direction === "IN") return sum.sub(cost);
        return sum;
      }, new Decimal(0));

      summary.grossProfit = summary.totalSales.sub(summary.costOfStock);
      summary.netProfit = summary.grossProfit.sub(summary.totalExpense).sub(summary.totalDebt);

      // Stock and assets for month-end
      summary.stockValue = products.reduce((sum, p) => sum.plus(new Decimal(p.stockQuantity).mul(p.buyingPrice)), new Decimal(0));
      summary.totalStockValue = products.reduce((sum, p) => sum + p.stockQuantity, 0);
      summary.totalAssetsValue = summary.stockValue
        .plus(new Decimal(liveReceivable._sum.remainingAmount || 0))
        .plus(summary.totalBank)
        .plus(summary.totalCash);

      monthlySummaries.push({ ...summary, month: m.month, year: m.year });
    }

    // 4️⃣ Aggregate all months into final totals
    const aggregated = monthlySummaries.reduce((acc, m) => {
      Object.keys(acc).forEach(key => {
        if (m[key] instanceof Decimal) acc[key] = acc[key].plus(m[key]);
      });
      return acc;
    }, {
      totalExpense: new Decimal(0), totalDebt: new Decimal(0), totalBank: new Decimal(0),
      totalCash: new Decimal(0), totalSales: new Decimal(0), costOfStock: new Decimal(0),
      grossProfit: new Decimal(0), netProfit: new Decimal(0), totalInvestment: new Decimal(0),
      stockValue: new Decimal(0), totalCustomerDebt: new Decimal(0), totalAssetsValue: new Decimal(0),
      totalStockValue: new Decimal(0), totalSalesRevenue: new Decimal(0), totalSalesCost: new Decimal(0)
    });

    // 5️⃣ Trend data
    aggregated.trendData = monthlySummaries.map(m => ({
      month: m.month, year: m.year,
      totalSales: m.totalSales.toString(),
      grossProfit: m.grossProfit.toString(),
      netProfit: m.netProfit.toString(),
      totalAssetsValue: m.totalAssetsValue.toString()
    }));

    // 6️⃣ Convert Decimals to strings
    Object.keys(aggregated).forEach(k => {
      if (aggregated[k] instanceof Decimal) aggregated[k] = aggregated[k].toString();
    });

    // 7️⃣ Add metadata
    aggregated.from = { month: months[0].month, year: months[0].year };
    aggregated.to = { month: months.at(-1).month, year: months.at(-1).year };
    aggregated.months = months.length;

    // Live snapshot totals
    aggregated.totalCustomers = await tx.customer.count();
    aggregated.totalProducts = await tx.product.count();

    return aggregated;
  });
};



