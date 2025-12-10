import { createSaleSchema } from "../schemas/sale.schema.js";
import { idSchema } from "../schemas/common.schema.js";
import { getSales, getSale, createSale, deleteSale } from "../services/sale.service.js";
import { getCustomer } from "../services/customer.service.js";
import { getProduct } from "../services/product.service.js";
import zodError from "../utils/zod.error.js";
import AppError from "../utils/error.util.js";
import catchError from "../utils/catchError.util.js";
import { successRes } from "../utils/response.util.js";
import { Prisma } from "@prisma/client";
import { deleteHandler, getManyHandler, getOneHandler } from "./generic.controller.js";

export const handleGetSales = getManyHandler(
    getSales,
    "Sales"
)

export const handleGetSale = getOneHandler(
    idSchema,
    getSale,
    "Sale"
)

export const handleCreateSale = async (req, res, next) => {
    console.log(req.body);
    const parseResult = createSaleSchema.safeParse(req.body);

    if (!parseResult.success)
        return next(new AppError(zodError(parseResult), 400));

    const checkExists = async (serviceFn, id, name) => {
        const [error, result] = await catchError(serviceFn(id));
        if (error instanceof Prisma.PrismaClientKnownRequestError)
            if (error.code === "P2025")
                return next(new AppError(`${name} not found`, 404));
        if (error) return next(error);
        if (!result) return next(new AppError(`${name} not found`, 404));
        return result;
    };

    const { customerId, productId } = parseResult.data;
    await checkExists(getCustomer, customerId, "Customer");
    const product = await checkExists(getProduct, productId, "Product");

    // Create Sale
    const [error, sale] =
        await catchError(createSale({ ...parseResult.data, product }, next));
    if (error instanceof Prisma.PrismaClientKnownRequestError)
        if (error.code === "P2002")
            return successRes(res, 409, false, "Sale with this AgreementNo already exists", {
                id: parseResult.data.id
            });
    if (error) return next(error);

    return successRes(res, 201, true, "Sale created successfully", sale);
};

export const handleDeleteSale = deleteHandler(
    idSchema,
    deleteSale,
    "Sale"
)