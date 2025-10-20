// import prisma from "../db/prisma.js";

// function makeWhereCaseInsensitive(where) {
//     if (typeof where !== 'object' || where === null) return where;

//     const updated = Array.isArray(where) ? [] : {};

//     for (const [key, value] of Object.entries(where)) {
//         if (typeof value === 'string' || typeof value === 'number')
//             updated[key] = { contains: value, mode: 'insensitive' };
//         else updated[key] = makeWhereCaseInsensitive(value);
//     }

//     return updated;
// }

// export const getProducts = async (where, { page, limit }) => {
//     return await prisma.$transaction(async (tx) => {
//         const whereInsensitive = makeWhereCaseInsensitive(where)
//         const products = await tx.product.findMany({
//             where: whereInsensitive,
//             skip: (page - 1) * limit,
//             take: limit,
//             include: {
//                 stockTransaction: {
//                     where: { initial: true },
//                 }
//             },
//         });

//         products.map(product => {
//             product.purchaseDate = product.stockTransaction[0].date
//             delete product.stockTransaction
//             return product
//         })

//         const total = await tx.product.count({
//             where,
//         });

//         return {
//             products,
//             total,
//         }
//     })
// };

// export const getProduct = async (id) =>
//     await prisma.product.findUnique({ where: { id }, include: { stockTransaction: true } })

// export const getProductDetails = async (id) => {
//     const product = await prisma.product.findUnique({
//         where: { id },
//         include: {
//             sales: true,
//             stockTransaction: true,
//         },
//     });

//     if (!product) throw new Error("Product not found");

//     // Section 1: Product Overview
//     const productOverview = {
//         id: product.id,
//         name: product.name,
//         category: product.category,
//         brand: product.brand,
//         buyingPrice: Number(product.buyingPrice),
//         sellingPrice: Number(product.sellingPrice),
//         stockQuantity: product.stockQuantity,
//         createdAt: product.createdAt,
//     };

//     // Section 2: Inventory / Stock Summary
//     const purchaseTx = product.stockTransaction.filter(tx => tx.type === "PURCHASE");
//     const returnInTx = product.stockTransaction.filter(tx => tx.type === "RETURN" && tx.direction === "IN");
//     const returnOutTx = product.stockTransaction.filter(tx => tx.type === "RETURN" && tx.direction === "OUT");

//     const totalPurchasedQty = purchaseTx.reduce((sum, tx) => sum + tx.quantity, 0);
//     const totalPurchaseCost = totalPurchasedQty * Number(product.buyingPrice);
//     const productReturns = returnInTx.reduce((sum, tx) => sum + tx.quantity, 0);
//     const supplierReturns = returnOutTx.reduce((sum, tx) => sum + tx.quantity, 0);
//     const expectedStockValue = product.stockQuantity * Number(product.sellingPrice);

//     const inventorySummary = {
//         totalPurchasedQty,
//         totalPurchaseCost,
//         productReturns,
//         supplierReturns,
//         expectedStockValue,
//     };

//     // Section 3: Sales Summary
//     const totalSales = product.sales.length;
//     const totalSoldQty = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
//     const totalRevenue = product.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
//     const totalDiscount = product.sales.reduce((sum, sale) => sum + Number(sale.discount), 0);
//     const completedSales = product.sales.filter(sale => sale.status === 'COMPLETED').length;
//     const activeSales = product.sales.filter(sale => sale.status === 'ACTIVE').length;

//     const salesSummary = {
//         totalSales,
//         totalSoldQty,
//         totalRevenue,
//         totalDiscount,
//         completedSales,
//         activeSales,
//     };

//     // Combine all sections
//     return {
//         productOverview,
//         inventorySummary,
//         salesSummary,
//     };

// }

// export const createProduct = async (data, next) => {
//     return await prisma.$transaction(async (tx) => {
//         const { stockQuantity, note, date } = data

//         for (let key in data)
//             if (key === "date" || key === "note")
//                 delete data[key]

//         const product = await tx.product.create({ data });

//         await tx.stockTransaction.create({
//             data: {
//                 productId: product.id,
//                 quantity: stockQuantity,
//                 direction: "IN",
//                 type: "PURCHASE",
//                 date,
//                 note: note || null,
//                 initial: true
//             }
//         });

//         await tx.dailyTransaction.create({
//             data: {
//                 productId: product.id,
//                 direction: "IN",
//                 type: "CASH",
//                 date,
//                 note: note || `Initial stock of ${product.name}`,
//                 initial: true
//             }
//         });

//         return product
//     })
// }

// export const updateProduct = async (data) =>
//     await prisma.product.update({
//         where: { id: data.id },
//         data
//     });

// export const deleteProduct = async (id) =>
//     await prisma.product.delete({
//         where: { id }
//     });

import prisma from "../db/prisma.js";

function addContainsToWhere(where) {
    if (typeof where !== 'object' || where === null) return where;

    const updated = Array.isArray(where) ? [] : {};

    for (const [key, value] of Object.entries(where)) {
        if (typeof value === 'string' || typeof value === 'number')
            updated[key] = { contains: value };
        else updated[key] = addContainsToWhere(value);
    }

    return updated;
}

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
            // Check if stockTransaction exists before accessing index 0
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

    // Section 1: Product Overview
    const productOverview = {
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        buyingPrice: Number(product.buyingPrice),
        sellingPrice: Number(product.sellingPrice),
        stockQuantity: product.stockQuantity,
        createdAt: product.createdAt,
    };

    // Section 2: Inventory / Stock Summary
    const purchaseTx = product.stockTransaction.filter(tx => tx.type === "PURCHASE");
    const returnInTx = product.stockTransaction.filter(tx => tx.type === "RETURN" && tx.direction === "IN");
    const returnOutTx = product.stockTransaction.filter(tx => tx.type === "RETURN" && tx.direction === "OUT");

    const totalPurchasedQty = purchaseTx.reduce((sum, tx) => sum + tx.quantity, 0);
    // Calculation remains correct: Quantity * Unit Price
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

    // Section 3: Sales Summary
    const totalSales = product.sales.length;
    const totalSoldQty = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = product.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalDiscount = product.sales.reduce((sum, sale) => sum + Number(sale.discount), 0);
    const completedSales = product.sales.filter(sale => sale.status === 'COMPLETED').length;
    const activeSales = product.sales.filter(sale => sale.status === 'ACTIVE').length;

    const salesSummary = {
        totalSales,
        totalSoldQty,
        totalRevenue,
        totalDiscount,
        completedSales,
        activeSales,
    };

    // Combine all sections
    return {
        productOverview,
        inventorySummary,
        salesSummary,
    };

}

export const createProduct = async (data, next) => {
    return await prisma.$transaction(async (tx) => {
        const { stockQuantity, note, date, buyingPrice } = data // Destructure buyingPrice

        // 1. Prepare data for product creation (remove transient fields)
        const productData = { ...data };
        delete productData.date;
        delete productData.note;

        const product = await tx.product.create({ data: productData });

        // Calculate total cost of initial stock
        const totalCost = Number(buyingPrice) * Number(stockQuantity);

        // 2. Create Stock Transaction (IN)
        await tx.stockTransaction.create({
            data: {
                productId: product.id,
                quantity: stockQuantity,
                direction: "IN",
                type: "PURCHASE",
                date,
                note: note || null,
                initial: true
            }
        });

        // 3. FIX: Create DailyTransaction for the OUTFLOW (EXPENSE/CASH OUT) of initial stock purchase
        if (totalCost > 0) {
            await tx.dailyTransaction.create({
                data: {
                    // Assuming cost of inventory is recorded as EXPENSE/CASH OUTFLOW
                    type: "EXPENSE",
                    amount: totalCost, // Use the calculated total cost
                    direction: "OUT", // Money leaves the business
                    date,
                    note: note || `Initial purchase of ${stockQuantity} units of ${product.name}`,
                }
            });
        }
        // -------------------------------------------------------------------

        return product
    })
}

export const updateProduct = async (data) =>
    await prisma.product.update({
        where: { id: data.id },
        data
    });

export const deleteProduct = async (id) =>
    await prisma.product.delete({
        where: { id }
    });