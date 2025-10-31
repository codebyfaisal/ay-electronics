import z from "zod";

export const idSchema = z.coerce.number({ error: "ID must be a number" });

export const nameSchema = z.preprocess(
    (val) => val.toLowerCase(),
    z.string({ error: "Name is required" })
        .min(2, { error: "Name must be at least 2 characters" })
)

export const saleTypeSchema = z.preprocess(
    (val) => typeof val === "string" ? val.toUpperCase() : val,
    z.enum(["CASH", "INSTALLMENT"]).default("INSTALLMENT"),
)

export const monthSchema = (entity) => z.coerce
    .number({ error: `${entity} month is required` })
    .min(1, { error: `Month must be at between 1 and 12` })
    .max(12, { error: `Month must be at between 1 and 12` });

export const yearSchema = (entity) => z.coerce
    .number({ error: `${entity} year is required` })
    .min(2020, { error: "Year must be at least 2020" })
    .max(new Date().getFullYear(), { error: "Year cannot be in the future" });

export const monthYearSchema = (entity) => z.object({
    sMonth: monthSchema(entity + " Start Month"),
    sYear: yearSchema(entity + " Start Year"),
    eMonth: monthSchema(entity + " End Month").optional(),
    eYear: yearSchema(entity + " End Year").optional(),
});

export const positiveNumber = (entity, message = null, min = 0, max = Infinity) =>
    z.coerce
        .number({ error: message || `${entity} is required` })
        .min(min, { error: `${entity} must be at least ${min}` })
        .max(max, { error: `${entity} must be at most ${max}` });

export const directionSchema = z.preprocess((val) =>
    typeof val === "string" ? val.toUpperCase() : val,
    z.enum(["IN", "OUT"]),
    { error: "Direction is required" }
);

export const dateSchema = (entity) =>
    z.coerce.date({ error: entity + "Date is required" });

export const noteSchema = z.string().default("");

export const cashFlowSchema = z.preprocess((val) =>
    typeof val === "string" ? val.toUpperCase() : val,
    z.enum(["EXPENSE", "CASH", "BANK", "DEBT"]),
    { error: "Payment method is required" }
);