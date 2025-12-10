// /..\backend\src\schemas\product.schema.js
import { z } from "zod";
import { dateSchema, idSchema, nameSchema, noteSchema, positiveNumber } from "./common.schema.js";

const refine = (data) => {
    const bp = data.buyingPrice;
    const sp = data.sellingPrice;

    if (bp !== undefined && sp !== undefined) return sp > bp;
    return true;
}
const refineMessage = "Buying price must be less than selling price";

export const createProductSchema = z
    .object({
        name: nameSchema,
        category: z.string().optional(),
        brand: z.string().optional(),
        buyingPrice: positiveNumber("Buying price"),
        sellingPrice: positiveNumber("Selling price"),
        stockQuantity: positiveNumber("Initial stock quantity", null, 1).int({
            message: "Initial stock must be a whole number starting from 1",
        }),
        note: noteSchema.optional(),
        date: dateSchema("Product Purchase"),
    })
    .refine(refine, { message: refineMessage });

export const updateProductSchema = z.object({
    id: idSchema,
    name: nameSchema.optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    sellingPrice: positiveNumber("Selling price").optional(),
})
    .refine(refine, { message: refineMessage });

export const createProductStockSchema = z.object({
    id: idSchema,
    stockQuantity: positiveNumber("Stock quantity")
        .int({ message: "Stock quantity must be a whole number starting from 1" }),
    date: dateSchema("Stock"),
    buyingPrice: positiveNumber("Buying price"),
    type: z.preprocess(
        (val) => String(val).toUpperCase(),
        z.enum(["PURCHASE", "SUPPLIER"], {
            error: "Stock Create Purpose is required",
        })
    ),
});
