const queryValidator = (query) => {
    let where = {};
    for (const key in query)
        if (typeof key !== "string")
            return next(new AppError("Invalid query parameters", 400));
        else if (key === "id" || key === "customerId" || key === "productId" || key === "saleId")
            where[key] = Number(query[key]);
        else if (query[key] !== "" && key !== "page" && key !== "limit")
            where[key] = query[key];

    return where;
}

export default queryValidator