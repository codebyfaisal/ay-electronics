import dotenv from "dotenv";
import app from "./src/app.js";
import killPort from './src/os/portKiller.os.js';
import openBrowser from './src/os/openBrowser.os.js';
import { readAppConfig, runDailyLocalBackup, updateEnvironment } from "./src/os/dbBacker.os.js";
import { updateAllOverdueStatus } from "./src/services/installment.service.js";

dotenv.config();

const getPassword = async () => {
    const config = await readAppConfig();
    return config?.PASSWORD;
};

updateEnvironment({
    "PASSWORD": await getPassword(),
})

const PRIMARY_PORT = Number(process.env.PORT) || 4000;
const SAFE_FALLBACK_PORTS = [4000, 5000, 8000, 8080, 8888, 9000];
const PORTS_TO_TRY = Array.from(new Set([
    PRIMARY_PORT,
    ...SAFE_FALLBACK_PORTS
]));

async function startServerWithFallback(portList, index = 0) {
    const port = portList[index];
    const isLastSafePort = index === portList.length - 1;

    if (port === undefined) {
        console.error(`\n🛑 FATAL ERROR: Failed to start server. All attempted ports are busy or failed.`);
        console.error(`Please manually check and free ports: ${portList.join(', ')}`);
        process.exit(1);
    }

    const server = app.listen(port, async () => {
        const url = `http://localhost:${port}`;
        console.log(`\n🎉 Server successfully started on port ${port}.`);
        console.log(`Access the application at: ${url}`);
        updateAllOverdueStatus();
        openBrowser(url);

        const config = await readAppConfig();
        const driveLetter = config?.BACKUP_DRIVE;
        await runDailyLocalBackup(driveLetter);
    });

    server.on('error', async (err) => {
        server.close();

        if (err.code === 'EADDRINUSE') {
            console.warn(`\n⚠️ Port ${port} is busy.`);

            if (!isLastSafePort) {
                console.warn(`Moving to next available port...`);
                await startServerWithFallback(portList, index + 1);
            } else {
                console.warn(`All fallback ports exhausted.`);

                const portToKill = portList[0];
                console.warn(`Attempting critical operation: Killing process on primary port ${portToKill}...`);

                const wasKilled = await killPort(portToKill);

                if (wasKilled) {
                    console.log(`\nProcess on port ${portToKill} terminated. Retrying primary port...`);
                    await startServerWithFallback(portList, 0);
                } else {
                    console.error(`\n🛑 FATAL ERROR: Failed to free primary port ${portToKill} and all fallbacks failed.`);
                    process.exit(1);
                }
            }
        } else {
            console.error(`\n🔴 Server failed to start due to an unexpected error on port ${port}:`, err);
            await startServerWithFallback(portList, index + 1);
        }
    });
}

startServerWithFallback(PORTS_TO_TRY);
