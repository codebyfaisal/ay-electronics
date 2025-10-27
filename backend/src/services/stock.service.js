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
    const { id: productId, stockQuantity, type, date, buyingPrice } = data;
    let direction = type === "SUPPLIER_RETURN" ? "OUT" : "IN";

    const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
            name: true,
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

    if (direction === "IN" && (!buyingPrice || buyingPrice <= 0))
        return next(new AppError("Buying price is required for stock inflow transaction", 400));

    const currentStock = product.stockQuantity;
    let newStockQuantity =
        direction === "IN"
            ?
            currentStock + stockQuantity
            : currentStock - stockQuantity;
    if (newStockQuantity < 0)
        return next(new AppError(`${product.name} current stock is ` + currentStock, 400))

    let finalNote = `${type} ${type === "SUPPLIER_RETURN" ? "to" : "of"} ${stockQuantity} units`

    const stockData = {
        productId,
        quantity: stockQuantity,
        direction,
        type,
        date,
        buyingPrice: buyingPrice,
    }

    if (product.stockTransaction.length === 0) {
        stockData.initial = true;
        finalNote = `INITIAL PURCHASE of ${stockQuantity} units`
    }
    finalNote += data.note ? ` | Note: ${data.note}` : "";

    stockData.note = finalNote;
    const transaction = await tx.stockTransaction.create({ data: stockData });

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

        if (!existingTransaction) return next(new AppError("Transaction not found", 404))

        const { productId, quantity, direction, initial, date } = existingTransaction;

        if (existingTransaction.saleId !== null)
            return next(new AppError("Cannot delete: This stock transaction is directly linked to a Sale record.", 409));

        if (initial) {
            const subsequentTxCount = await tx.stockTransaction.count({
                where: {
                    productId: productId,
                    date: { gt: date },
                }
            });
            if (subsequentTxCount > 0)
                return next(new AppError("Cannot delete: Initial stock cannot be deleted if subsequent inventory movements or sales exist.", 409));
        }

        const adjustment = direction === "IN" ? -quantity :
            quantity;

        const product = await tx.product.findUnique({
            where: { id: productId },
            select: { stockQuantity: true },
        });
        const newStockQuantity = product.stockQuantity + adjustment;

        await tx.stockTransaction.delete({ where: { id } });

        if (newStockQuantity < 0)
            return next(new AppError(`Stock rollback failed: Deletion results in negative stock count for ${product.name}.`, 409))

        const updatedProduct = await tx.product.update({
            where: { id: productId },
            data: { stockQuantity: newStockQuantity },
        });

        return updatedProduct;
    });
};