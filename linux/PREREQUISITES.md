# Prerequisites — Linux (Ubuntu)

This guide assumes a **clean Ubuntu 22.04 or 24.04 LTS install** with no developer tools present.

---

## 1. Update System Packages

Always start with an up-to-date system:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Build Essentials (C/C++ Compiler)

Required for compiling native Node.js modules (like `better-sqlite3`).

```bash
sudo apt install -y build-essential
```

This installs `gcc`, `g++`, `make`, and related tools.

**Verify:**
```bash
gcc --version
# Expected: gcc (Ubuntu ...) 11.x or higher
```

---

## 3. Python 3

Required by `node-gyp` to compile native modules. Usually pre-installed on Ubuntu, but verify:

```bash
python3 --version
# Expected: Python 3.10.x or higher
```

If missing:
```bash
sudo apt install -y python3 python3-pip
```

---

## 4. Git

```bash
sudo apt install -y git
```

**Verify:**
```bash
git --version
# Expected: git version 2.x.x
```

---

## 5. Node.js 18+ and npm

### Option A — nvm (Recommended)

`nvm` (Node Version Manager) is the cleanest way to install Node.js on Linux:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Close and reopen your terminal, or run:

```bash
source ~/.bashrc
```

Then install Node.js:

```bash
nvm install 20
```

**Verify:**
```bash
node -v    # Expected: v20.x.x
npm -v     # Expected: 10.x.x
```

### Option B — NodeSource repository

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Verify:**
```bash
node -v    # Expected: v20.x.x
npm -v     # Expected: 10.x.x
```

### Option C — Snap

```bash
sudo snap install node --classic --channel=20
```

---

## 6. Additional Libraries

These may be needed for Electron and native module compilation:

```bash
sudo apt install -y \
  libsqlite3-dev \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  libatspi2.0-0 \
  libdrm2 \
  libgbm1 \
  libasound2
```

> **Note:** Most of these are Electron runtime dependencies. If you're building on a full Ubuntu Desktop install, many are already present.

---

## 7. FUSE (for AppImage — Optional)

If you plan to distribute or run AppImage builds:

```bash
# Ubuntu 22.04
sudo apt install -y fuse libfuse2

# Ubuntu 24.04 (uses FUSE3 by default, but AppImage needs FUSE2)
sudo apt install -y libfuse2t64
```

---

## 8. Icon File (Optional — for building packages)

To build distributable packages, you need PNG icon files. Generate from the included SVG:

### Using Inkscape

```bash
sudo apt install -y inkscape

# Generate multiple sizes for the icon directory
for size in 16 32 48 64 128 256 512; do
  inkscape -w $size -h $size assets/icon.svg -o assets/${size}x${size}.png
done
```

### Using ImageMagick

```bash
sudo apt install -y imagemagick

convert assets/icon.svg -resize 512x512 assets/icon.png
```

### Using rsvg-convert

```bash
sudo apt install -y librsvg2-bin

rsvg-convert -w 512 -h 512 assets/icon.svg > assets/icon.png
```

> **Note:** The icons are only needed for packaging. Development mode works without them.

---

## All Set?

Once all prerequisites are installed, head back to the [README](./README.md) and follow the Quick Start instructions.

### Quick Verification Checklist

```bash
gcc --version && echo "✅ Build tools"
python3 --version && echo "✅ Python 3"
git --version && echo "✅ Git"
node -v && echo "✅ Node.js"
npm -v && echo "✅ npm"
echo "All prerequisites verified!"
```
