import prisma from "../db/prisma.js";
import { performDbBackup, readAppConfig } from "../os/dbBacker.os";
import { generateSummary } from "../services/summary.service";
import { getNoOfWrites, increaseNoOfWrites, resetNoOfWrites } from "../store/session.store";

export const successRes = async (res, status = 200, success, message, data) => {
    res.status(status).json({ success, message, data });

    try {
        const method = res.req?.method;
        if (["POST", "PUT", "DELETE"].includes(method)) {
            increaseNoOfWrites();
            if (getNoOfWrites() > 20) {
                performDbBackup(readAppConfig()?.BACKUP_DRIVE)
                resetNoOfWrites();
            };
            await prisma.$transaction(async (tx) => {
                await generateSummary(tx, {
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                });
            });
        }
    } catch (error) {
        console.log(error);
    }
};

export const errorRes = (res, status = 500, message, data) =>
    res.status(status).json({ message, data });