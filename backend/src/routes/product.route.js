import { Router } from "express";
import { handleGetProducts, handleGetProductDetails, handleCreateProduct, handleUpdateProduct, handleDeleteProduct } from "../controllers/product.controller.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import { handleCreateStockTransaction, handleDeleteStockTransaction, handleGetProductStockTransactions } from "../controllers/stock.controller.js";

const router = Router();

router.get("/:id/stocks", asyncHandler(handleGetProductStockTransactions));
router.post("/:id/stocks", asyncHandler(handleCreateStockTransaction));
router.delete("/stocks/:id", asyncHandler(handleDeleteStockTransaction));

router.get("/", asyncHandler(handleGetProducts));
router.get("/:id", asyncHandler(handleGetProductDetails));
router.post("/", asyncHandler(handleCreateProduct));
router.put("/:id", asyncHandler(handleUpdateProduct));
router.delete("/:id", asyncHandler(handleDeleteProduct));

export default router;