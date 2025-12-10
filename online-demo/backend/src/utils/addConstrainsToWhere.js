function addContainsToWhere(where) {
    if (typeof where !== 'object' || where === null) return where;

    const updated = Array.isArray(where) ? [] : {};

    for (const [key, value] of Object.entries(where)) {

        if (typeof value === 'string' || typeof value === 'number') {
            if (key === 'id' || key === 'customerId' || key === 'productId' || key === 'saleId') updated[key] = Number(value) || 0;
            else updated[key] = { contains: value };
        }
        else updated[key] = addContainsToWhere(value);
    }

    return updated;
}

export default addContainsToWhere;