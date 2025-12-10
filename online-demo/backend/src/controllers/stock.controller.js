import { createStockTransaction, deleteStockTransaction, getProductStockTransactions } from "../services/stock.service.js";
import { idSchema } from "../schemas/common.schema.js";
import { createProductStockSchema } from "../schemas/product.schema.js";
import { createHandler, deleteHandler, getManyHandler } from "./generic.controller.js";

export const handleGetProductStockTransactions = getManyHandler(
    getProductStockTransactions,
    "Stock"
)

export const handleCreateStockTransaction = createHandler(
    createProductStockSchema,
    createStockTransaction,
    "Stock"
)

export const handleDeleteStockTransaction = deleteHandler(
    idSchema,
    deleteStockTransaction,
    "Stock"
)
