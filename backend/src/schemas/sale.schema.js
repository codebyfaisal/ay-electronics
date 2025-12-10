import z from "zod";
import { dateSchema, idSchema, positiveNumber, saleTypeSchema } from "./common.schema.js";

export const createSaleSchema = z
    .object({
        agreementNo: positiveNumber("Agreement No.", null, 1),
        customerId: positiveNumber("Customer ID", null, 1),
        productId: positiveNumber("Product ID", null, 1),
        saleDate: dateSchema("Sale"),
        saleType: saleTypeSchema,
        quantity: positiveNumber("Quantity").default(1),
        discount: z.coerce.number().min(0, "Discount must be equal or greater than 0").default(0),
        paidAmount: z.coerce.number().min(0, "Paid amount must be equal or greater than 0").default(0),
        firstInstallment: z.coerce
            .number()
            .min(0, "First installment must be equal or greater than 0")
            .default(0),
        totalInstallments: positiveNumber("Total installments", null, 1).default(1),
    })
    .refine(
        (data) =>
            (data.saleType === "INSTALLMENT" && data.firstInstallment > 0) ||
            (data.saleType === "CASH" && data.paidAmount > 0),
        {
            message: ({ input: { saleType } }) => `When SaleType is '${saleType}', ${saleType === "INSTALLMENT" ? "first Installment will be must" : "paidAmount must be greater than 0"}`,
            path: ["saleType"],
        }
    );

export const installmentSchema = z.object({
    id: idSchema,
    amount: positiveNumber("Installment amount", null, 1).optional(),
    paidDate: dateSchema("Installment amount"),
});

export const updateInstallmentSchema = z.object({
    id: idSchema,
    amount: positiveNumber("Installment amount", null, 1).optional(),
    paidDate: dateSchema("Installment amount").optional(),
});

