# IRFlow Timeline — Windows

A high-performance Windows application for DFIR timeline analysis. Built on Electron + SQLite to handle massive forensic timelines (CSV, TSV, XLSX, EVTX, Plaso) — 30–50 GB+ without breaking a sweat.

Inspired by [Eric Zimmerman's Timeline Explorer](https://ericzimmerman.github.io/) for Windows — offering a modern, cross-platform alternative.

## Supported File Formats

| Format | Description |
|--------|-------------|
| `.csv` / `.tsv` / `.txt` / `.log` | Delimited text timelines |
| `.xlsx` / `.xls` / `.xlsm` | Excel workbooks (multi-sheet supported) |
| `.evtx` | Windows Event Log files |
| `.plaso` | Plaso/log2timeline SQLite output |

## Quick Start

> **Prerequisites not installed?** See [PREREQUISITES.md](./PREREQUISITES.md) first.

```powershell
git clone https://github.com/r3nzsec/irflow-timeline.git
cd irflow-timeline\windows
npm install
npx electron-rebuild -f -w better-sqlite3

# Development (hot-reload)
npm run dev

# Build + launch
npm run start

# Package as NSIS installer
npm run dist:nsis
```

Output in `release\`.

## Build Options

Run the interactive build script for a guided experience:

```powershell
node build.js
```

Options:
1. **Development mode** — Hot reload + dev tools
2. **Quick start** — Build + run
3. **NSIS installer** — `.exe` setup wizard for distribution
4. **Portable executable** — Single `.exe`, no install required

## Key Features

- 🚀 SQLite-backed — handles 30–50 GB+ files without memory issues
- 🔍 Full-text search (FTS5) across all columns
- 📊 Timeline histogram with gap/burst analysis
- 🔖 Bookmarks, tags, and colour-coded conditional formatting
- 🛡️ IOC matching against indicator lists
- 📋 HTML report generation from bookmarked/tagged events
- 🔀 Multi-tab with timeline merging
- 💾 Session save/restore
- 🌲 Process tree and lateral movement visualisation
- 📤 Export filtered data (CSV, TSV, XLSX)

## System Requirements

- Windows 10 (1809+) or Windows 11
- x64 architecture

## License

Apache-2.0
