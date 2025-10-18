//..\src\services\stock.service.js
import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";

export const getStockTransactions = async (where, { page, limit }) =>
    await prisma.$transaction(async (tx) => {
        const stockTransactions = await prisma.stockTransaction.findMany({
            orderBy: { id: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.stockTransaction.count({ where });
        
        return { stockTransactions, total };
    });

export const createStock = async (data, tx, next) => {
    const { id: productId, stockQuantity, type, note, date, direction, saleId } = data;

    const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
            stockQuantity: true,
            stockTransaction: {
                where: { initial: true },
                select: { date: true },
            },
        },
    });

    if (!product) return next(new AppError("Product not found", 404));

    const productPurchaseDate = product.stockTransaction?.[0]?.date;
    if (productPurchaseDate && productPurchaseDate > date) {
        return next(
            new AppError(
                `New stock transaction date cannot be before ${productPurchaseDate.toLocaleDateString()} (product purchase date)`,
                400
            )
        );
    }

    const currentStock = product.stockQuantity;
    let newStockQuantity =
        direction === "IN"
            ? currentStock + stockQuantity
            : currentStock - stockQuantity;

    if (newStockQuantity < 0)
        throw new AppError("You cannot have negative stock. Current stock is " + currentStock, 400);

    const transaction = await tx.stockTransaction.create({
        data: {
            productId,
            quantity: stockQuantity,
            direction,
            type,
            note: note || null,
            date,
            saleId: saleId || null,
        },
    });

    await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newStockQuantity },
    });

    return transaction;
};

export const createStockTransaction = async (data, next) => {
    return await prisma.$transaction((tx) => createStock(data, tx, next));
};

export const deleteStockTransaction = async (id) => {
    return await prisma.$transaction(async (tx) => {
        const existingTransaction = await tx.stockTransaction.findUnique({
            where: { id },
        });

        if (!existingTransaction) throw new AppError("Transaction not found", 404);

        const { productId, quantity, direction } = existingTransaction;

        const adjustment = direction === "IN" ? -quantity : quantity;

        await tx.stockTransaction.delete({ where: { id } });

        const currentProduct = await tx.product.findUnique({
            where: { id: productId },
            select: { stockQuantity: true },
        });

        const newStockQuantity = currentProduct.stockQuantity + adjustment;

        if (newStockQuantity < 0)
            throw new AppError("Resulting stock cannot be negative", 400);

        const updatedProduct = await tx.product.update({
            where: { id: productId },
            data: { stockQuantity: newStockQuantity },
        });

        return updatedProduct;
    });
};
