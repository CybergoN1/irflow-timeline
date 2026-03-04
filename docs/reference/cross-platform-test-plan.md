# IRFlow Timeline — Cross-Platform Test Plan

## Context

IRFlow Timeline has been built for Linux, Windows, macOS (Electron GUI) and Terminal/Docker (TUI). This plan provides a portable, checklist-style test plan to execute when deploying to each system.

---

## 1. Prerequisites & Build Verification

### All Platforms
- [ ] `npm install` completes without errors
- [ ] `npx electron-rebuild -f -w better-sqlite3` succeeds (GUI platforms)
- [ ] `npm audit` — no critical/high CVEs

### Linux (`linux/`)
- [ ] Node.js 20+, build-essential, Python 3 installed
- [ ] `npm run build:renderer` succeeds
- [ ] `npm run dist:appimage` → produces `release/IRFlow-Timeline-*.AppImage`
- [ ] `npm run dist:deb` → produces `.deb` package
- [ ] AppImage runs (note: Ubuntu 24.04 needs `libfuse2t64`)
- [ ] `.deb` installs/uninstalls cleanly via `dpkg`

### Windows (`windows/`)
- [ ] Visual Studio Build Tools (C++ workload), Python 3, Node.js 20+ installed
- [ ] `npm run build:renderer` succeeds
- [ ] `npm run dist:nsis` → produces Setup.exe
- [ ] `npm run dist:portable` → produces portable .exe
- [ ] NSIS installer: installs, creates shortcuts, uninstalls cleanly
- [ ] Portable exe runs without installation or registry changes
- [ ] SmartScreen warning is dismissible (unsigned build)

### macOS (`mac/`)
- [ ] Xcode Command Line Tools installed, Node.js 20+
- [ ] `npm run build:renderer` succeeds
- [ ] `npm run dist:dmg` → produces `.dmg` image
- [ ] DMG mounts, app drags to Applications
- [ ] App runs after Gatekeeper approval (unsigned build)

### Docker (TUI — `terminal/`)
- [ ] `docker build -t irflow-tui .` succeeds
- [ ] Image size < 500 MB
- [ ] `docker run -it -v /path/to/data:/data irflow-tui /data/test.csv` launches TUI
- [ ] `docker compose up` works with volume mounts
- [ ] TTY allocation works (`-it` flags)

---

## 2. File Import Testing

Test with provided test data files:

| File | Location | Test |
|------|----------|------|
| `test-data.csv` (29 rows) | `terminal/test-data.csv` | Basic CSV import, column detection |
| `sysmon-process.csv` (40 rows) | `terminal/test-data/` | Process creation events, detection rule triggers |
| `logon-events.csv` (41 rows) | `terminal/test-data/` | Logon event parsing |
| `persistence-evtx.csv` (20 rows) | `terminal/test-data/` | Persistence technique detection |
| `timeline-gaps.csv` (62 rows) | `terminal/test-data/` | Gap analysis functionality |
| `iocs.txt` (45 entries) | `terminal/test-data/` | IOC matcher loading |

### Import Checklist
- [ ] CSV: Headers detected, delimiter auto-detected (comma/tab/pipe)
- [ ] CSV: Quoted fields with embedded commas handled correctly
- [ ] CSV: Progress callback updates during import
- [ ] XLSX: Multi-sheet detection, streaming read
- [ ] EVTX: Event records parsed, message provider resolves descriptions
- [ ] Plaso: SQLite schema recognized, timestamps normalized
- [ ] Large file (1 GB+): Streams without crash, memory stays stable
- [ ] Empty file: Graceful error message
- [ ] Malformed CSV: Error shown, no crash

---

## 3. Core Functionality Testing

### Data Grid
- [ ] Virtual scrolling works (SQL `LIMIT`/`OFFSET`, not loading all rows)
- [ ] Sort: Click column header cycles ASC → DESC → none
- [ ] Column resize (GUI) / auto-fit widths (TUI)
- [ ] Row selection (single and multi-select)
- [ ] Alternating row colors render correctly
- [ ] Bookmarks: Toggle per-row, persist during sort/filter
- [ ] Tags: Add/remove text tags per row

### Search (FTS5)
- [ ] Plain text search returns matching rows
- [ ] Fuzzy search: "cmdd" matches "cmd.exe"
- [ ] Regex search: `powershell.*-enc` matches encoded commands
- [ ] Result count updates in real-time
- [ ] Search across all columns
- [ ] Clear search restores full dataset

### Filtering
- [ ] Column text filter (contains, equals, starts with)
- [ ] Checkbox filter: Unique values multi-select
- [ ] Date range filter
- [ ] Advanced filter: Multi-condition AND/OR builder
- [ ] Clear all filters restores full dataset
- [ ] Filter state shown in status bar

### Multi-Tab
- [ ] New tab created on file import
- [ ] Tab title reflects filename
- [ ] Switch tabs preserves independent state (filters, sort, scroll position)
- [ ] Close tab cleans up resources

---

## 4. Detection Engine Testing

### Process Chain Rules (327 rules)

Test with `terminal/test-data/sysmon-process.csv`:
- [ ] Office macro chains detected (winword.exe → cmd.exe)
- [ ] LOLBin abuse flagged (rundll32, regsvr32, mshta)
- [ ] Lateral movement detected (psexec → cmd)
- [ ] Severity scores (0–3) assigned correctly
- [ ] MITRE ATT&CK technique IDs present
- [ ] Benign parent→child doesn't false positive

### Regex Patterns (64 patterns)
- [ ] Encoded PowerShell detected (-enc, -EncodedCommand)
- [ ] Credential dumping indicators (lsass, mimikatz references)
- [ ] Suspicious paths flagged (AppData\Local\Temp)
- [ ] Case-insensitive matching works

### Rule Highlighting
- [ ] High-severity rows (3) highlighted in red/warning color
- [ ] Colors persist through sort/filter/scroll
- [ ] Detail panel shows rule description and technique

---

## 5. Analysis Panels Testing

- [ ] **Histogram**: ASCII bars (TUI) / chart (GUI), click/enter zooms to date range
- [ ] **Stacking View**: Frequency aggregation, sort by count
- [ ] **Process Tree**: Parent→child tree with severity coloring, expand/collapse
- [ ] **Lateral Movement**: Source→dest→method table populated
- [ ] **Persistence View**: Registry/task/WMI analysis results
- [ ] **Gap Analysis**: Time gaps and bursts detected, suspicious gaps highlighted
- [ ] **IOC Matcher**: Load `iocs.txt`, matching rows highlighted

---

## 6. Export & Session Testing

- [ ] Export filtered data to CSV
- [ ] Export to XLSX
- [ ] HTML report generation (bookmarked + tagged events)
- [ ] Session save: Captures columns, filters, bookmarks, sort state
- [ ] Session restore: Reloads saved state correctly

---

## 7. TUI-Specific Testing (Terminal + Docker)

### Keyboard Navigation
- [ ] `j`/`k` or `↑`/`↓`: Row navigation
- [ ] `g`/`G` or `Home`/`End`: First/last row
- [ ] `Ctrl+d`/`Ctrl+u` or `PgDn`/`PgUp`: Half-page scroll
- [ ] `h`/`l` or `←`/`→`: Column scroll
- [ ] `Tab`/`Shift+Tab`: Tab switching
- [ ] `/`: Focus search bar
- [ ] `Enter`: Toggle detail panel
- [ ] `Escape`: Close modal/panel
- [ ] `q`/`Ctrl+q`: Quit
- [ ] `?`: Help overlay

### Theme
- [ ] Dark theme (default) renders readably
- [ ] Light theme toggle works
- [ ] Matrix theme renders
- [ ] `--theme` CLI flag works

### Terminal Compatibility
- [ ] Works in xterm-256color terminals
- [ ] Works in macOS Terminal.app
- [ ] Works in Windows Terminal
- [ ] Works in tmux/screen
- [ ] Colors render correctly in Docker container

---

## 8. Platform-Specific Edge Cases

### Linux
- [ ] X11 and Wayland display servers both work
- [ ] Desktop file associations (.csv → IRFlow)
- [ ] AppImage FUSE2 requirement documented/handled

### Windows
- [ ] NSIS installer UAC prompt works
- [ ] File associations set during install
- [ ] UNC paths (`\\server\share\file.csv`) accessible
- [ ] Long file paths supported
- [ ] Works as standard user (no admin required for portable)

### macOS
- [ ] App works on both Intel and Apple Silicon
- [ ] Gatekeeper allows app to run after user approval
- [ ] File associations registered for supported formats

### Docker
- [ ] Environment variables passed (`TERM`, `COLORTERM`)
- [ ] Clean exit codes (0 = success, 1 = error)
- [ ] Volume mount permissions correct (files readable)

---

## 9. Performance Benchmarks

| Metric | Target |
|--------|--------|
| 1 GB CSV import time | < 60 seconds |
| FTS5 search latency | < 500 ms |
| Memory (idle, 1 file open) | < 200 MB |
| Memory growth over time | Stable (no unbounded growth) |
| First row rendered after import | < 2 seconds |
| UI/TUI responsiveness during import | No freeze/hang |

### Performance Test Procedure
1. Import 1 GB+ CSV, note time and memory
2. Scroll through entire dataset, monitor memory
3. Run 10 searches, measure response time
4. Open/close files repeatedly, check for memory leaks
5. Leave running 30 minutes, verify memory stable

---

## 10. Quick Smoke Test (Run First on Each Platform)

Minimum viable test to confirm basic functionality:

1. **Launch**: Start the app (GUI or TUI)
2. **Import**: Open `test-data.csv` (29 rows)
3. **Scroll**: Navigate up/down through all rows
4. **Search**: Search for "cmd.exe", verify results
5. **Sort**: Sort by timestamp column
6. **Filter**: Filter a column, verify row count changes
7. **Detail**: Open detail panel for a row
8. **Detection**: Verify at least one process chain rule triggers (highlighted row)
9. **Export**: Export to CSV, verify output file
10. **Exit**: Quit cleanly (no crash, no zombie processes)

---

## Critical Files Reference

| File | Description |
|------|-------------|
| `linux/electron/db.js` | TimelineDB class (4279 lines) |
| `linux/electron/parser.js` | File parsers (1094 lines) |
| `linux/src/detection-rules.js` | 327 chain rules + 64 regex patterns |
| `terminal/lib/app.js` | TUI main app (649 lines) |
| `terminal/lib/widgets/data-grid.js` | TUI data grid (396 lines) |
| `terminal/Dockerfile` | Docker build |
| `terminal/docker-compose.yml` | Docker Compose config |
| `linux/build.js` | Linux build script |
| `windows/build.js` | Windows build script |
