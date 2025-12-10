import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.util.js";
import { handleGetCustomers, handleGetCustomer, handleCreateCustomer, handleUpdateCustomer, handleDeleteCustomer } from "../controllers/customer.controller.js";

const router = Router();

router.get("/", asyncHandler(handleGetCustomers));
router.get("/:id", asyncHandler(handleGetCustomer));
router.post("/", asyncHandler(handleCreateCustomer));
router.put("/:id", asyncHandler(handleUpdateCustomer));
router.delete("/:id", asyncHandler(handleDeleteCustomer));

export default router;