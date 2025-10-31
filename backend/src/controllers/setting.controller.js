import { driveLetter, getAllBackups, performDbBackup } from "../os/dbBacker.os";
import { errorRes, successRes } from "../utils/response.util";
import { exec } from "child_process";
import path from "path";

export const handleDbBackup = async (req, res, next) => {
    try {
        await performDbBackup(await driveLetter());
        setTimeout(() => {
            successRes(res, 200, true, "Backup successfully created");
        }, 1000);
    } catch (error) {
        next(error);
    }
}

export const handleGetDbBackups = async (req, res, next) => {
    try {
        const backups = await getAllBackups();
        successRes(res, 200, true, "Backups fetched successfully", { backups });
    } catch (error) {
        next(error);
    }
}

export const handleFolderOpen = async (req, res) => {
    const folderPath = req.query.path;
    if (!folderPath) return successRes(res, 400, false, "Folder path is required");

    const resolvedPath = path.resolve(folderPath);
    console.log("Opening folder:", resolvedPath);

    exec(`start "" "${resolvedPath}"`, (err) => {
        if (err) {
            console.error("Failed to open folder:", err);
            return errorRes(res, 500, false, "Failed to open folder");
        }
        console.log("Folder opened:", resolvedPath);
        return successRes(res, 200, true, "Folder opened successfully");
    });
};
