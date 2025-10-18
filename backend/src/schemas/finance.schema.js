import z from "zod";
import { cashFlowSchema, directionSchema, idSchema, positiveNumber } from "./common.schema.js";

export const getInvestmentsSchema = z.object({
    month: z.coerce.number().optional(),
    year: z.coerce.number().optional(),
});

export const createInvestmentSchema = z.object({
    investor: z.string({ error: "Investor name is required" }),
    investment: positiveNumber("Investment amount"),
    date: z.coerce.date({ error: "Investment Date is required" }),
    note: z.string().default(""),
});

export const updateInvestmentSchema = z.object({
    id: idSchema,
    investor: z.string().optional(),
    investment: positiveNumber("Investment amount").optional(),
    date: z.coerce.date().optional(),
    note: z.string().optional(),
});

export const createDailyTransactionSchema = z.object({
    type: cashFlowSchema,
    direction: directionSchema,
    amount: positiveNumber("Amount"),
    note: z.string().default("-"),
    date: z.coerce.date({ error: "Date is required" }),
});

export const updateDailyTransactionSchema = z.object({
    id: idSchema,
    type: cashFlowSchema.optional(),
    direction: directionSchema.optional(),
    amount: positiveNumber("Amount").optional(),
    note: z.string().optional(),
    date: z.coerce.date().optional(),
});

export const createMonthlySummarySchema = z.object({
    month: z.coerce
        .number({ error: "Month is required" })
        .min(1, "Month must be between 1 and 12")
        .max(12, "Month must be between 1 and 12"),
    year: z.coerce
        .number({ error: "Year is required" })
        .max(new Date().getFullYear(), "Year cannot be in the future"),
});

export const getSummaryByMonthSchema = z.object({
    startM: z.coerce
        .number({ error: "Start Month is required and must be between 1 and 12" })
        .min(1, "Start Month must be between 1 and 12")
        .max(12, "Start Month must be between 1 and 12"),
    startY: z.coerce
        .number({ error: "Start Year is required" })
        .max(new Date().getFullYear(), "Year cannot be in the future"),
    endM: z.coerce
        .number({ error: "End Month is required and must be between 1 and 12" })
        .min(1, "End Month must be between 1 and 12")
        .max(12, "End Month must be between 1 and 12")
        .optional(),
    endY: z.coerce
        .number({ error: "End Year is required" })
        .max(new Date().getFullYear(), "Year cannot be in the future")
        .optional(),
});
