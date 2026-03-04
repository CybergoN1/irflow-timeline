# IRFlow Timeline — Cross-Platform DFIR Timeline Viewer

<img width="1297" height="771" alt="IRFlow-Timeline-Github" src="https://github.com/user-attachments/assets/4e966f3f-6b82-4efa-990c-d201ebd0c23f" />

https://github.com/user-attachments/assets/d0a94f52-8b2a-4735-bd01-c55e2459f7b4

A high-performance DFIR timeline analysis tool built on Electron + SQLite. Handles massive forensic timelines (CSV, TSV, XLSX, EVTX, Plaso) without breaking a sweat.

> **Forked from [r3nzsec/irflow-timeline](https://github.com/r3nzsec/irflow-timeline)** — originally a macOS-only Electron app. This fork expands IRFlow Timeline into a full cross-platform tool with native builds for Linux, Windows, macOS, and a terminal/Docker TUI.

Inspired by Eric Zimmerman's Timeline Explorer for Windows.

---

## What's New in This Fork

| Feature | Description |
|---------|-------------|
| **Linux support** | Native Electron builds — AppImage + .deb packages |
| **Windows support** | NSIS installer + portable exe |
| **Terminal TUI** | Full-featured neo-blessed TUI for headless/SSH use |
| **Docker support** | Multi-stage Docker image (91 MB) with docker-compose |
| **327 detection rules** | Process chain rules with MITRE ATT&CK technique mapping |
| **64 regex patterns** | Credential dumping, encoded PowerShell, LOLBins, RMM tools, and more |
| **Automated test suite** | Smoke tests, detection engine tests, performance benchmarks, Docker tests |
| **Cross-platform test plan** | Comprehensive checklist for validating each platform |

---

## Platform Support

| Platform | Type | Status |
|----------|------|--------|
| macOS | Electron GUI | Stable (original) |
| Linux | Electron GUI | Stable |
| Windows | Electron GUI | Stable |
| Terminal | neo-blessed TUI | Stable |
| Docker | TUI in container | Stable |

---

## Quick Start

### macOS (GUI)

```bash
cd mac
npm install
npx electron-rebuild -f -w better-sqlite3
npm run dev          # Development (hot-reload)
npm run start        # Build + launch
npm run dist:dmg     # Package as universal DMG
```

### Linux (GUI)

```bash
cd linux
npm install
npx electron-rebuild -f -w better-sqlite3
npm run dev
npm run dist:appimage   # AppImage
npm run dist:deb        # .deb package
```

### Windows (GUI)

```bash
cd windows
npm install
npx electron-rebuild -f -w better-sqlite3
npm run dev
npm run dist:nsis       # NSIS installer
npm run dist:portable   # Portable exe
```

### Terminal TUI

```bash
cd terminal
npm install
node bin/irflow-tui.js /path/to/timeline.csv
node bin/irflow-tui.js --theme matrix /path/to/data.xlsx
```

### Docker

```bash
cd terminal
docker build -t irflow-tui .
docker run -it -v /path/to/evidence:/data irflow-tui /data/timeline.csv
docker run -it irflow-tui --theme matrix /app/test-data/sysmon-process.csv
```

---

## Detection Engine

The built-in detection engine runs automatically on imported data:

- **327 process chain rules** — Office macro execution, LOLBin abuse, lateral movement, credential dumping, ransomware deployment, and more
- **64 regex patterns** — Encoded PowerShell, mimikatz, suspicious paths, AD recon tools, RMM tools, exfiltration indicators
- **MITRE ATT&CK mapping** — 61 unique technique IDs across all rules
- **Severity scoring** — 4 levels (info, medium, high, critical) with color-coded highlighting

---

## Testing

```bash
cd terminal

npm test                # Smoke + detection tests
npm run test:smoke      # Backend smoke test (62 assertions)
npm run test:detection  # Detection engine test (53 assertions)
npm run test:perf       # Performance benchmarks
npm run test:docker     # Docker build + runtime validation
npm run test:all        # Everything
```

Test data included in `terminal/test-data/` — Sysmon process events, logon events, persistence techniques, timeline gaps, and IOC lists.

---

## Project Structure

```
irflow-timeline/
├── linux/          # Linux Electron GUI
├── mac/            # macOS Electron GUI (original platform)
├── windows/        # Windows Electron GUI
├── terminal/       # Terminal TUI + Docker
│   ├── bin/        # CLI entry point
│   ├── lib/        # TUI app, widgets, backend
│   ├── test/       # Automated test suite
│   └── test-data/  # Sample DFIR data
└── docs/           # Documentation + test plan
```

Each platform directory contains the full backend (`db.js`, `parser.js`, `detection-rules.js`) and platform-specific UI code.

---

## Documentation

- **[Original docs](https://r3nzsec.github.io/irflow-timeline/)** — Features, getting started, workflows (from upstream)
- **[Cross-platform test plan](docs/reference/cross-platform-test-plan.md)** — Comprehensive testing checklist

---

## Credits & Acknowledgments

### Original Project

This project is forked from **[r3nzsec/irflow-timeline](https://github.com/r3nzsec/irflow-timeline)** by [r3nzsec](https://github.com/r3nzsec), who built the original macOS Electron application, the SQLite-backed timeline engine, and the React UI. The core architecture — streaming import, FTS5 search, virtual scrolling via LIMIT/OFFSET — is their work.

Inspired by [Eric Zimmerman's Timeline Explorer](https://ericzimmerman.github.io/).

### Open Source Projects

| Project | Usage | Link |
|---------|-------|------|
| **Electron** | Application framework | [electron/electron](https://github.com/electron/electron) |
| **better-sqlite3** | High-performance SQLite engine with WAL mode, FTS5 | [WiseLibs/better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| **neo-blessed** | Terminal UI framework (TUI) | [embark-framework/neo-blessed](https://github.com/embark-framework/neo-blessed) |
| **@ts-evtx/core** | Native Windows EVTX event log parsing | [NickSmet/ts-evtx](https://github.com/NickSmet/ts-evtx) |
| **Plaso (log2timeline)** | Forensic timeline generation (we import Plaso SQLite output) | [log2timeline/plaso](https://github.com/log2timeline/plaso) |
| **ExcelJS** | XLSX streaming reader | [exceljs/exceljs](https://github.com/exceljs/exceljs) |
| **SheetJS (xlsx)** | XLSX parsing | [SheetJS/sheetjs](https://github.com/SheetJS/sheetjs) |
| **csv-parser** | CSV/TSV streaming parser | [mafintosh/csv-parser](https://github.com/mafintosh/csv-parser) |
| **React** | UI rendering | [facebook/react](https://github.com/facebook/react) |
| **Vite** | Build tooling and hot-reload | [vitejs/vite](https://github.com/vitejs/vite) |
| **VitePress** | Documentation site | [vuejs/vitepress](https://github.com/vuejs/vitepress) |
| **electron-builder** | Cross-platform packaging | [electron-userland/electron-builder](https://github.com/electron-userland/electron-builder) |

### DFIR Community

- [Eric Zimmerman](https://ericzimmerman.github.io/) — Timeline Explorer for Windows, the original inspiration
- [log2timeline/Plaso](https://github.com/log2timeline/plaso) — Super timeline generation framework by Kristinn Gudjonsson and contributors
- [SANS DFIR](https://www.sans.org/digital-forensics-incident-response/) — DFIR training and community resources
- [The DFIR Report](https://thedfirreport.com/) — Real-world intrusion analysis reports that informed threat detection patterns

### Original Beta Testers

Thanks to the original testers from r3nzsec's project:

- [Maddy Keller](https://www.linkedin.com/in/madeleinekeller98/)
- [Omar Jbari](https://www.linkedin.com/in/jbariomar/)
- [Nicolas Bareil](https://www.linkedin.com/in/nbareil/)
- [Dominic Rathmann](https://www.linkedin.com/in/dominic-rathmann-77664323b/)
- [Chip Riley](https://www.linkedin.com/in/criley4640/)

## License

Apache-2.0
