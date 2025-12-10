// src/services/customer.service.js
import prisma from "../db/prisma.js";
import pkg from "@prisma/client";
import addContainsToWhere from "../utils/addConstrainsToWhere.js";
import AppError from "../utils/error.util.js";
const { Decimal } = pkg;

export const getCustomers = async (where, { page, limit }) => {
    where = addContainsToWhere(where);
    const customers = await prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
    });
    const total = await prisma.customer.count({ where });

    return { customers, total };
};

export const getCustomer = async (id) => {
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            sales: {
                select: {
                    id: true,
                    totalAmount: true,
                    paidAmount: true,
                    remainingAmount: true,
                    discount: true,
                    status: true,
                    saleType: true,
                    productId: true,
                },
            },
        },
    });
    if (!customer) return null;

    let totalPurchaseValue = new Decimal(0);
    let totalPaidAmount = new Decimal(0);
    let totalDiscountReceived = new Decimal(0);
    let totalRemainingBalance = new Decimal(0);
    const statusCounts = { ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
    const saleTypeCounts = { CASH: 0, INSTALLMENT: 0 };
    const uniqueProductIds = new Set();

    for (const sale of customer.sales) {
        totalPurchaseValue = totalPurchaseValue.plus(sale.totalAmount);
        totalPaidAmount = totalPaidAmount.plus(sale.paidAmount);
        totalDiscountReceived = totalDiscountReceived.plus(sale.discount);
        totalRemainingBalance = totalRemainingBalance.plus(sale.remainingAmount);

        statusCounts[sale.status] = (statusCounts[sale.status] || 0) + 1;
        saleTypeCounts[sale.saleType] = (saleTypeCounts[sale.saleType] || 0) + 1;

        uniqueProductIds.add(sale.productId);
    }

    return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        cnic: customer.cnic,
        phone: customer.phone,
        address: customer.address,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,

        metrics: {
            totalPurchaseValue: totalPurchaseValue.toNumber(),
            totalPaidAmount: totalPaidAmount.toNumber(),
            totalDiscountReceived: totalDiscountReceived.toNumber(),
            totalRemainingBalance: totalRemainingBalance.toNumber(),
            totalUniqueProducts: uniqueProductIds.size,
            salesActive: statusCounts.ACTIVE,
            salesCompleted: statusCounts.COMPLETED,
            salesCancelled: statusCounts.CANCELLED,
            salesCash: saleTypeCounts.CASH,
            salesInstallments: saleTypeCounts.INSTALLMENT,
        },
    };
};

export const createCustomer = async (data) =>
    await prisma.customer.create({ data });

export const updateCustomer = async (data) =>
    await prisma.customer.update({
        where: { id: data.id },
        data,
    });

export const deleteCustomer = async (id) => {
    const hasSales = await prisma.sale.count({
        where: { customerId: id },
    });

    if (hasSales > 0)
        throw new AppError("Cannot delete customer.\nWhen it is linked to one or more sales.", 409)

    return await prisma.customer.delete({ where: { id } });
}