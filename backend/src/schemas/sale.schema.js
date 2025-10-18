import z from "zod";
import { idSchema } from "./common.schema.js";

export const createSaleSchema = z.object({
    customerId: idSchema,
    productId: idSchema,
    saleDate: z.coerce.date({ error: "Sale date is required" }),
    saleType: z.preprocess(
        (val) => typeof val === "string" ? val.toUpperCase() : val,
        z.enum(["CASH", "INSTALLMENT"]).default("CASH")
    ),
    paymentMethod: z.preprocess(
        (val) => typeof val === "string" ? val.toUpperCase() : val,
        z.enum(["CASH", "BANK"]).default("CASH"),
        { error: "Payment method is required" }
    ),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
    discount: z.coerce.number().min(0, "Discount must be equal or greater than 0").default(0),
    paidAmount: z.coerce.number().min(0, "Paid amount must be equal or greater than 0").default(0),
    downPayment: z.coerce.number().min(0, "Down payment must be equal or greater than 0").default(0),
    totalInstallments: z.coerce.number().min(1).default(10).optional(),
});

export const returnSaleSchema = z.object({
    id: idSchema,
    date: z.coerce.date({ error: "Return date is required" }),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
    refundMethod: z.enum(["CASH", "BANK"]).default("CASH"),
    note: z.string().default(""),
})

export const installmentSchema = z.object({
    id: idSchema,
    amount: z.coerce.number().min(1, "Amount must be greater than 0").optional(),
    paidDate: z.coerce.date({ error: "Date is required" }),
});

export const updateInstallmentSchema = z.object({
    id: idSchema,
    amount: z.coerce.number().min(1, "Amount must be greater than 0").optional(),
    paidDate: z.coerce.date().optional(),
});

