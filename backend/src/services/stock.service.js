//..\src\services\stock.service.js
import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";

export const getProductStockTransactions = async ({ id }, { page, limit }) => {
    return await prisma.$transaction(async (tx) => {
        const productId = parseInt(id);
        const stockTransactions = await tx.stockTransaction.findMany({
            where: { productId },
            orderBy: { id: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await tx.stockTransaction.count({ where: { productId } });

        return { stockTransactions, total };
    })
}

export const getStockTransactions = async (where, { page, limit }) =>
    await prisma.$transaction(async (tx) => {
        const stockTransactions = await prisma.stockTransaction.findMany({
            where,
            orderBy: { id: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.stockTransaction.count({ where });

        return { stockTransactions, total };
    });

export const createStock = async (data, tx, next) => {
    const { id: productId, stockQuantity, type, note, date, direction, saleId, paymentMethod } = data;

    const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
            name: true,
            stockQuantity: true,
            buyingPrice: true,
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
        return new next(AppError(`${product.name} current stock is ` + currentStock, 400))

    const transaction = await tx.stockTransaction.create({
        data: {
            productId,
            quantity: stockQuantity,
            direction,
            type,
            note: `${product.name} # ${type === "RETURN" ? "Return to Supplier" : type} of ${stockQuantity} units. ${note}` || null,
            date,
        },
    });

    await tx.dailyTransaction.create({
        data: {
            type: paymentMethod,
            amount: Number(product.buyingPrice) * Number(stockQuantity),
            direction: "OUT",
            date,
            note: note || `${product.name} # Purchase of ${stockQuantity} units.`,
            stockId: transaction.id,
            productId,
        }
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

export const deleteStockTransaction = async (id, next) => {
    return await prisma.$transaction(async (tx) => {
        const existingTransaction = await tx.stockTransaction.findUnique({
            where: { id },
        });

        if (!existingTransaction) return new next(AppError("Transaction not found", 404))

        const { productId, quantity, direction } = existingTransaction;

        const adjustment = direction === "IN" ? -quantity : quantity;


        const product = await tx.product.findUnique({
            where: { id: productId },
            select: { stockQuantity: true },
        });
        const newStockQuantity = product.stockQuantity + adjustment;

        const d = await tx.dailyTransaction.findFirst({
            where: { stockId: id },
        });

        await tx.stockTransaction.delete({ where: { id } });

        if (d) await tx.dailyTransaction.delete({ where: { id: d.id } });

        if (newStockQuantity < 0)
            return new next(AppError(`${product.name} current stock is ` + currentStock, 400))

        const updatedProduct = await tx.product.update({
            where: { id: productId },
            data: { stockQuantity: newStockQuantity },
        });

        return updatedProduct;
    });
};
