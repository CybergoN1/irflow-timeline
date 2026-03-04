# Installation

## System Requirements

| Requirement | Minimum |
|------------|---------|
| **OS** | Windows 10 (64-bit) or later |
| **Architecture** | x86_64 (Intel/AMD) |
| **RAM** | 8 GB (16 GB recommended for large files) |
| **Disk** | 500 MB for app + space for temporary SQLite databases |

## Download

Download the latest installer from the [GitHub Releases](https://github.com/r3nzsec/irflow-timeline/releases) page.

Two options are available:

| Format | Description |
|--------|-------------|
| **NSIS Installer** (`.exe`) | Setup wizard with Start Menu shortcut, file associations, and uninstaller |
| **Portable** (`.exe`) | Single executable, no installation required — runs from any folder or USB drive |

## Install via NSIS Installer

1. Download `IRFlow-Timeline-Setup-x.x.x.exe`
2. Run the installer
3. Choose install location (default: `C:\Program Files\IRFlow Timeline`)
4. Optionally create a Desktop shortcut
5. Click **Install**
6. Launch IRFlow Timeline from the Start Menu or Desktop shortcut

The installer automatically registers file associations for supported formats.

## Portable Mode

1. Download `IRFlow-Timeline-Portable-x.x.x.exe`
2. Place the `.exe` in any folder
3. Double-click to run — no installation needed

::: tip Portable Data
The portable version stores its data in the same directory as the executable. This makes it ideal for USB drive deployment or restricted environments.
:::

## Build from Source

If you prefer to build from source:

```powershell
# Clone the repository
git clone https://github.com/r3nzsec/irflow-timeline.git
cd irflow-timeline\windows

# Install dependencies
npm install

# Rebuild native modules for Electron
npx electron-rebuild -f -w better-sqlite3

# Run in development mode
npm run dev

# Build NSIS installer
npm run dist:nsis

# Build portable executable
npm run dist:portable
```

### Build Script

The project includes an interactive `build.js` script with multiple options:

| Option | Description |
|--------|-------------|
| **Dev Mode** | Vite hot-reload + Electron |
| **Quick Start** | Build renderer and launch |
| **NSIS Installer** | Full setup wizard with uninstaller |
| **Portable Executable** | Single `.exe`, no install required |

```powershell
node build.js
```

### Prerequisites for Building

See [PREREQUISITES.md](https://github.com/r3nzsec/irflow-timeline/blob/main/windows/PREREQUISITES.md) for a complete guide to setting up your Windows development environment from scratch.

Required:
- Node.js 18+ and npm
- Visual Studio Build Tools (C++ workload)
- Python 3
- Git for Windows

## File Associations

After installation (via NSIS installer), IRFlow Timeline registers as a viewer for the following file types. You can double-click these files in File Explorer to open them directly:

- `.csv` — CSV files
- `.tsv` — TSV files
- `.xlsx` — Excel files
- `.plaso` — Plaso timeline databases
- `.evtx` — Windows Event Log files

::: info Portable Mode
File associations are not registered in portable mode. Use **File > Open** or drag and drop files onto the application window.
:::
