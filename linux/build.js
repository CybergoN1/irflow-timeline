#!/usr/bin/env node
/**
 * build.js — Interactive build script for IRFlow Timeline (Linux / Ubuntu)
 *
 * Node.js build script — runs natively on any system with Node.js installed.
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
        execSync(`which ${name}`, { stdio: "ignore" });
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
    console.log("║   IRFlow Timeline — Linux Build (SQLite-backed)         ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("");

    // Check prerequisites
    if (!checkCmd("node")) {
        console.error("❌ Node.js is required but not found in PATH.");
        console.error("   Install with: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install 20");
        process.exit(1);
    }

    if (!checkCmd("npm")) {
        console.error("❌ npm is required but not found in PATH.");
        console.error("   It should come with Node.js.");
        process.exit(1);
    }

    // Check Node version
    const nodeVer = parseInt(process.versions.node.split(".")[0], 10);
    if (nodeVer < 18) {
        console.error(`❌ Node.js 18+ required (found v${process.versions.node})`);
        process.exit(1);
    }

    // Check for build tools
    if (!checkCmd("gcc") && !checkCmd("g++")) {
        console.warn("⚠️  gcc/g++ not found — needed for native module compilation.");
        console.warn("   Install with: sudo apt install -y build-essential");
    }

    // Check for Python (needed for node-gyp)
    if (!checkCmd("python3")) {
        console.warn("⚠️  python3 not found — needed for native module compilation.");
        console.warn("   Install with: sudo apt install -y python3");
    }

    console.log(`✅ Node.js v${process.versions.node} | npm ${execSync("npm -v", { encoding: "utf-8" }).trim()}`);
    console.log("");

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
    console.log("  3) AppImage (portable, runs on any Linux)");
    console.log("  4) .deb package (Debian/Ubuntu)");
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
            const pngPath = path.join(__dirname, "assets", "icon.png");
            if (!fs.existsSync(pngPath)) {
                console.warn("⚠️  assets/icon.png not found. The AppImage will use a default icon.");
                console.warn("   See PREREQUISITES.md for instructions on generating the icon.");
            }
            console.log("📦 Building AppImage...");
            run("npm run dist:appimage");
            console.log("");
            console.log("✅ AppImage is in: release/");
            break;

        case "4":
            console.log("");
            console.log("📦 Building .deb package...");
            run("npm run dist:deb");
            console.log("");
            console.log("✅ .deb package is in: release/");
            console.log("   Install with: sudo dpkg -i release/*.deb");
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
