import { z } from "zod";
import { idSchema, nameSchema } from "./common.schema.js";

const emailSchema = z.email({ error: "Email is invalid" });

const cnicSchema = z
  .string({ error: "CNIC is required" })
  .length(13, { error: "CNIC must be exactly 13 characters" });

const phoneSchema = z
  .string({ error: "Phone is required" })
  .min(9, { error: "Phone must be at least 9 digits" })
  .max(11, { error: "Phone must be at most 11 digits" });

const addressSchema = z.string({ error: "Address is required" });

export const createCustomerSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  cnic: cnicSchema,
  phone: phoneSchema,
  address: addressSchema,
});

export const updateCustomerSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  cnic: cnicSchema.optional(),
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
});
