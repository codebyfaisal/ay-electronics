import path from "path";
import checkAppDate from "../utils/checkAppDate.util.js";

const watcher = async (req, res, next) => {
    const appDate = await checkAppDate();
    if (appDate) return next();

    return res.sendFile(path.join(process.cwd(), "ui", "assets", "dateError.html"));
}

export default watcher;