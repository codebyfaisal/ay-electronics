import dotenv from "dotenv";
import app from "./src/app.js";
import killPort from './src/os/portKiller.os.js'; // RE-INTRODUCED
import openBrowser from './src/os/openBrowser.os.js';

dotenv.config();

// The user's preferred ports in order: ENV PORT, 4000, plus 5 commonly safe alternatives.
const PRIMARY_PORT = Number(process.env.PORT) || 4000;

// Fallback ports that are typically free on consumer systems
const SAFE_FALLBACK_PORTS = [
    4000,
    5000,
    8000,
    8080,
    8888,
    9000
];

// Build the full list of ports to try: [PRIMARY, SAFE_FALLBACKS (unique)]
const PORTS_TO_TRY = Array.from(new Set([
    PRIMARY_PORT,
    ...SAFE_FALLBACK_PORTS
]));


/**
 * Attempts to start the server sequentially following the Primary -> Fallback -> Kill strategy.
 * @param {number[]} portList Array of unique, ordered ports to attempt.
 * @param {number} index Current index in the portList.
 */
async function startServerWithFallback(portList, index = 0) {
    const port = portList[index];
    const isLastSafePort = index === portList.length - 1;

    if (port === undefined) {
        // This should only be reached if the killing attempt also failed or was skipped
        console.error(`\n🛑 FATAL ERROR: Failed to start server. All attempted ports are busy or failed.`);
        console.error(`Please manually check and free ports: ${portList.join(', ')}`);
        process.exit(1);
    }

    const server = app.listen(port, () => {
        // SUCCESS HANDLER
        const url = `http://localhost:${port}`;
        console.log(`\n🎉 Server successfully started on port ${port}.`);
        console.log(`Access the application at: ${url}`);
        openBrowser(url);
    });

    server.on('error', async (err) => {
        server.close();

        if (err.code === 'EADDRINUSE') {
            console.warn(`\n⚠️ Port ${port} is busy.`);

            if (!isLastSafePort) {
                // 1. STANDARD FALLBACK: Move to the next port in the list
                console.warn(`Moving to next available port...`);
                await startServerWithFallback(portList, index + 1);

            } else {
                // 2. LAST RESORT: All safe fallbacks exhausted. Attempt to kill the PRIMARY port.
                console.warn(`All fallback ports exhausted.`);

                const portToKill = portList[0]; // Always target the desired primary port
                console.warn(`Attempting critical operation: Killing process on primary port ${portToKill}...`);

                const wasKilled = await killPort(portToKill);

                if (wasKilled) {
                    // Success! Retry startup on the now-free primary port (index = 0)
                    console.log(`\nProcess on port ${portToKill} terminated. Retrying primary port...`);
                    await startServerWithFallback(portList, 0);
                } else {
                    // Kill failed. Fatal error.
                    console.error(`\n🛑 FATAL ERROR: Failed to free primary port ${portToKill} and all fallbacks failed.`);
                    process.exit(1);
                }
            }
        } else {
            // Handle other types of errors (e.g., permission denied)
            console.error(`\n🔴 Server failed to start due to an unexpected error on port ${port}:`, err);
            await startServerWithFallback(portList, index + 1);
        }
    });
}

startServerWithFallback(PORTS_TO_TRY);
