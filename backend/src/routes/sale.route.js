import { Router } from "express";
import { handleGetSales, handleGetSale, handleCreateSale, handleDeleteSale, handleReturnSale } from "../controllers/sale.controller.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import { handlePayInstallment, handleUpdateInstallment } from "../controllers/installment.controller.js";

const router = Router();

router.post("/:id/installments", asyncHandler(handlePayInstallment));
router.put("/installments/:id", asyncHandler(handleUpdateInstallment));

router.put("/:id/return", handleReturnSale);

router.get("/", asyncHandler(handleGetSales));
router.get("/:id", asyncHandler(handleGetSale));
router.post("/", asyncHandler(handleCreateSale));
router.delete("/:id", asyncHandler(handleDeleteSale));

export default router;
