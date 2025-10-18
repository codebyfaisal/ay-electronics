import { payInstallment, updateInstallment } from "../services/installment.service.js";
import { installmentSchema, updateInstallmentSchema } from "../schemas/sale.schema.js";
import { updateHandler } from "./generic.controller.js";

export const handlePayInstallment = updateHandler(
    installmentSchema,
    payInstallment,
    "Sale or Installment",
);

export const handleUpdateInstallment = updateHandler(
    updateInstallmentSchema,
    updateInstallment,
    "Sale or Installment",
);