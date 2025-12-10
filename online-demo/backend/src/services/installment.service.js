// backend/src/services/installment.service.js
import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";
import dayjs from "dayjs";
import pkg from "@prisma/client";
import { recalculateSummaries } from "./summary.service.js";

const { Decimal } = pkg;

const saleInclude = {
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
};
const getSaleById = async (tx, saleId) => {
    const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: saleInclude,
    });
    if (!sale) throw new Error("Sale not found.");
    return sale;
};
const calculateSaleAmounts = (sale, paidInstallments, amount = 0) => {
    const total = Number(sale.totalAmount);
    const discount = Number(sale.discount);

    const paidInstallmentsAmount = paidInstallments.reduce(
        (acc, i) => acc + Number(i.amount),
        0
    );
    const newPaid = paidInstallmentsAmount + Number(amount);
    const remaining = total - discount - newPaid;
    const status = remaining <= 0 ? "COMPLETED" : sale.status === "PARTIAL" ? "PARTIAL" : "ACTIVE";
    if (newPaid > total) throw new Error("Paid amount cannot exceed total sale amount.");

    return {
        newPaidAmount: newPaid,
        newRemaining: remaining < 0 ?
            0 : remaining,
        status,
    };
};

export const payInstallment = async ({ id: saleId, paidDate, amount }) => {
    return await prisma.$transaction(async (tx) => {
        const paymentDate = new Date(paidDate);
        const paymentAmount = new Decimal(amount);

        const sale = await tx.sale.findUnique({
            where: { id: saleId },
            include: {
                installments: {
                    select: { id: true, amount: true, paidDate: true, dueDate: true, status: true },
                    orderBy: { dueDate: "asc" },
                },
            },
        });

        if (!sale) throw new AppError("Sale not found.", 404);
        if (sale.status === "COMPLETED") throw new AppError("Sale is already completed.", 400);
        if (paymentAmount.lte(0)) throw new AppError("Payment amount must be greater than zero.", 400);
        // if (paymentDate > new Date()) throw new AppError("Paid date cannot be in the future.", 400);

        const totalDebt = new Decimal(sale.remainingAmount);
        if (paymentAmount.gt(totalDebt))
            throw new AppError(`Payment amount (${paymentAmount.toNumber()}) exceeds remaining debt (${totalDebt.toNumber()}).`, 400);

        const paidInstallments = sale.installments.filter(i => i.status === "PAID" || i.status === "PAID_LATE");
        const nextInstallments = sale.installments.filter(i => i.status === "UPCOMING" || i.status === "LATE" || i.status === "PENDING");

        let installmentToPay = nextInstallments[0];

        const isLatePayment = installmentToPay.status === "LATE" || dayjs(paymentDate).isAfter(dayjs(installmentToPay.dueDate), 'day');
        const newStatus = isLatePayment ? "PAID_LATE" : "PAID";

        await tx.installment.update({
            where: { id: installmentToPay.id },
            data: {
                amount: paymentAmount.toNumber(),
                paidDate: paymentDate,
                status: newStatus
            },
        });

        const newPaidAmountTotal = new Decimal(sale.paidAmount).plus(paymentAmount);
        const newRemainingAmount = totalDebt.sub(paymentAmount);
        const newSaleStatus = newRemainingAmount.lte(0) ? "COMPLETED" : "ACTIVE";

        await tx.installment.updateMany({
            where: { saleId, status: { in: ["UPCOMING", "PENDING"] }, dueDate: { lt: dayjs().startOf('day').toDate() } },
            data: { status: "LATE" },
        });

        if (newSaleStatus === "COMPLETED") {
            await tx.installment.updateMany({
                where: { saleId, status: { in: ["UPCOMING", "LATE", "PENDING"] } },
                data: {
                    amount: 0,
                    status: "PAID",
                    paidDate: paymentDate
                },
            });
        }

        const updatedSaleData = {
            paidAmount: newPaidAmountTotal.toNumber(),
            remainingAmount: newRemainingAmount.toNumber(),
            paidInstallments: paidInstallments.length + 1,
            status: newSaleStatus,
        }

        if (newSaleStatus !== "COMPLETED" && nextInstallments.length === 1) {
            const nextDueDate = dayjs(installmentToPay.dueDate).add(1, 'month');
            const now = dayjs();

            let nextStatus = "UPCOMING";
            if (nextDueDate.isSame(now, 'month') && nextDueDate.isSame(now, 'year'))
                nextStatus = "PENDING";
            else if (nextDueDate.isBefore(now, 'day'))
                nextStatus = "LATE";

            await tx.installment.create({
                data: {
                    saleId: saleId,
                    amount: newRemainingAmount.toNumber(),
                    dueDate: nextDueDate.toDate(),
                    status: nextStatus
                }
            })
            updatedSaleData.totalInstallments = { increment: 1 };
        }

        const updatedSale = await tx.sale.update({
            where: { id: saleId },
            data: updatedSaleData,
            include: saleInclude,
        });

        // --- RECALCULATE SUMMARY (OPTION 3) ---
        await recalculateSummaries(tx, [paymentDate]);

        return updatedSale;
    });
};

export const updateInstallment = async ({ id, amount, paidDate }) => {
    return await prisma.$transaction(async (tx) => {
        const installment = await tx.installment.findUnique({
            where: { id },
            include: { sale: true },
        });

        if (!installment) throw new AppError("Installment not found.", 404);

        const sale = installment.sale;
        const oldPaidDate = installment.paidDate;
        if (sale.status === "COMPLETED")
            throw new AppError("Sale is already completed.", 400);

        if (installment.status !== "PAID" && installment.status !== "PAID_LATE")
            throw new AppError("Only PAID installments can be edited.", 400);

        const newPaymentAmount = new Decimal(amount);
        const oldPaymentAmount = new Decimal(installment.amount);
        const newPaymentDate = new Date(paidDate);

        await tx.installment.update({
            where: { id },
            data: {
                amount: newPaymentAmount.toNumber(),
                paidDate: newPaymentDate
            },
        });

        const difference = newPaymentAmount.sub(oldPaymentAmount);

        const newSalePaidAmount = new Decimal(sale.paidAmount).add(difference);
        const newSaleRemaining = new Decimal(sale.remainingAmount).sub(difference);

        const newSaleStatus = newSaleRemaining.lte(0) ? "COMPLETED" : "ACTIVE";

        const updatedSale = await tx.sale.update({
            where: { id: sale.id },
            data: {
                paidAmount: newSalePaidAmount.toNumber(),
                remainingAmount: newSaleRemaining.toNumber(),
                status: newSaleStatus,
            },
            include: saleInclude,
        });

        // --- RECALCULATE SUMMARY (OPTION 3) ---
        const datesToUpdate = [newPaymentDate];
        if (oldPaidDate) datesToUpdate.push(oldPaidDate);
        await recalculateSummaries(tx, datesToUpdate);

        return updatedSale;
    });
};

export const getInstallments = async (
    { status = "UPCOMING" },
    { page = 1, limit = 10 } = {}
) => {
    return await prisma.$transaction(async (tx) => {
        let whereCondition = {};
        const todayStart = dayjs().startOf("day").toDate();

        if (status === "UPCOMING") {
            const tenDaysFromNowEnd = dayjs().add(10, "day").endOf("day").toDate();

            whereCondition = {
                status: { in: ["UPCOMING", "PENDING"] },
                dueDate: {
                    gte: todayStart,
                    lte: tenDaysFromNowEnd,
                },
            };
        } else if (status === "PENDING") {
            whereCondition = { status: "PENDING" };
        } else if (status === "LATE") {
            whereCondition = { status: "LATE" };
        } else {
            whereCondition = { status: status };
        }

        const installments = await tx.installment.findMany({
            where: whereCondition,
            include: {
                sale: {
                    select: {
                        id: true,
                        totalInstallments: true,
                        paidInstallments: true,
                        customer: {
                            select: {
                                name: true,
                                phone: true
                            }
                        },
                    },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { dueDate: "asc" },
        });

        const total = await tx.installment.count({ where: whereCondition });

        const formatted = installments.map((i) => {
            const base = {
                id: i.sale.id,
                customerName: i.sale.customer.name,
                customerPhone: i.sale.customer.phone,
                amount: i.amount,
                dueDate: i.dueDate,
            };

            if (status === "UPCOMING" || status === "PENDING") {
                const daysUntilDue = Math.max(
                    0,
                    Math.ceil(dayjs(i.dueDate).diff(dayjs(), "day", true))
                );
                return {
                    ...base,
                    status: i.status,
                    schedule: `${i.sale.paidInstallments + 1}/${i.sale.totalInstallments}`,
                    daysUntilDue,
                };
            } else {
                const daysOverdue = Math.max(0, dayjs().diff(i.dueDate, "day"));
                return {
                    ...base,
                    status: i.status,
                    daysOverdue,
                };
            }
        });

        return { installments: formatted, total };
    });
};

export const updateAllOverdueStatus = async () => {
    const todayStart = dayjs().startOf('day').toDate();
    const currentMonthStart = dayjs().startOf('month').toDate();
    const currentMonthEnd = dayjs().endOf('month').toDate();

    return await prisma.$transaction(async (tx) => {
        const pendingUpdate = await tx.installment.updateMany({
            where: {
                status: "UPCOMING",
                dueDate: {
                    gte: currentMonthStart,
                    lte: currentMonthEnd
                }
            },
            data: {
                status: "PENDING",
            },
        });

        const lateUpdate = await tx.installment.updateMany({
            where: {
                status: { in: ["UPCOMING", "PENDING"] },
                dueDate: { lt: todayStart }
            },
            data: {
                status: "LATE",
            },
        });

        return {
            count: pendingUpdate.count + lateUpdate.count,
            message: `${pendingUpdate.count} updated to PENDING, ${lateUpdate.count} updated to LATE.`
        };
    });
};