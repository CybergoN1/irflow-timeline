#!/usr/bin/env node
/**
 * build.js — Interactive build script for IRFlow Timeline (Windows)
 *
 * Node.js replacement for build.sh — runs natively on Windows without
 * requiring bash, WSL, or Git Bash.
 *
 * Usage: node build.js
 */

const { execSync } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// ── Helpers ──────────────────────────────────────────────────────────
function run(cmd, opts = {}) {
    console.log(`  > ${cmd}`);
    try {
        execSync(cmd, { stdio: "inherit", cwd: __dirname, ...opts });
    } catch (err) {
        console.error(`\n❌ Command failed: ${cmd}`);
        process.exit(1);
    }
}

function checkCmd(name) {
    try {
        execSync(`where ${name}`, { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║   IRFlow Timeline — Windows Build (SQLite-backed)       ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("");

    // Check prerequisites
    if (!checkCmd("node")) {
        console.error("❌ Node.js is required but not found in PATH.");
        console.error("   Download from: https://nodejs.org/");
        process.exit(1);
    }

    if (!checkCmd("npm")) {
        console.error("❌ npm is required but not found in PATH.");
        console.error("   It should come with Node.js: https://nodejs.org/");
        process.exit(1);
    }

    // Check Node version
    const nodeVer = parseInt(process.versions.node.split(".")[0], 10);
    if (nodeVer < 18) {
        console.error(`❌ Node.js 18+ required (found v${process.versions.node})`);
        process.exit(1);
    }

    console.log(`✅ Node.js v${process.versions.node} | npm ${execSync("npm -v", { encoding: "utf-8" }).trim()}`);
    console.log("");

    // Check for Python (needed for node-gyp)
    if (!checkCmd("python") && !checkCmd("python3")) {
        console.warn("⚠️  Python not found — needed for native module compilation (better-sqlite3).");
        console.warn("   Download from: https://www.python.org/downloads/");
    }

    // Install dependencies
    console.log("📦 Installing dependencies...");
    run("npm install");
    console.log("");

    // Rebuild native modules for Electron
    console.log("🔧 Rebuilding native modules for Electron...");
    run("npx electron-rebuild -f -w better-sqlite3");
    console.log("");

    // Build menu
    console.log("Choose build type:");
    console.log("  1) Development mode (hot reload + dev tools)");
    console.log("  2) Quick start (build + run)");
    console.log("  3) NSIS installer (.exe setup wizard)");
    console.log("  4) Portable executable (single .exe, no install)");
    console.log("");

    const choice = await ask("Enter choice [1-4]: ");

    switch (choice) {
        case "1":
            console.log("");
            console.log("🚀 Starting dev mode...");
            console.log("   Renderer: http://localhost:5173");
            console.log("   App opens automatically when ready");
            run("npm run dev");
            break;

        case "2":
            console.log("");
            console.log("🔨 Building renderer...");
            run("npm run build:renderer");
            console.log("🚀 Starting app...");
            run("npx electron .");
            break;

        case "3":
            console.log("");
            // Check for icon
            const icoPath = path.join(__dirname, "assets", "icon.ico");
            if (!fs.existsSync(icoPath)) {
                console.warn("⚠️  assets/icon.ico not found. The installer will use a default icon.");
                console.warn("   See PREREQUISITES.md for instructions on generating the icon.");
            }
            console.log("📦 Building NSIS installer...");
            run("npm run dist:nsis");
            console.log("");
            console.log("✅ Installer is in: release\\");
            break;

        case "4":
            console.log("");
            console.log("📦 Building portable executable...");
            run("npm run dist:portable");
            console.log("");
            console.log("✅ Portable exe is in: release\\");
            break;

        default:
            console.log("Running quick start...");
            run("npm run build:renderer");
            run("npx electron .");
            break;
    }
}

main().catch((err) => {
    console.error("Build script error:", err);
    process.exit(1);
});
