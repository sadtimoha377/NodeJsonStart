import { spawn } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
const watchPaths = [];
let script = "";

for (let i = 0; i < args.length; i++) {
    if (args[i] === "--watch") {
        watchPaths.push(args[i + 1]);
        i++;
        continue;
    }
    script = args[i];
}

if (!script) {
    console.error("Usage: node your_nodemon --watch <path> <script>");
    process.exit(1);
}

if (watchPaths.length === 0) {
    watchPaths.push("./");
}

let child = null;
let timer = null;

const startScript = () => {
    console.log(`[your_nodemon] start: node ${script}`);
    child = spawn("node", [script], { stdio: "inherit" });

    child.on("exit", (code) => {
        if (code !== null) {
            console.log(`[your_nodemon] script finished with code ${code}`);
        }
    });
}

const restartScript = (changedPath) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        console.log(`[your_nodemon] changed: ${changedPath}`);
        if (child) {
            child.kill();
        }
        startScript();
    }, 100);
}

for (const target of watchPaths) {
    try {
        const isDirectory = fs.statSync(target).isDirectory();

        fs.watch(target, { recursive: isDirectory }, (eventType, fileName) => {
            restartScript(fileName || target);
        });

        console.log(`[your_nodemon] watching: ${target}`);
    } catch (error) {
        console.error(`[your_nodemon] can not watch ${target}: ${error.message}`);
    }
}

process.on("SIGINT", () => {
    console.log("\n[your_nodemon] stopped");
    if (child) {
        child.kill();
    }
    process.exit(0);
});

startScript();
