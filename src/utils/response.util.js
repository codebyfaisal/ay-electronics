import { updateAllOverdueStatus } from "../services/installment.service.js";

export const successRes = async (res, status = 200, success, message, data) => {
    res.status(status).json({ success, message, data });
    updateAllOverdueStatus();
};

export const errorRes = (res, status = 500, message, data) =>
    res.status(status).json({ message, data });