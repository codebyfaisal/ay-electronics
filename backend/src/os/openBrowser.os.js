import { exec } from 'child_process';

function openBrowser(url) {
    if (typeof exec === 'function') {
        exec(`start ${url}`);     // Windows
        exec(`xdg-open "${url}"`); // Linux
        exec(`open "${url}"`);     // MacOS
    } else console.warn(`Cannot open browser automatically. Please open manually. \n URL: ${url}`);

}

export default openBrowser;
