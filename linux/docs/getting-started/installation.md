# Installation

## System Requirements

| Requirement | Minimum |
|------------|---------|
| **OS** | Ubuntu 22.04 LTS or later (Debian-based distros) |
| **Architecture** | x86_64 (Intel/AMD) |
| **RAM** | 8 GB (16 GB recommended for large files) |
| **Disk** | 500 MB for app + space for temporary SQLite databases |

## Download

Download the latest package from the [GitHub Releases](https://github.com/r3nzsec/irflow-timeline/releases) page.

Two formats are available:

| Format | Description |
|--------|-------------|
| **AppImage** | Portable, runs on any Linux distro — no install needed |
| **`.deb`** | Debian/Ubuntu package with desktop integration and file associations |

## Install AppImage

1. Download `IRFlow-Timeline-x.x.x.AppImage`
2. Make it executable and run:

```bash
chmod +x IRFlow-Timeline-*.AppImage
./IRFlow-Timeline-*.AppImage
```

::: tip FUSE Requirement
AppImage requires FUSE to run. On Ubuntu 22.04: `sudo apt install -y libfuse2`. On Ubuntu 24.04: `sudo apt install -y libfuse2t64`.
:::

::: tip Desktop Integration
To add an AppImage to your application menu, use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) or manually create a `.desktop` file in `~/.local/share/applications/`.
:::

## Install .deb Package

```bash
sudo dpkg -i irflow-timeline_*.deb

# If there are missing dependencies:
sudo apt install -f
```

The `.deb` package installs to `/opt/IRFlow Timeline/` and creates:
- Application menu entry
- Desktop file for file associations
- Uninstall via `sudo apt remove irflow-timeline`

## Build from Source

If you prefer to build from source:

```bash
# Clone the repository
git clone https://github.com/r3nzsec/irflow-timeline.git
cd irflow-timeline/linux

# Install dependencies
npm install

# Rebuild native modules for Electron
npx electron-rebuild -f -w better-sqlite3

# Run in development mode
npm run dev

# Build AppImage
npm run dist:appimage

# Build .deb package
npm run dist:deb
```

### Build Script

The project includes an interactive `build.js` script with multiple options:

| Option | Description |
|--------|-------------|
| **Dev Mode** | Vite hot-reload + Electron |
| **Quick Start** | Build renderer and launch |
| **AppImage** | Portable, runs on any Linux distro |
| **`.deb` Package** | Debian/Ubuntu package with desktop integration |

```bash
node build.js
```

### Prerequisites for Building

See [PREREQUISITES.md](https://github.com/r3nzsec/irflow-timeline/blob/main/linux/PREREQUISITES.md) for a complete guide to setting up your Ubuntu development environment from scratch.

Required:
- Node.js 18+ and npm
- build-essential (gcc, g++, make)
- Python 3
- Git
- Electron runtime libraries (libgtk-3, libnss3, etc.)

## File Associations

After installation (via `.deb` package), IRFlow Timeline registers as a viewer for the following file types. You can double-click these files in your file manager or open them with `xdg-open`:

- `.csv` — CSV files
- `.tsv` — TSV files
- `.xlsx` — Excel files
- `.plaso` — Plaso timeline databases
- `.evtx` — Windows Event Log files

::: info AppImage Mode
File associations are not registered automatically with AppImage. Use **File > Open** or drag and drop files onto the application window.
:::
