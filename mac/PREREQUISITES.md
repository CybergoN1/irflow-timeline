# Prerequisites — macOS

This guide assumes a **clean macOS install** with no developer tools present.

---

## 1. Xcode Command Line Tools

Required for compiling native Node.js modules (like `better-sqlite3`).

```bash
xcode-select --install
```

A dialog will appear — click **Install** and wait for it to complete (~2–5 minutes).

**Verify:**
```bash
xcode-select -p
# Expected: /Library/Developer/CommandLineTools
```

---

## 2. Homebrew (Package Manager)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen instructions. On Apple Silicon Macs, you may need to add Homebrew to your PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

**Verify:**
```bash
brew --version
# Expected: Homebrew 4.x.x
```

---

## 3. Node.js 18+ and npm

```bash
brew install node
```

**Verify:**
```bash
node -v   # Expected: v18.x.x or higher
npm -v    # Expected: 9.x.x or higher
```

> **Alternative**: Use [nvm](https://github.com/nvm-sh/nvm) if you need multiple Node.js versions:
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
> source ~/.zshrc
> nvm install 20
> ```

---

## 4. Python 3 (for node-gyp)

Python 3 is required by `node-gyp` to compile native modules. It's usually included with Xcode CLI tools, but verify:

```bash
python3 --version
# Expected: Python 3.x.x
```

If missing:
```bash
brew install python3
```

---

## 5. Git

Git ships with Xcode CLI tools, but verify:

```bash
git --version
# Expected: git version 2.x.x
```

If missing:
```bash
brew install git
```

---

## All Set?

Once all prerequisites are installed, head back to the [README](./README.md) and follow the Quick Start instructions.

### Quick Verification Checklist

```bash
xcode-select -p && echo "✅ Xcode CLI Tools"
brew --version && echo "✅ Homebrew"
node -v && echo "✅ Node.js"
npm -v && echo "✅ npm"
python3 --version && echo "✅ Python 3"
git --version && echo "✅ Git"
```
