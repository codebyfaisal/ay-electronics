import z from "zod";

export const idSchema = z.coerce.number({ error: "ID must be a number" });

export const nameSchema = z.preprocess(
    (val) => val.toLowerCase(),
    z.string({ error: "Name is required" })
        .min(2, { error: "Name must be at least 2 characters" })
)

export const positiveNumber = (fieldName) =>
    z.coerce
        .number({
            required_error: `${fieldName} is required`,
            invalid_type_error: `${fieldName} must be a number`,
        })
        .min(0, { message: `${fieldName} must be ≥ 0` });

export const directionSchema = z.preprocess((val) =>
    typeof val === "string" ? val.toUpperCase() : val,
    z.enum(["IN", "OUT"]),
    { error: "Direction is required" }
);

export const cashFlowSchema = z.preprocess((val) =>
    typeof val === "string" ? val.toUpperCase() : val,
    z.enum(["EXPENSE","CASH", "BANK", "DEBT"]),
    { error: "Payment method is required" }
);