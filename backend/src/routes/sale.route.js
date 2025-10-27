import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.util.js";
import { handleGetSales, handleGetSale, handleCreateSale, handleDeleteSale } from "../controllers/sale.controller.js";
import { handleGetUpcomingInstallments, handlePayInstallment, handleUpdateInstallment } from "../controllers/installment.controller.js";
import { handleCreateOneShotSale } from "../services/oneShortSale.service.js";

const router = Router();

router.post("/oneshot", asyncHandler(handleCreateOneShotSale));

router.get("/installments", asyncHandler(handleGetUpcomingInstallments));
router.post("/:id/installments", asyncHandler(handlePayInstallment));
router.put("/installments/:id", asyncHandler(handleUpdateInstallment));

router.get("/", asyncHandler(handleGetSales));
router.get("/:id", asyncHandler(handleGetSale));
router.post("/", asyncHandler(handleCreateSale));
router.delete("/:id", asyncHandler(handleDeleteSale));

export default router;
