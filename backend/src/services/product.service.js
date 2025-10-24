import prisma from "../db/prisma.js";
import addContainsToWhere from "../utils/addConstrainsToWhere.js";
import AppError from "../utils/error.util.js";
import pkg from "@prisma/client";

const { Decimal } = pkg;

export const getProducts = async (where, { page, limit }) => {
    return await prisma.$transaction(async (tx) => {
        const wheres = addContainsToWhere(where)
        const products = await tx.product.findMany({
            where: wheres,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                stockTransaction: {
                    where: { initial: true },
                }
            },
        });

        products.map(product => {
            product.purchaseDate = product.stockTransaction[0]?.date || product.createdAt;
            delete product.stockTransaction
            return product
        })

        const total = await tx.product.count({
            where: {},
        });

        return {
            products,
            total,
        }
    })
};

export const getProduct = async (id) =>
    await prisma.product.findUnique({ where: { id }, include: { stockTransaction: true } })

export const getProductDetails = async (id) => {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            sales: true,
            stockTransaction: true,
        },
    });

    if (!product) throw new Error("Product not found");

    const productOverview = {
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        buyingPrice: Number(product.buyingPrice),
        sellingPrice: Number(product.sellingPrice),
        stockQuantity: product.stockQuantity,
    };

    const purchaseTx = product.stockTransaction.filter(tx => tx.type === "PURCHASE");
    const returnInTx = product.stockTransaction.filter(tx => tx.type === "RETURN" && tx.direction === "IN");
    const returnOutTx = product.stockTransaction.filter(tx => tx.type === "RETURN" && tx.direction === "OUT");

    const totalPurchasedQty = purchaseTx.reduce((sum, tx) => sum + tx.quantity, 0);
    const totalPurchaseCost = totalPurchasedQty * Number(product.buyingPrice);
    const productReturns = returnInTx.reduce((sum, tx) => sum + tx.quantity, 0);
    const supplierReturns = returnOutTx.reduce((sum, tx) => sum + tx.quantity, 0);
    const expectedStockValue = product.stockQuantity * Number(product.sellingPrice);

    const inventorySummary = {
        totalPurchasedQty,
        totalPurchaseCost,
        productReturns,
        supplierReturns,
        expectedStockValue,
    };

    const totalSales = product.sales.length;
    const totalSoldQty = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = product.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalDiscount = product.sales.reduce((sum, sale) => sum + Number(sale.discount), 0);
    const completedSales = product.sales.filter(sale => sale.status === 'COMPLETED').length;
    const activeSales = product.sales.filter(sale => sale.status === 'ACTIVE').length;
    productOverview.initialStockDate = product.stockTransaction.find(tx => tx.initial)?.date;

    const salesSummary = {
        totalSales,
        totalSoldQty,
        totalRevenue,
        totalDiscount,
        completedSales,
        activeSales,
    };

    return {
        productOverview,
        inventorySummary,
        salesSummary,
    };

}

export const createProduct = async (data, next) => {
    return await prisma.$transaction(async (tx) => {
        const { stockQuantity, note, date, buyingPrice } = data

        const productData = { ...data };
        delete productData.date;
        delete productData.note;

        const product = await tx.product.create({ data: productData });
        const totalCost = Number(buyingPrice) * Number(stockQuantity);

        await tx.stockTransaction.create({
            data: {
                productId: product.id,
                quantity: stockQuantity,
                direction: "IN",
                type: "PURCHASE",
                date,
                note: `Product #${product.id} Initial purchase of ${stockQuantity} units of ${product.name}`,
                initial: true
            }
        });

        if (totalCost > 0) {
            await tx.dailyTransaction.create({
                data: {
                    type: "CASH",
                    amount: totalCost,
                    direction: "OUT",
                    date,
                    note: note || `Initial purchase of ${stockQuantity} units of ${product.name}`,
                    productId: product.id
                }
            });
        }
        return product
    })
}

export const updateProduct = async (data, next) => {
    return await prisma.$transaction(async (tx) => {
        const { id, buyingPrice, sellingPrice, ...updateData } = data;

        const currentProduct = await tx.product.findUnique({
            where: { id },
            select: {
                buyingPrice: true,
                sellingPrice: true,
            },
        });

        if (!currentProduct) return null;
        let isPriceChangeRequested = false;

        if (buyingPrice !== undefined && new Decimal(buyingPrice).cmp(currentProduct.buyingPrice) !== 0) isPriceChangeRequested = true;

        if (sellingPrice !== undefined && new Decimal(sellingPrice).cmp(currentProduct.sellingPrice) !== 0) isPriceChangeRequested = true;

        if (isPriceChangeRequested) {
            const hasSales = await tx.sale.count({
                where: { productId: id },
            });

            const hasOtherStockTx = await tx.stockTransaction.count({
                where: {
                    productId: id,
                    initial: false
                },
            });

            if (hasSales > 0 || hasOtherStockTx > 0) {
                return next(
                    new AppError(
                        "Cannot change the price of a product that has existing sales or inventory movements. Please create a new product entry for the new pricing.",
                        409
                    )
                );
            }
        }

        const updated = await tx.product.update({
            where: { id },
            data: { ...updateData, buyingPrice, sellingPrice }
        });

        return updated;
    });
}

// export const deleteProduct = async (id, next) => {
//     return await prisma.$transaction(async (tx) => {
//         const hasSales = await tx.sale.count({
//             where: { productId: id },
//         });

//         if (hasSales > 0)
//             return next(new AppError("Cannot delete product: When it is linked to one or more sales.", 409));

//         await tx.dailyTransaction.deleteMany({
//             where: { productId: id },
//         });

//         await tx.stockTransaction.deleteMany({
//             where: { productId: id },
//         });

//         await tx.sales.deleteMany({
//             where: { productId: id },
//         });

//         const deletedProduct = await tx.product.delete({
//             where: { id },
//         });

//         return deletedProduct;
//     });
// };

// export const deleteProduct = async (id, next) => {
//     return await prisma.$transaction(async (tx) => {
//         // 1. Check for Existing Sales (STRICT RESTRICTION)
//         const hasSales = await tx.sale.count({
//             where: { productId: id },
//         });

//         if (hasSales > 0) {
//             return next(new AppError("Cannot delete product: It is linked to one or more sales.", 409));
//         }

//         // 2. Fetch all necessary data for reversal

//         const product = await tx.product.findUnique({
//             where: { id },
//             select: {
//                 buyingPrice: true,
//                 stockQuantity: true,
//                 stockTransaction: {
//                     where: { initial: true },
//                     select: { date: true, quantity: true },
//                 },
//             }
//         });

//         if (!product) throw new AppError("Product not found", 404);

//         const initialStockTx = product.stockTransaction[0];
//         const initialCost = new Decimal(product.buyingPrice).mul(initialStockTx?.quantity || 0);

//         // 3. Reverse Financial Transaction (Reverse the Cash/Bank OUTFLOW of the initial purchase)
//         if (initialStockTx && initialCost.gt(0)) {
//             // Find and delete the corresponding DailyTransaction that recorded the initial OUTFLOW.
//             // Note: This relies on the DailyTransaction being created for the initial purchase.
//             await tx.dailyTransaction.deleteMany({
//                 where: {
//                     productId: id,
//                     direction: "OUT", // It was an outflow/purchase
//                 },
//             });

//             // Reversing the outflow restores the Cash/Bank balance.
//         }

//         // 4. Delete related records

//         // Delete all stock transactions (initial purchase, returns)
//         await tx.stockTransaction.deleteMany({
//             where: { productId: id },
//         });

//         // Delete all remaining daily transactions linked to this product (should only be the initial one, but safe to run)
//         await tx.dailyTransaction.deleteMany({
//             where: { productId: id },
//         });

//         // Note: sales.deleteMany is redundant because hasSales > 0 check already passed.
//         // It's still safe, but we omit it for cleaner logic since the initial check ensures it won't delete anything.

//         // 5. Delete the Product
//         const deletedProduct = await tx.product.delete({
//             where: { id },
//         });

//         // 6. Restore Stock (If stockQuantity > 0, it means the initial Tx was IN)
//         // Since we are deleting the product, we only need to restore stock if the stock was non-zero
//         // at the time of deletion, although deleting the product essentially clears the whole inventory value anyway.
//         // As a safe measure, we ensure that if the stock was manually adjusted upward and not tracked
//         // by a deleted transaction, we don't need to update product.stockQuantity anymore as the record is gone.

//         // Final action is returning the deleted product.
//         return deletedProduct;
//     });
// };

// // ... (omitted stock service functions and schema) ...

// src/services/sale.service.js (or product.service.js)

// ... (omitted previous code)

export const deleteProduct = async (id, next) => {
    return await prisma.$transaction(async (tx) => {
        const hasSales = await tx.sale.count({
            where: { productId: id },
        });

        if (hasSales > 0)
            return next(new AppError("Cannot delete product: When it is linked to one or more sales.", 409));

        await tx.dailyTransaction.deleteMany({
            where: { productId: id, direction: "OUT", type: "CASH" },
        });

        await tx.stockTransaction.deleteMany({
            where: { productId: id },
        });

        const deletedProduct = await tx.product.delete({
            where: { id },
        });

        return deletedProduct;
    });
};