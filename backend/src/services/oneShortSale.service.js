// import { Prisma, Decimal } from "@prisma/client";
// import prisma from "../db/prisma.js";
// import AppError from "../utils/error.util.js";
// import { successRes } from "../utils/response.util.js";
// import { createCustomerSchema } from "../schemas/customer.schema.js";
// import { createProductSchema, createProductStockSchema } from "../schemas/product.schema.js";
// import { createSaleSchema } from "../schemas/sale.schema.js";
// import zodError from "../utils/zod.error.js";
// import { recalculateSummaries } from "./summary.service.js";

// const parse = (schema, data) => {
//     const parseResult = schema.safeParse(data);
//     if (!parseResult.success) {
//         throw new AppError(zodError(parseResult), 400);
//     }
//     return parseResult.data;
// };

// export const handleCreateOneShotSale = async (req, res, next) => {
//     try {
//         const result = await prisma.$transaction(async (tx) => {
//             const customerData = parse(createCustomerSchema, req.body.customer);

//             let customer;
//             try {
//                 customer = await tx.customer.create({ data: customerData });
//             } catch (err) {
//                 if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
//                     customer = await tx.customer.findUnique({
//                         where: { cnic: customerData.cnic },
//                     });
//                 } else throw err;
//             }
//             if (!customer) throw new AppError("Failed to create or find customer", 400);

//             const productData = parse(createProductSchema, {
//                 ...req.body.product,
//                 date: req.body.sale.saleDate,
//                 stockQuantity: req.body.sale.quantity,
//             });

//             let product;
//             try {
//                 product = await tx.product.create({
//                     data: {
//                         name: productData.name,
//                         category: productData.category,
//                         sellingPrice: productData.sellingPrice,
//                         stockQuantity: productData.stockQuantity,
//                     },
//                 });

//                 const stockTx = await tx.stockTransaction.create({
//                     data: {
//                         productId: product.id,
//                         quantity: productData.stockQuantity,
//                         direction: "IN",
//                         type: "PURCHASE",
//                         date: productData.date,
//                         note: `INITIAL STOCK PURCHASE of ${productData.stockQuantity} units`,
//                         initial: true,
//                         buyingPrice: productData.buyingPrice,
//                     },
//                 });
//                 product.buyingPrice = stockTx.buyingPrice
//             } catch (err) {
//                 if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
//                     product = await tx.product.findUnique({
//                         where: { name: productData.name },
//                     });

//                     if (!product) throw new AppError("Existing product not found", 404);

//                     const lastPurchase = await tx.stockTransaction.findFirst({
//                         where: { productId: product.id, type: "PURCHASE" },
//                         orderBy: { date: 'desc' },
//                         select: { buyingPrice: true }
//                     });

//                     product.buyingPrice = lastPurchase?.buyingPrice || 0;

//                     if (product.stockQuantity < req.body.sale.quantity) {
//                         const diff = req.body.sale.quantity - product.stockQuantity;

//                         const stockInput = parse(createProductStockSchema, {
//                             id: product.id,
//                             stockQuantity: diff,
//                             type: "PURCHASE",
//                             date: productData.date || new Date(),
//                             buyingPrice: productData.buyingPrice,
//                         });

//                         const stockTx = await tx.stockTransaction.create({
//                             data: {
//                                 productId: stockInput.id,
//                                 quantity: stockInput.stockQuantity,
//                                 direction: "IN",
//                                 type: stockInput.type,
//                                 date: stockInput.date,
//                                 buyingPrice: stockInput.buyingPrice,
//                                 note: `PURCHASE of ${diff} units for sale OneShotSale`,
//                             },
//                         });

//                         await tx.product.update({
//                             where: { id: product.id },
//                             data: { stockQuantity: { increment: diff } },
//                         });

//                         product.buyingPrice = stockTx.buyingPrice;
//                     }
//                 } else throw err;
//             }
//             if (!product) throw new AppError("Failed to create or find product", 400);

//             const saleInput = parse(createSaleSchema, {
//                 ...req.body.sale,
//                 productId: product.id,
//                 customerId: customer.id
//             });

//             const {
//                 agreementNo: id,
//                 saleDate,
//                 saleType,
//                 quantity,
//                 discount: rawDiscount = 0,
//                 paidAmount: rawPaidAmount = 0,
//                 firstInstallment: rawFirstInstallment = 0,
//                 totalInstallments = 0,
//             } = saleInput;

//             const discount = new Decimal(rawDiscount);
//             const totalAmount = new Decimal(product.sellingPrice).mul(quantity);

//             let initialPayment = new Decimal(0);
//             let paidAmountTotal = new Decimal(0);
//             let remainingAmount = new Decimal(0);
//             let saleStatus = "ACTIVE";
//             let perInstallment = new Decimal(0);
//             let paidInstallments = 0;

//             if (saleType === "CASH") {
//                 initialPayment = rawPaidAmount > 0
//                     ? new Decimal(rawPaidAmount)
//                     : totalAmount.sub(discount);

//                 paidAmountTotal = initialPayment;
//                 remainingAmount = new Decimal(0);
//                 saleStatus = "COMPLETED";
//                 paidInstallments = 1;
//             } else if (saleType === "INSTALLMENT") {
//                 initialPayment = new Decimal(rawFirstInstallment);
//                 paidAmountTotal = initialPayment;
//                 remainingAmount = totalAmount.sub(discount).sub(paidAmountTotal);

//                 if (totalInstallments < 1)
//                     throw new AppError("At least one installment is required", 400);

//                 const remainingCount = totalInstallments - 1;
//                 if (remainingCount > 0)
//                     perInstallment = remainingAmount.div(remainingCount);
//                 saleStatus = remainingAmount.isZero() ? "COMPLETED" : "ACTIVE";
//                 paidInstallments = initialPayment.gt(0) ? 1 : 0;
//             }

//             if (paidAmountTotal.gt(totalAmount))
//                 throw new AppError("Paid amount cannot exceed total amount or Please verify may be product price has changed and already exists", 400);
//             if (discount.gt(totalAmount))
//                 throw new AppError("Discount cannot exceed total", 400);
//             if (product.stockQuantity < quantity)
//                 throw new AppError(`Product with name ${product.name} Already Exists.\nInsufficient stock: available ${product.stockQuantity}.\nPlease add more stock`, 400);

//             let sale = null;
//             try {
//                 sale = await tx.sale.create({
//                     data: {
//                         id,
//                         customerId: Number(customer.id),
//                         productId: Number(product.id),
//                         saleType,
//                         quantity,
//                         buyingPrice: Number(product.buyingPrice),
//                         sellingPrice: Number(product.sellingPrice),
//                         discount,
//                         totalAmount,
//                         perInstallment,
//                         totalInstallments,
//                         paidInstallments,
//                         paidAmount: paidAmountTotal,
//                         remainingAmount,
//                         saleDate: new Date(saleDate),
//                         status: saleStatus,
//                     },
//                 });
//             }
//             catch (err) {
//                 if (err instanceof Prisma.PrismaClientKnownRequestError)
//                     if (err.code === "P2002")
//                         throw new AppError("Sale with this agreementNo already exists", 409);
//                 throw err;
//             }

//             if (saleType === "INSTALLMENT" && totalInstallments > 0) {
//                 const installments = [];
//                 installments.push({
//                     saleId: Number(sale.id),
//                     amount: initialPayment,
//                     paidDate: new Date(saleDate),
//                     dueDate: new Date(saleDate),
//                     status: "PAID",
//                 });

//                 const remainingCount = totalInstallments - 1;
//                 const today = new Date(saleDate);

//                 for (let i = 0; i < remainingCount; i++) {
//                     let amount = perInstallment;
//                     if (i === remainingCount - 1) {
//                         const totalSoFar = perInstallment.mul(remainingCount - 1);
//                         amount = remainingAmount.sub(totalSoFar);
//                     }
//                     installments.push({
//                         saleId: Number(sale.id),
//                         amount,
//                         dueDate: new Date(today.getFullYear(), today.getMonth() + (i + 1), today.getDate()),
//                         status: "UPCOMING",
//                     });
//                 }

//                 await tx.installment.createMany({ data: installments });
//             }

//             await tx.stockTransaction.create({
//                 data: {
//                     productId: Number(product.id),
//                     quantity,
//                     direction: "OUT",
//                     type: "SALE",
//                     date: new Date(saleDate),
//                     saleId: Number(sale.id),
//                     note: `Sale #${sale.id} to ${customer.name}`,
//                     buyingPrice: product.buyingPrice,
//                 },
//             });

//             await tx.product.update({
//                 where: { id: Number(product.id) },
//                 data: { stockQuantity: { decrement: quantity } },
//             });

//             await recalculateSummaries(tx, [new Date(saleDate)]);

//             return sale;
//         });
//         return successRes(res, 200, true, "One-shot sale created successfully", { sale: result });
//     } catch (err) {
//         next(err);
//     }
// };
import { Prisma, Decimal } from "@prisma/client";
import prisma from "../db/prisma.js";
import AppError from "../utils/error.util.js";
import { successRes } from "../utils/response.util.js";
import { createCustomerSchema } from "../schemas/customer.schema.js";
import { createProductSchema, createProductStockSchema } from "../schemas/product.schema.js";
import { createSaleSchema } from "../schemas/sale.schema.js";
import zodError from "../utils/zod.error.js";
import { recalculateSummaries } from "./summary.service.js";

const parse = (schema, data) => {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
        throw new AppError(zodError(parseResult), 400);
    }
    return parseResult.data;
};

export const handleCreateOneShotSale = async (req, res, next) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const customerData = parse(createCustomerSchema, req.body.customer);

            let customer;
            try {
                customer = await tx.customer.create({ data: customerData });
            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                    customer = await tx.customer.findUnique({
                        where: { cnic: customerData.cnic },
                    });
                } else throw err;
            }
            if (!customer) throw new AppError("Failed to create or find customer", 400);

            const productData = parse(createProductSchema, {
                ...req.body.product,
                date: req.body.sale.saleDate,
                stockQuantity: req.body.sale.quantity,
            });

            let product;
            try {
                product = await tx.product.create({
                    data: {
                        name: productData.name,
                        category: productData.category,
                        sellingPrice: productData.sellingPrice,
                        stockQuantity: productData.stockQuantity,
                    },
                });

                const stockTx = await tx.stockTransaction.create({
                    data: {
                        productId: product.id,
                        quantity: productData.stockQuantity,
                        direction: "IN",
                        type: "PURCHASE",
                        date: productData.date,
                        note: `INITIAL STOCK PURCHASE of ${productData.stockQuantity} units`,
                        initial: true,
                        buyingPrice: productData.buyingPrice,
                    },
                });
                product.buyingPrice = stockTx.buyingPrice
            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                    product = await tx.product.findUnique({
                        where: { name: productData.name },
                    });

                    if (!product) throw new AppError("Existing product not found", 404);

                    const lastPurchase = await tx.stockTransaction.findFirst({
                        where: { productId: product.id, type: "PURCHASE" },
                        orderBy: { date: 'desc' },
                        select: { buyingPrice: true }
                    });

                    product.buyingPrice = lastPurchase?.buyingPrice || 0;

                    if (product.stockQuantity < req.body.sale.quantity) {
                        const diff = req.body.sale.quantity - product.stockQuantity;

                        const stockInput = parse(createProductStockSchema, {
                            id: product.id,
                            stockQuantity: diff,
                            type: "PURCHASE",
                            date: productData.date || new Date(),
                            buyingPrice: productData.buyingPrice,
                        });

                        const stockTx = await tx.stockTransaction.create({
                            data: {
                                productId: stockInput.id,
                                quantity: stockInput.stockQuantity,
                                direction: "IN",
                                type: stockInput.type,
                                date: stockInput.date,
                                buyingPrice: stockInput.buyingPrice,
                                note: `PURCHASE of ${diff} units for sale OneShotSale`,
                            },
                        });

                        await tx.product.update({
                            where: { id: product.id },
                            data: { stockQuantity: { increment: diff } },
                        });

                        product.buyingPrice = stockTx.buyingPrice;
                    }
                } else throw err;
            }
            if (!product) throw new AppError("Failed to create or find product", 400);

            const saleInput = parse(createSaleSchema, {
                ...req.body.sale,
                productId: product.id,
                customerId: customer.id
            });

            const {
                agreementNo: id,
                saleDate,
                saleType,
                quantity,
                discount: rawDiscount = 0,
                paidAmount: rawPaidAmount = 0,
                firstInstallment: rawFirstInstallment = 0,
                totalInstallments = 0,
            } = saleInput;

            const discount = new Decimal(rawDiscount);
            const totalAmount = new Decimal(product.sellingPrice).mul(quantity);

            let initialPayment = new Decimal(0);
            let paidAmountTotal = new Decimal(0);
            let remainingAmount = new Decimal(0);
            let saleStatus = "ACTIVE";
            let perInstallment = new Decimal(0);
            let paidInstallments = 0;

            if (saleType === "CASH") {
                initialPayment = rawPaidAmount > 0
                    ? new Decimal(rawPaidAmount)
                    : totalAmount.sub(discount);

                paidAmountTotal = initialPayment;
                remainingAmount = new Decimal(0);
                saleStatus = "COMPLETED";
                paidInstallments = 1;
            } else if (saleType === "INSTALLMENT") {
                initialPayment = new Decimal(rawFirstInstallment);
                paidAmountTotal = initialPayment;
                remainingAmount = totalAmount.sub(discount).sub(paidAmountTotal);

                if (totalInstallments < 1)
                    throw new AppError("At least one installment is required", 400);

                const remainingCount = totalInstallments - 1;
                if (remainingCount > 0)
                    perInstallment = remainingAmount.div(remainingCount);
                saleStatus = remainingAmount.isZero() ? "COMPLETED" : "ACTIVE";
                paidInstallments = initialPayment.gt(0) ? 1 : 0;
            }

            if (paidAmountTotal.gt(totalAmount))
                throw new AppError("Paid amount cannot exceed total amount or Please verify may be product price has changed and already exists", 400);
            if (discount.gt(totalAmount))
                throw new AppError("Discount cannot exceed total", 400);
           
            let sale = null;
            try {
                sale = await tx.sale.create({
                    data: {
                        id,
                        customerId: Number(customer.id),
                        productId: Number(product.id),
                        saleType,
                        quantity,
                        buyingPrice: Number(product.buyingPrice),
                        sellingPrice: Number(product.sellingPrice),
                        discount,
                        totalAmount,
                        perInstallment,
                        totalInstallments,
                        paidInstallments,
                        paidAmount: paidAmountTotal,
                        remainingAmount,
                        saleDate: new Date(saleDate),
                        status: saleStatus,
                    },
                });
            }
            catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError)
                    if (err.code === "P2002")
                        throw new AppError("Sale with this agreementNo already exists", 409);
                throw err;
            }

            if (saleType === "INSTALLMENT" && totalInstallments > 0) {
                const installments = [];
                installments.push({
                    saleId: Number(sale.id),
                    amount: initialPayment,
                    paidDate: new Date(saleDate),
                    dueDate: new Date(saleDate),
                    status: "PAID",
                });

                const remainingCount = totalInstallments - 1;
                const today = new Date(saleDate);

                for (let i = 0; i < remainingCount; i++) {
                    let amount = perInstallment;
                    if (i === remainingCount - 1) {
                        const totalSoFar = perInstallment.mul(remainingCount - 1);
                        amount = remainingAmount.sub(totalSoFar);
                    }
                    installments.push({
                        saleId: Number(sale.id),
                        amount,
                        dueDate: new Date(today.getFullYear(), today.getMonth() + (i + 1), today.getDate()),
                        status: "UPCOMING",
                    });
                }

                await tx.installment.createMany({ data: installments });
            }

            await tx.stockTransaction.create({
                data: {
                    productId: Number(product.id),
                    quantity,
                    direction: "OUT",
                    type: "SALE",
                    date: new Date(saleDate),
                    saleId: Number(sale.id),
                    note: `Sale #${sale.id} to ${customer.name}`,
                    buyingPrice: product.buyingPrice,
                },
            });

            await tx.product.update({
                where: { id: Number(product.id) },
                data: {
                    stockQuantity: { decrement: quantity },
                    sellingPrice: productData.sellingPrice,
                },
            });

            await recalculateSummaries(tx, [new Date(saleDate)]);

            return sale;
        });
        return successRes(res, 200, true, "One-shot sale created successfully", { sale: result });
    } catch (err) {
        next(err);
    }
};