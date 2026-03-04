# Prerequisites — Windows

This guide assumes a **clean Windows 10/11 install** with no developer tools present.

---

## 1. Git for Windows

Download and install from [git-scm.com](https://git-scm.com/download/win), or via winget:

```powershell
winget install Git.Git
```

Close and reopen your terminal after installing.

**Verify:**
```powershell
git --version
# Expected: git version 2.x.x.windows.x
```

---

## 2. Node.js 18+ and npm

### Option A — Official Installer (Recommended)

Download the **LTS** installer from [nodejs.org](https://nodejs.org/en/download/).

During installation, **check the box** for _"Automatically install the necessary tools"_ — this installs Chocolatey + Visual Studio Build Tools + Python, which are needed for native module compilation.

### Option B — winget

```powershell
winget install OpenJS.NodeJS.LTS
```

> **Note:** If using Option B, you still need to install Visual Studio Build Tools and Python manually (see steps 3 and 4 below).

**Verify:**
```powershell
node -v    # Expected: v18.x.x or higher
npm -v     # Expected: 9.x.x or higher
```

---

## 3. Visual Studio Build Tools (C++ Compiler)

Required to compile `better-sqlite3` (a native Node.js module that uses C++).

### Option A — If you used the Node.js installer checkbox

Already done! The Node.js installer handles this if you checked the tools option.

### Option B — Manual install

Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-studio-cpp-build-tools/).

During installation, select the **"Desktop development with C++"** workload.

### Option C — npm helper package

```powershell
# Run PowerShell as Administrator
npm install -g windows-build-tools
```

**Verify:**
```powershell
# Check if the C++ compiler is accessible
where cl
# If this returns a path, you're good. If not, the Build Tools aren't in your PATH.
# That's often OK — node-gyp finds them via registry.
```

---

## 4. Python 3

Required by `node-gyp` to compile native modules.

### Option A — If installed via Node.js installer

Already done!

### Option B — Manual install

Download from [python.org](https://www.python.org/downloads/) or via winget:

```powershell
winget install Python.Python.3.12
```

> **Important:** During installation, check **"Add Python to PATH"**.

**Verify:**
```powershell
python --version
# Expected: Python 3.x.x
```

---

## 5. Windows Icon File (Optional — for building installer)

To build a distributable installer, you need `assets/icon.ico`. Generate it from the included SVG:

### Using ImageMagick (recommended)

```powershell
winget install ImageMagick.ImageMagick
magick convert assets/icon.svg -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico
```

### Using an online converter

Upload `assets/icon.svg` to [cloudconvert.com](https://cloudconvert.com/svg-to-ico) or [icoconvert.com](https://icoconvert.com/) and save the result as `assets/icon.ico`.

> **Note:** The `.ico` is only needed for packaging (`npm run dist`). Development mode works without it.

---

## All Set?

Once all prerequisites are installed, head back to the [README](./README.md) and follow the Quick Start instructions.

### Quick Verification Checklist

Run this in PowerShell:

```powershell
git --version
node -v
npm -v
python --version
echo "All prerequisites verified!"
```
