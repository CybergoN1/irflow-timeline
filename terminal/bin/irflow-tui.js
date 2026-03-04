#!/usr/bin/env node
"use strict";

// Suppress neo-blessed terminfo compilation warnings (xterm-256color.Setulc)
// neo-blessed's tput.js:1157 fires multiple console.error() calls when it fails
// to compile a termcap capability string. The sequence is:
//   console.error('')                          — empty
//   console.error('Error on %s:', tkey)        — format string with "Error on"
//   console.error(JSON.stringify(str))          — escape sequence with \u001b
//   console.error('')                          — empty
//   console.error(code.replace(...))            — compiled JS with stack.push/out.push
// We suppress ALL of these by tracking a "suppressing" flag.
let _suppressingTput = false;
const _origConsoleError = console.error;
console.error = (...args) => {
  const s = String(args[0] || "");
  // Detect start of tput error sequence
  if (s.includes("Error on") && s.includes("%s")) { _suppressingTput = true; return; }
  // While suppressing, catch all related lines
  if (_suppressingTput) {
    // End suppression after the code dump (contains "out.push" or "return out")
    if (s.includes("out.push") || s.includes("return out")) { _suppressingTput = false; }
    return;
  }
  // Also catch any standalone tput-related output
  if (s.includes("Setulc") || s.includes("stack.push") || s.includes("out.push")) return;
  // Suppress the escape-sequence JSON line ("\u001b[58::...")
  if (/^"\\u001b|^"\\x1b|^\s*$/.test(s) && args.length === 1) return;
  _origConsoleError.apply(console, args);
};
const _origStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, ...rest) => {
  if (typeof chunk === "string" && (
    chunk.includes("Setulc") || chunk.includes("tput") ||
    chunk.includes("stack.push") || chunk.includes("out.push") ||
    chunk.includes("Error on") || /^"\\u001b|^"\\x1b/.test(chunk)
  )) return true;
  return _origStderrWrite(chunk, ...rest);
};

const path = require("path");
const { createApp } = require("../lib/app");

// Parse CLI args
const args = process.argv.slice(2);
const opts = { files: [], theme: "dark", noColor: false };

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--help" || a === "-h") {
    process.stdout.write(
      `IRFlow Timeline TUI — DFIR timeline analysis in the terminal

Usage: irflow-tui [options] [file ...]

Options:
  -h, --help       Show this help message
  -t, --theme T    Color theme: cyberpunk (default), matrix, ember, light
  --no-color       Disable color output
  -v, --version    Show version

Supported formats: CSV, TSV, XLSX, XLS, PLASO, EVTX

Examples:
  irflow-tui timeline.csv
  irflow-tui logs.evtx events.csv
  irflow-tui --theme light evidence.xlsx
`
    );
    process.exit(0);
  } else if (a === "-v" || a === "--version") {
    const pkg = require("../package.json");
    process.stdout.write(`irflow-tui v${pkg.version}\n`);
    process.exit(0);
  } else if (a === "-t" || a === "--theme") {
    opts.theme = args[++i] || "dark";
  } else if (a === "--no-color") {
    opts.noColor = true;
  } else if (a === "-") {
    opts.stdin = true;
  } else {
    opts.files.push(path.resolve(a));
  }
}

createApp(opts);
