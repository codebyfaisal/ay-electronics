import fs from 'fs';
import path from 'path';
const fsp = fs.promises;

const CONFIG_FILE_NAME = "config.json";
const DB_FILE_NAME = "app.db";
const BACKUP_DIR_NAME = "backup";
const APP_FOLDER_NAME = "ay-app";

export async function readAppConfig() {
    const appConfigFile = path.join(process.cwd(), "config", CONFIG_FILE_NAME);

    try {
        const configContent = await fsp.readFile(appConfigFile, "utf-8");
        return JSON.parse(configContent);
    } catch (e) {
        if (e.code === 'ENOENT') {
            return null;
        }
        console.error("Config Error: Could not read or parse config.json:", e.message);
        return null;
    }
}

export function updateEnvironment(key) {
    if (!process.env) return;
    
    const envKey = Object.keys(key)[0];
    const envValue = Object.values(key)[0];

    process.env[envKey] = envValue;
}

export async function performDbBackup(backupDriveLetter) {
    if (!backupDriveLetter) return false;

    try {
        const localDbPath = path.join(process.cwd(), "db", DB_FILE_NAME);
        try {
            await fsp.stat(localDbPath);
        } catch {
            console.error(`❌ Backup FAILED: Source DB file not found at ${localDbPath}`);
            return false;
        }

        const targetDir = path.join(
            `${backupDriveLetter}:`,
            APP_FOLDER_NAME,
            BACKUP_DIR_NAME,
            new Date().toISOString().split("T")[0]
        );

        const backupDbPath = path.join(targetDir, DB_FILE_NAME);
        try {
            await fsp.rm(targetDir, { recursive: true, force: true });
        } catch (err) {
            console.warn(`⚠️ Could not remove existing folder ${targetDir}:`, err.message);
        }
        await fsp.mkdir(targetDir, { recursive: true });
        await fsp.copyFile(localDbPath, backupDbPath);

        console.log(`\n📦 Local Database backup created at: ${backupDbPath}`);
        return true;

    } catch (e) {
        console.error(`\n❌ Local Backup FAILED (Drive: ${backupDriveLetter}):`, e.message);
        return false;
    }
}

export async function runDailyLocalBackup(backupDriveLetter) {
    if (!backupDriveLetter) return false;
    let success = false;

    try {
        const targetDir = path.join(backupDriveLetter + ":", APP_FOLDER_NAME, BACKUP_DIR_NAME, new Date().toISOString().split('T')[0]);
        const backupDir = path.join(backupDriveLetter + ":", APP_FOLDER_NAME, BACKUP_DIR_NAME);

        const config = await readAppConfig();
        const keepCount = config?.BACKUP_KEEP_COUNT || 5;
        let targetDirExists = true;
        try {
            await fsp.stat(targetDir);
        } catch (e) {
            targetDirExists = false;
        }

        if (!targetDirExists) {
            console.log(`\n🔎 Checking for backup directory...`);
            success = await performDbBackup(backupDriveLetter);
        }

        let backups = (await fsp.readdir(backupDir, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(dirent.name))
            .map(dirent => ({ name: dirent.name }));

        backups.sort((a, b) => a.name.localeCompare(b.name));

        backups = await Promise.all(backups.map(async bkp => {
            const fullPath = path.join(backupDir, bkp.name);
            const stat = await fsp.stat(fullPath);
            return { ...bkp, time: stat.mtime };
        }));

        backups.sort((a, b) => a.time.getTime() - b.time.getTime());

        const toDelete = backups.slice(0, backups.length - keepCount);

        await Promise.all(toDelete.map(async bkp => {
            const fullPath = path.join(backupDir, bkp.name);
            try {
                await fsp.rm(fullPath, { recursive: true, force: true });
                console.log(`🗑️ Deleted old backup: ${bkp.name}`);
            } catch (err) {
                console.error(`❌ Failed to delete ${bkp.name}: ${err.message}`);
            }
        }));

        console.log(`✅ Kept ${keepCount} most recent backups.`);

        if (success) console.log(`\n✅ Daily Local Backup SUCCESS.`);
        else console.log(`\n Daily Local Backup ALREADY EXISTS.`);

        return success;
    } catch (e) {
        console.error(`\n❌ Daily Backup Check FAILED:`, e.message);
        return false;
    }
}

export const driveLetter = async () => {
    const config = await readAppConfig();
    return config?.BACKUP_DRIVE;
}

export const getAllBackups = async () => {
    const backupDir = path.join(await driveLetter() + ":", APP_FOLDER_NAME, BACKUP_DIR_NAME);

    const backups = (await fsp.readdir(backupDir, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(dirent.name))
        .map(dirent => ({ path: path.join(backupDir, dirent.name), folderName: dirent.name }));

    return backups;
}
