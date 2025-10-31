const   calculateStock = (transactions) => {
    return transactions.reduce(
        (acc, t) => t.direction === "IN" ? acc + t.quantity : acc - t.quantity,
        0
    )
}

export default calculateStock