const paginate = ({ page = 1, limit = 10 }) => {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    return {
        page: parsedPage > 0 ? parsedPage : 1,
        limit: parsedLimit > 0 ? parsedLimit : 10
    };
};

export default paginate;