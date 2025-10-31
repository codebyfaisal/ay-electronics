import express from "express";
import { handleCreateInvestment, handleCreateDailyTransaction, handleGetInvestments, handleDeleteInvestment, handleGetDailyTransaction, handleUpdateDailyTransaction, handleDeleteDailyTransaction, handleDeleteSummary, handleGetSummaries, handleGetSummary, handleUpdateInvestment } from "../controllers/finance.controller.js";
import asyncHandler from "../utils/asyncHandler.util.js";

const router = express.Router();

router.get("/investments", asyncHandler(handleGetInvestments));
router.put("/investments/:id", asyncHandler(handleUpdateInvestment));
router.post("/investments", asyncHandler(handleCreateInvestment));
router.delete("/investments/:id", asyncHandler(handleDeleteInvestment));

router.get("/daily-transactions", asyncHandler(handleGetDailyTransaction));
router.post("/daily-transactions", asyncHandler(handleCreateDailyTransaction));
router.put("/daily-transactions/:id", asyncHandler(handleUpdateDailyTransaction));
router.delete("/daily-transactions/:id", asyncHandler(handleDeleteDailyTransaction));

router.get("/summary", asyncHandler(handleGetSummaries));
router.get("/dashboard", asyncHandler(handleGetSummary));
router.delete("/summary/:id", asyncHandler(handleDeleteSummary));

export default router;