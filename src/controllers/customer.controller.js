import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "../services/customer.service.js";
import { createHandler, deleteHandler, getManyHandler, getOneHandler, updateHandler } from "./generic.controller.js";
import { createCustomerSchema, updateCustomerSchema } from "../schemas/customer.schema.js";
import { idSchema } from "../schemas/common.schema.js";

export const handleGetCustomers = getManyHandler(
    getCustomers,
    "Customers"
)

export const handleGetCustomer = getOneHandler(
    idSchema,
    getCustomer,
    "Customer"
)

export const handleCreateCustomer = createHandler(
    createCustomerSchema,
    createCustomer,
    "Customer"
)

export const handleUpdateCustomer = updateHandler(
    updateCustomerSchema,
    updateCustomer,
    "Customer"
)

export const handleDeleteCustomer = deleteHandler(
    idSchema,
    deleteCustomer,
    "Customer"
)