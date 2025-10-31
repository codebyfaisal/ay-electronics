import { getProducts, createProduct, updateProduct, deleteProduct, getProductDetails } from "../services/product.service.js";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema.js";
import { getManyHandler, getOneHandler, deleteHandler, createHandler, updateHandler } from "./generic.controller.js";
import { idSchema } from "../schemas/common.schema.js";

export const handleGetProducts = getManyHandler(
    getProducts,
    "Products"
)

export const handleGetProductDetails = getOneHandler(
    idSchema,
    getProductDetails,
    "Product"
)

export const handleCreateProduct = createHandler(
    createProductSchema,
    createProduct,
    "Product"
)

export const handleUpdateProduct = updateHandler(
    updateProductSchema,
    updateProduct,
    "Product"
)

export const handleDeleteProduct = deleteHandler(
    idSchema,
    deleteProduct,
    "Product"
)