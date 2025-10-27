// /..\backend\src\services\installment.service.js
import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";
import dayjs from "dayjs";
import pkg from "@prisma/client";
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

export const payInstallment = async ({ id: saleId, paidDate, amount }, next) => {
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

        if (!sale) return next(new AppError("Sale not found.", 404));
        if (sale.status === "COMPLETED") return next(new AppError("Sale is already completed.", 400));
        if (paymentAmount.lte(0)) return next(new AppError("Payment amount must be greater than zero.", 400));
        if (paymentDate > new Date()) return next(new AppError("Paid date cannot be in the future.", 400));

        const totalDebt = new Decimal(sale.remainingAmount);
        if (paymentAmount.gt(totalDebt)) {
            return next(new AppError(`Payment amount (${paymentAmount.toNumber()}) exceeds remaining debt (${totalDebt.toNumber()}).`, 400));
        }

        const paidInstallments = sale.installments.filter(i => i.status === "PAID" || i.status === "PAID_LATE");
        const nextInstallments = sale.installments.filter(i => i.status === "UPCOMING" || i.status === "LATE");

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
            where: { saleId, status: "UPCOMING", dueDate: { lt: dayjs().startOf('day').toDate() } },
            data: { status: "LATE" },
        });

        if (newSaleStatus === "COMPLETED") {
            await tx.installment.updateMany({
                where: { saleId, status: { in: ["UPCOMING", "LATE"] } },
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
            await tx.installment.create({
                data: {
                    saleId: saleId,
                    amount: newRemainingAmount.toNumber(),
                    dueDate: dayjs(installmentToPay.dueDate).add(1, 'month').toDate(),
                    status: "UPCOMING"
                }
            })
            updatedSaleData.totalInstallments = { increment: 1 };
        }

        return await tx.sale.update({
            where: { id: saleId },
            data: updatedSaleData,
            include: saleInclude,
        });
    });
};

export const updateInstallment = async ({ id, amount, paidDate }, next) => {
    return await prisma.$transaction(async (tx) => {
        const installment = await tx.installment.findUnique({
            where: { id },
            include: { sale: true },
        });
        const sale = installment.sale;

        if (sale.status === "COMPLETED")
            return next(new AppError("Sale is already completed.", 400));
        if (installment.status !== "PAID" && installment.status !== "PAID_LATE")
            return next(new AppError("Only PAID installments can be edited.", 400));

        return tx.sale.update({
            where: { id: sale.id },
            data: { status: newSaleStatus },
            include: saleInclude,
        });
    });
};

export const getInstallments = async (
    { status = "UPCOMING" },
    { page = 1, limit = 10 } = {}
) => {
    return await prisma.$transaction(async (tx) => {
        let whereCondition = {};
        const todayStart = dayjs().startOf("day").toDate();
        const tenDaysFromNowEnd = dayjs().add(10, "day").endOf("day").toDate();

        if (status === "UPCOMING") {
            whereCondition = {
                status: "UPCOMING",
                dueDate: {
                    gte: todayStart,
                    lte: tenDaysFromNowEnd,
                },
            };
        } else if (status === "LATE") whereCondition = { status: "LATE" };
        else throw new Error("Invalid status. Must be either 'UPCOMING' or 'LATE'.");

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

            if (status === "UPCOMING") {
                const daysUntilDue = Math.max(
                    0,
                    Math.floor(dayjs(i.dueDate).diff(dayjs(), "day", true))
                );
                return {
                    ...base,
                    status: "UPCOMING",
                    schedule: `${i.sale.paidInstallments + 1}/${i.sale.totalInstallments}`,
                    daysUntilDue,
                };
            } else {
                const daysOverdue = Math.max(0, dayjs().diff(i.dueDate, "day"));
                return {
                    ...base,
                    status: "LATE",
                    daysOverdue,
                };
            }
        });

        return { installments: formatted, total };
    });
};

export const updateAllOverdueStatus = async () => {
    const todayStart = dayjs().startOf('day').toDate();

    return await prisma.$transaction(async (tx) => {
        const updateResult = await tx.installment.updateMany({
            where: {
                OR: [
                    { status: "LATE" },
                    { dueDate: { lt: todayStart } }
                ],
            },
            data: {
                status: "UPCOMING",
            },
        });

        return {
            count: updateResult.count,
            message: `${updateResult.count} installment(s) successfully marked as LATE.`
        };
    });
};