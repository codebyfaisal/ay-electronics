import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.util.js";
import { handleDbBackup, handleGetDbBackups, handleFolderOpen } from "../controllers/setting.controller.js";

const router = Router();

router.get("/backup", asyncHandler(handleDbBackup));
router.get("/backups", asyncHandler(handleGetDbBackups));
router.get("/open-folder", asyncHandler(handleFolderOpen));

export default router;
