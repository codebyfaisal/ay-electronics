import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";

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
    const down = Number(sale.downPayment);
    const discount = Number(sale.discount);

    const paidInstallmentsAmount = paidInstallments.reduce(
        (acc, i) => acc + Number(i.amount),
        0
    );

    const newPaid = paidInstallmentsAmount + down + Number(amount);
    const remaining = total - discount - newPaid;
    const status = remaining <= 0 ? "COMPLETED" : sale.status === "PARTIAL" ? "PARTIAL" : "ACTIVE";

    if (newPaid > total) throw new Error("Paid amount cannot exceed total sale amount.");

    return {
        newPaidAmount: newPaid,
        newRemaining: remaining < 0 ? 0 : remaining,
        status,
    };
};

export const payInstallment = async ({ id: saleId, paidDate, amount, paymentMethod }, next) => {
    return await prisma.$transaction(async (tx) => {
        const sale = await getSaleById(tx, saleId);

        if (sale.status === "COMPLETED")
            return next(new AppError("Sale is already completed.", 400));
        else if (sale.status === "RETURNED")
            return next(new AppError("Sale is already returned.", 400));

        const paid = sale.installments.filter((i) => i.status === "PAID");
        const pending = sale.installments.filter((i) => i.status === "PENDING");

        if (!pending.length) return next(new AppError("No pending installments found.", 400));

        const installmentToPay = pending[0];

        if (paidDate < sale.saleDate)
            return next(new AppError(`Paid date cannot be before ${sale.saleDate.toLocaleDateString()} sale date`, 400));
        if (paidDate > new Date()) return next(new AppError("Paid date cannot be in the future.", 400));

        if (paidDate < sale.saleDate)
            return next(new AppError(`Paid date cannot be before ${sale.saleDate.toLocaleDateString()}.`, 400));

        const { newPaidAmount, newRemaining, status } = calculateSaleAmounts(
            sale,
            paid,
            amount
        );

        await tx.installment.update({
            where: { id: installmentToPay.id },
            data: { amount, paidDate, status: "PAID" },
        });

        await tx.installment.updateMany({
            where: { saleId, status: "PENDING", dueDate: { lt: new Date() } },
            data: { status: "LATE" },
        });

        console.log(installmentToPay);

        if (status === "COMPLETED") {
            await tx.installment.updateMany({
                where: {
                    saleId, status: "PENDING",
                    NOT: {
                        id: installmentToPay.id
                    }
                },
                data: {
                    amount: 0,
                    status: "PAID",
                    paidDate
                },
            })
        }

        await tx.dailyTransaction.create({
            data: {
                type: paymentMethod,
                direction: "IN",
                amount: amount,
                date: paidDate,
                note: `Sale #${sale.id} installment paid`,
                saleId: sale.id
            }
        });

        return await tx.sale.update({
            where: { id: saleId },
            data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemaining,
                paidInstallments: paid.length + 1,
                status,
            },
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
        else if (sale.status === "RETURNED")
            return next(new AppError("Sale is already returned.", 400));

        if (!installment)
            return next(new AppError("Installment not found.", 404));
        if (installment.status !== "PAID")
            return next(new AppError("Only PAID installments can be edited.", 400));

        if (paidDate < sale.saleDate)
            return next(new AppError(
                `Paid date cannot be before ${sale.saleDate.toLocaleDateString()} sale date`
            ))
        if (paidDate > new Date())
            return next(new AppError("Paid date cannot be in the future.", 400));

        const otherPaid = await tx.installment.findMany({
            where: { saleId: sale.id, status: "PAID", NOT: { id } },
            select: { amount: true },
        });

        const { newPaidAmount, newRemaining, status } = calculateSaleAmounts(
            sale,
            otherPaid,
            amount
        );

        await tx.installment.update({
            where: { id },
            data: { amount: amount, paidDate: paidDate },
        });

        await tx.dailyTransaction.updateMany({
            where: { installmentId: id },
            data: { amount, date: paidDate },
        });

        if (status === "COMPLETED") {
            await tx.installment.updateMany({
                where: { saleId: sale.id, status: "PENDING" },
                data: {
                    amount: 0,
                    status: "PAID",
                    paidDate
                },
            })
        } else {
            const installments = await tx.installment.findMany({
                where: { saleId: sale.id, status: "PAID", amount: 0 },
                orderBy: { dueDate: "asc" },
                select: {
                    amount: true, dueDate: true,
                },
            })
            for (let i = 0; i < installments.length; i++) {
                await tx.installment.updateMany({
                    where: { saleId: sale.id, status: "PAID", amount: 0, dueDate: installments[i].dueDate },
                    data: {
                        status: "PENDING",
                        paidDate: null,
                    },
                });
            }
        }

        return await tx.sale.update({
            where: { id: sale.id },
            data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemaining,
                status,
            },
            include: saleInclude,
        });
    });
};
