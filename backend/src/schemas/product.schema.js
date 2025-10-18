import { z } from "zod";
import { idSchema, nameSchema, positiveNumber } from "./common.schema.js";

const refine = (data) => (
    data.buyingPrice < data.sellingPrice, {
        message: "Buying price must be less than selling price",
    })

export const createProductSchema = z
    .object({
        name: nameSchema,
        category: z.string().optional(),
        brand: z.string().optional(),
        buyingPrice: positiveNumber("Buying price"),
        sellingPrice: positiveNumber("Selling price"),
        stockQuantity: positiveNumber("Initial stock").int({
            message: "Initial stock must be a number starting from 1",
        }),
        note: z.string().default(""),
        date: z.coerce.date({ error: "Date is required" }),
    })
    .refine(refine);

export const updateProductSchema = z.object({
    id: idSchema,
    name: nameSchema.optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    buyingPrice: positiveNumber("Buying price").optional(),
    sellingPrice: positiveNumber("Selling price").optional(),
}).refine(refine);

export const createProductStockSchema = z.object({
    id: idSchema,
    stockQuantity: positiveNumber("Stock quantity")
        .int({ message: "Stock quantity must be a whole number starting from 1" }),
    note: z.string().optional(),
    date: z.coerce.date({ error: "Date is required" }),
    type: z.preprocess(
        (val) => String(val).toUpperCase(),
        z.enum(["PURCHASE", "RETURN"], {
            error: "Stock Create Purpose is required",
        })
    ),
    direction: z.preprocess(
        (val) => String(val).toUpperCase(),
        z.enum(["IN", "OUT"], {
            error: "Stock Direction is required",
        })
    ),
});
