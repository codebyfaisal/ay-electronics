import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { readAppConfig } from "../os/dbBacker.os.js";
import AppError from "./error.util.js";

dayjs.extend(customParseFormat);

async function checkAppDate() {
    const appConfig = await readAppConfig();
    const appDateStr = appConfig.START_DATE;

    if (!appDateStr)
        throw new AppError(
            "Invalid App Date. Please check config.json and ensure the date format is correct."
        );

    const appDate = dayjs(appDateStr, [
        "YYYY-MM-DD",
        "YYYY/MM/DD",
        "DD-MM-YYYY",
        "DD/MM/YYYY",
        dayjs.ISO_8601
    ], true).startOf("day");

    if (!appDate.isValid())
        throw new AppError(
            "Invalid date format in START_DATE. Please check config.json."
        );

    const today = dayjs().startOf("day");

    if (today.isBefore(appDate)) {
        console.log(`\n⚠️  App start date is on ${appDate.format("YYYY-MM-DD")}.`);
        console.log(`Today is ${today.format("YYYY-MM-DD")}.`);
    }

    return today.isAfter(appDate);
}

export default checkAppDate;
