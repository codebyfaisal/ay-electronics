import { performDbBackup, readAppConfig } from "../os/dbBacker.os.js";
import { getNoOfWrites, increaseNoOfWrites, resetNoOfWrites } from "../store/session.store.js";

const watcher = (req, res, next) => {
    if (["POST", "PUT", "DELETE"].includes(req.method)) increaseNoOfWrites();
    if (getNoOfWrites() > 20) {
        performDbBackup(readAppConfig()?.BACKUP_DRIVE)
        resetNoOfWrites();
    };
    next();
}

export default watcher;