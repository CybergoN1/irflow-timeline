# IRFlow Timeline — macOS

<img width="1297" height="771" alt="IRFlow-Timeline-Github" src="https://github.com/user-attachments/assets/4e966f3f-6b82-4efa-990c-d201ebd0c23f" />

A high-performance native macOS application for DFIR timeline analysis. Built on Electron + SQLite to handle massive forensic timelines (CSV, TSV, XLSX, EVTX, Plaso) — 30–50 GB+ without breaking a sweat.

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
cd irflow-timeline/mac
npm install
npx electron-rebuild -f -w better-sqlite3

# Development (hot-reload)
npm run dev

# Build + launch
npm run start

# Package as universal DMG
npm run dist:universal
```

Output in `release/`.

## Build Options

Run the interactive build script for a guided experience:

```bash
chmod +x build.sh
./build.sh
```

Options:
1. **Development mode** — Hot reload + dev tools
2. **Quick start** — Build + run
3. **`.app` bundle** — Distributable application
4. **`.dmg` installer** — Share with team
5. **Universal binary DMG** — Intel + Apple Silicon

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

- macOS 11 (Big Sur) or later
- Apple Silicon (M1+) or Intel

## License

Apache-2.0
