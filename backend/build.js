import { $ } from "bun";
import { join } from "path";

const __dirname = import.meta.dir;
const iconPath = join(__dirname, "ui", "assets", "icon.ico");
const exePath = join(__dirname, "AY_Electronics.exe");
const rceditPath = join(__dirname, "tools", "rcedit-x64.exe");

await $`bun build ${join(__dirname, "index.js")} --compile --target bun-windows-x64 --outfile ${exePath} --minify`;
await $`${rceditPath} ${exePath} --set-icon ${iconPath}`;

console.log("✅ Built AY_Electronics.exe with custom icon");
