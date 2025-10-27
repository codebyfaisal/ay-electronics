import { readAppConfig } from "../os/dbBacker.os.js";
import AppError from "./error.util.js";

function checkAppDate() {
    const appDateStr = readAppConfig().START_DATE;
    if (!appDateStr)
        throw new AppError(
            "Invalid App Date. Please check config.json and ensure the date format is correct."
        );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appDate = new Date(appDateStr.includes('T') ? appDateStr : appDateStr.replace(/\//g, '-') + "T00:00:00");
    appDate.setHours(0, 0, 0, 0);

    if (today <= appDate) return false;
    return true;
}

export default checkAppDate;
