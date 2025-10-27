import z from "zod";
import { cashFlowSchema, dateSchema, directionSchema, idSchema, monthYearSchema, noteSchema, positiveNumber } from "./common.schema.js";

export const getInvestmentsSchema = monthYearSchema("Investments");

export const createInvestmentSchema = z.object({
    investor: z.string({ error: "Investor name is required" }),
    investment: positiveNumber("Investment amount"),
    date: dateSchema("Investment"),
    note: z.string().default(""),
});

export const updateInvestmentSchema = z.object({
    id: idSchema,
    investor: z.string().optional(),
    investment: positiveNumber("Investment amount").optional(),
    date: dateSchema("Investment").optional(),
    note: noteSchema.optional(),
});

export const createDailyTransactionSchema = z.object({
    type: cashFlowSchema,
    amount: positiveNumber("Amount"),
    note: noteSchema.default(""),
    date: dateSchema("Transaction"),
});

export const updateDailyTransactionSchema = z.object({
    id: idSchema,
    type: cashFlowSchema.optional(),
    direction: directionSchema.optional(),
    amount: positiveNumber("Amount").optional(),
    note: noteSchema.optional(),
    date: dateSchema("Transaction").optional(),
});

export const getSummarySchema = monthYearSchema("Summary");
