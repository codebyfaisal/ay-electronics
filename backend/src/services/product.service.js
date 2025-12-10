// /..\backend\src\services\product.service.js
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
    await prisma.product.findUnique({
        where: { id },
        include: {
            stockTransaction: true
        }
    })

export const getProductDetails = async (id) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                sales: true,
                stockTransaction: {
                    orderBy: {
                        id: "desc",
                    },
                },
            },
        });

        if (!product) throw new AppError("Product not found", 404);

        const productOverview = {
            id: product.id,
            name: product.name,
            category: product.category,
            brand: product.brand,
            sellingPrice: new Decimal(product.sellingPrice),
            buyingPrice: new Decimal(product.stockTransaction[0]?.buyingPrice || 0),
            stockQuantity: product.stockQuantity,
            initialStockDate: product.stockTransaction.find(tx => tx.initial)?.date || null,
        };

        const purchaseTx = product.stockTransaction.filter(tx => tx.type === "PURCHASE");
        const returnOutTx = product.stockTransaction.filter(
            tx => tx.type === "SUPPLIER_RETURN" && tx.direction === "OUT"
        );

        const totalReturnSupplierCost = returnOutTx.reduce(
            (sum, tx) => sum.add(new Decimal(tx.quantity).mul(tx.buyingPrice)),
            new Decimal(0)
        );

        const totalPurchasedQty = purchaseTx.reduce((sum, tx) => sum + tx.quantity, 0) - returnOutTx.reduce((sum, tx) => sum + tx.quantity, 0);

        const totalPurchaseCost = purchaseTx.reduce(
            (sum, tx) => sum.add(new Decimal(tx.quantity).mul(tx.buyingPrice)),
            new Decimal(0)
        ) - totalReturnSupplierCost;

        const supplierReturns = returnOutTx.reduce((sum, tx) => sum + tx.quantity, 0);
        const expectedStockValue = new Decimal(product.stockQuantity).mul(product.sellingPrice);

        const inventorySummary = {
            totalPurchasedQty,
            totalPurchaseCost: Number(totalPurchaseCost),
            supplierReturns,
            expectedStockValue: Number(expectedStockValue),
        };

        const totalSales = product.sales.length;
        const totalSoldQty = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const totalRevenue = product.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        const totalDiscount = product.sales.reduce((sum, sale) => sum + Number(sale.discount), 0);
        const completedSales = product.sales.filter(sale => sale.status === "COMPLETED").length;
        const activeSales = product.sales.filter(sale => sale.status === "ACTIVE").length;

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
    } catch (err) {
        throw new AppError(err.message, 500);
    }
};

export const crtProduct = async (tx, data) => {
    const { note, date, buyingPrice, ...productData } = data

    delete productData.date;
    delete productData.note;
    delete productData.buyingPrice;

    const product = await tx.product.create({ data: productData });
    const { stockQuantity } = data;
    product.stockTransaction = await tx.stockTransaction.create({
        data: {
            productId: product.id,
            quantity: stockQuantity,
            direction: "IN",
            type: "PURCHASE",
            date,
            note: `INITIAL STOCK PURCHASE of ${stockQuantity} units`,
            initial: true,
            buyingPrice,
        }
    });

    return product
}

export const createProduct = async (data) =>
    await prisma.$transaction(async (tx) =>
        await crtProduct(tx, data)
    );

export const updateProduct = async (data) => {
    return await prisma.$transaction(async (tx) => {
        const { id, sellingPrice, ...updateData } = data;

        const currentProduct = await tx.product.findUnique({
            where: { id },
            select: {
                sellingPrice: true,
            },
        });

        if (!currentProduct) return null;

        if (sellingPrice !== undefined && new Decimal(sellingPrice).cmp(currentProduct.sellingPrice) !== 0) isPriceChangeRequested = true;

        const updated = await tx.product.update({
            where: { id },
            data: { ...updateData, sellingPrice }
        });
        return updated;
    });
}


export const deleteProduct = async (id) => {
    return await prisma.$transaction(async (tx) => {
        const hasSales = await tx.sale.count({
            where: { productId: id },
        });

        if (hasSales > 0)
            throw new AppError("Cannot delete product: When it is linked to one or more sales.", 409);

        await tx.stockTransaction.deleteMany({
            where: { productId: id },
        });

        const deletedProduct = await tx.product.delete({
            where: { id },
        });

        return deletedProduct;
    });
};