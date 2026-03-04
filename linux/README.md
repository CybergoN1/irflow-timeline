# IRFlow Timeline — Linux (Ubuntu)

A high-performance Linux application for DFIR timeline analysis. Built on Electron + SQLite to handle massive forensic timelines (CSV, TSV, XLSX, EVTX, Plaso) — 30–50 GB+ without breaking a sweat.

Inspired by [Eric Zimmerman's Timeline Explorer](https://ericzimmerman.github.io/) for Windows.

## Supported File Formats

| Format | Description |
|--------|-------------|
| `.csv` / `.tsv` / `.txt` / `.log` | Delimited text timelines |
| `.xlsx` / `.xls` / `.xlsm` | Excel workbooks (multi-sheet supported) |
| `.evtx` | Windows Event Log files |
| `.plaso` | Plaso/log2timeline SQLite output |

## Quick Start

> **Prerequisites not installed?** See [PREREQUISITES.md](./PREREQUISITES.md) first.

```bash
git clone https://github.com/r3nzsec/irflow-timeline.git
cd irflow-timeline/linux
npm install
npx electron-rebuild -f -w better-sqlite3

# Development (hot-reload)
npm run dev

# Build + launch
npm run start

# Package as AppImage
npm run dist:appimage

# Package as .deb
npm run dist:deb
```

Output in `release/`.

## Build Options

Run the interactive build script for a guided experience:

```bash
node build.js
```

Options:
1. **Development mode** — Hot reload + dev tools
2. **Quick start** — Build + run
3. **AppImage** — Portable, runs on any Linux distro
4. **`.deb` package** — For Debian/Ubuntu systems

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

- Ubuntu 22.04 LTS or later (other Debian-based distros should work)
- x64 architecture

## License

Apache-2.0
