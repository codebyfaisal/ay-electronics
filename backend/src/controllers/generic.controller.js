import { Prisma } from "@prisma/client";
import catchError from "../utils/catchError.util.js";
import AppError from "../utils/error.util.js";
import { successRes } from "../utils/response.util.js";
import zodError from "../utils/zod.error.js";
import queryValidator from "../utils/queryValidator.util.js";
import paginate from "../utils/paginate.util.js";

export const getOneHandler = (schema, serviceFn, resourceName) => {
    return async (req, res, next) => {
        const parseResult = schema.safeParse(req.params.id);
        if (!parseResult.success)
            return next(new AppError(zodError(parseResult), 400));

        const [error, result] = await catchError(serviceFn(parseResult.data));
        if (error) return next(error);
        if (!result) return next(new AppError(`${resourceName} not found`, 404));

        return successRes(res, 200, true, `${resourceName} fetched successfully`, result);
    };
};

export const getManyHandler = (serviceFn, resourceName) => {
    return async (req, res, next) => {
        const where = queryValidator({ ...req.query, ...req.params });
        const pagination = paginate(req.query);

        const [error, results] = await catchError(serviceFn({ ...where }, { ...pagination }));
        if (error) return next(error);
        if (!results)
            return next(new AppError(`${resourceName} not found`, 404));

        return successRes(res, 200, true, `${resourceName}'s fetched successfully`, results);
    };
};

export const createHandler = (schema, serviceFn, resourceName) => {
    return async (req, res, next) => {
        const parseResult = schema.safeParse({ ...req.body, ...req.params });
        if (!parseResult.success)
            return next(new AppError(zodError(parseResult), 400));

        const [error, result] = await catchError(serviceFn(parseResult.data));
        if (error instanceof Prisma.PrismaClientKnownRequestError)
            switch (error.code) {
                case "P2002":
                    return next(new AppError(resourceName + " already exists", 409));
                case "P2025":
                    return next(new AppError(resourceName + " not found", 404));
                case "P2003":
                    return next(new AppError("Linked resource found. please delete it first", 409));
            }

        if (error) return next(error);

        return successRes(res, 201, true, resourceName + " created successfully", result);
    };
};

export const updateHandler = (schema, serviceFn, resourceName) => {
    return async (req, res, next) => {
        const parseResult = schema.safeParse({ ...req.query, ...req.params, ...req.body });

        if (!parseResult.success)
            return next(new AppError(zodError(parseResult), 400));

        const [error, result] = await catchError(serviceFn(parseResult.data));
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            switch (error.code) {
                case "P2025":
                    return next(new AppError(`${resourceName} not found`, 404));
                case "P2002":
                    return next(new AppError(`${resourceName} already exists`, 409));
                case "P2003":
                    return next(new AppError("Linked resource found. please delete it first", 409));
            }
        }
        if (error) return next(error);
        return successRes(res, 200, true, `${resourceName} updated successfully`, result);
    };
};

export const deleteHandler = (schema, serviceFn, resourceName) => {
    return async (req, res, next) => {
        const parseResult = schema.safeParse(req.params.id);

        if (!parseResult.success)
            return next(new AppError(zodError(parseResult), 400));

        const [error, result] = await catchError(serviceFn(parseResult.data));
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
            return next(new AppError(`${resourceName} not found`, 404));

        if (error) return next(error);
        return successRes(res, 200, true, `${resourceName} deleted successfully`, result);
    };
};
