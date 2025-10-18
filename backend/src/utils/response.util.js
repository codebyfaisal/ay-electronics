export const successRes = (res, status = 200, success, message, data) =>
    res.status(status).json({ success, message, data });

export const errorRes = (res, status = 500, message, data) =>
    res.status(status).json({ message, data });