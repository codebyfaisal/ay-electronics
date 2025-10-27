import fs from 'fs';
import path from 'path';

const CONFIG_FILE_NAME = "config.json";
const DB_FILE_NAME = "app.db";
const BACKUP_DIR_NAME = "backup";
const APP_FOLDER_NAME = "ay-app";

export function readAppConfig() {
    const appConfigFile = path.join(process.cwd(), "config", CONFIG_FILE_NAME);
    if (fs.existsSync(appConfigFile)) {
        try {
            const configContent = fs.readFileSync(appConfigFile, "utf-8");
            return JSON.parse(configContent);
        } catch (e) {
            console.error("Config Error: Could not read or parse dev.json:", e.message);
            return null;
        }
    }
    return null;
}

export function updateEnvironment(key) {
    if (!process.env) return;

    const envKey = Object.keys(key)[0];
    const envValue = Object.values(key)[0];

    process.env[envKey] = envValue;
}

export function performDbBackup(backupDriveLetter) {
    if (!backupDriveLetter) return false;

    try {
        const localDbPath = path.join(process.cwd(), "db", DB_FILE_NAME);
        if (!fs.existsSync(localDbPath)) {
            console.error(`Backup FAILED: Source DB file not found at ${localDbPath}`);
            return false;
        }

        const targetDir = path.join(backupDriveLetter + ":", APP_FOLDER_NAME, BACKUP_DIR_NAME, new Date().toISOString().split('T')[0]);
        const backupDbPath = path.join(targetDir, DB_FILE_NAME);

        if (!fs.existsSync(targetDir))
            fs.mkdirSync(targetDir, { recursive: true });

        fs.copyFile(localDbPath, backupDbPath, (err) => {
            if (err) throw err;
            console.log(`\n📦 Local Database backup created at: ${backupDbPath}`);
        })

        return true;
    } catch (e) {
        console.error(`\n❌ Local Backup FAILED (Path: ${backupDriveLetter}):`, e.message);
        return false;
    }
}

export function runDailyLocalBackup(backupDriveLetter) {
    if (!backupDriveLetter) return false;
    let success = false;

    try {
        const targetDir = path.join(backupDriveLetter + ":", APP_FOLDER_NAME, BACKUP_DIR_NAME, new Date().toISOString().split('T')[0]);
        const backupDir = path.join(backupDriveLetter + ":", APP_FOLDER_NAME, BACKUP_DIR_NAME);

        const config = readAppConfig();
        const keepCount = config?.BACKUP_KEEP_COUNT || 5;

        if (!fs.existsSync(targetDir)) {
            console.log(`\n🔎 Checking for backup directory...`);
            success = performDbBackup(backupDriveLetter);
        }

        let backups = fs.readdirSync(backupDir)
            .filter(name => {
                return /^\d{4}-\d{2}-\d{2}$/.test(name);
            })
            .map(folder => {
                return { name: folder };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
            
        backups = backups.map(bkp => {
            const fullPath = path.join(backupDir, bkp.name);
            const stat = fs.statSync(fullPath);
            return { ...bkp, time: stat.mtime };
        });

        const toDelete = backups.slice(0, backups.length - keepCount);

        toDelete.forEach(bkp => {
            const fullPath = path.join(backupDir, bkp.name);
            try {
                fs.rmSync(fullPath, { recursive: true, force: true });
                console.log(`🗑️ Deleted old backup: ${bkp.name}`);
            } catch (err) {
                console.error(`❌ Failed to delete ${bkp.name}: ${err.message}`);
            }
        });

        console.log(`✅ Kept ${keepCount} most recent backups.`);

        if (success) console.log(`\n✅ Daily Local Backup SUCCESS.`);
        else console.log(`\n Daily Local Backup ALREADY EXISTS.`);

        return success;
    } catch (e) {
        console.error(`\n❌ Daily Backup Check FAILED:`, e.message);
        return false;
    }
}