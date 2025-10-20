import { exec } from 'child_process';

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Do not reject on expected 'not found' errors (e.g., lsof not found)
                if (stderr.includes('not found') || stderr.includes('command not found')) {
                    reject(new Error(`Command failed: ${command}\nError: ${stderr.trim()}`));
                } else {
                    resolve(stdout);
                }
            } else {
                resolve(stdout);
            }
        });
    });
}

async function portKiller(port) {
    console.log(`\nAttempting to find and kill process on port ${port}...`);
    
    let command, pidRegex, killCommand;

    // Determine OS and commands
    if (process.platform === 'win32') {
        // Windows: Find PID using netstat, then kill using taskkill
        command = `netstat -ano | findstr :${port}`;
        pidRegex = /LISTENING\s+(\d+)\s*$/;
        killCommand = (pid) => `taskkill /PID ${pid} /F`;
    } else {
        // Linux/macOS: Find PID using lsof, then kill using kill
        command = `lsof -i tcp:${port} | grep LISTEN`;
        pidRegex = /^\s*[^\s]+\s+(\d+)/;
        killCommand = (pid) => `kill -9 ${pid}`;
    }

    try {
        const stdout = await runCommand(command);
        const match = stdout.match(pidRegex);

        if (match) {
            const pid = match[1];
            await runCommand(killCommand(pid));
            console.log(`\n✅ Success: Killed process ${pid} (PID: ${pid}) on port ${port}.`);
            
            // Give the OS a moment to release the port
            await new Promise(resolve => setTimeout(resolve, 500)); 
            return true;
        } else {
            console.log(`\nℹ️ Port ${port} is currently free or no listening process found.`);
            return false;
        }
    } catch (error) {
        console.error(`\n❌ Warning: Could not automatically kill process on port ${port}.`);
        console.error(`\nReason: ${error.message.split('\n')[0]}`);
        console.error(`\nPlease run the following Command in Terminal: ${command}`);
        
        return false;
    }
}

export default portKiller;