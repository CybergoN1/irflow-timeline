# IRFlow Timeline TUI — Multi-stage Docker build
# Usage:
#   docker build -t irflow-tui .
#   docker run -it -v /path/to/evidence:/data irflow-tui /data/timeline.csv
#   docker run -it -v /path/to/evidence:/data irflow-tui --theme matrix /data/*.csv

# ── Stage 1: Build (compile better-sqlite3 native module) ──
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

# ── Stage 2: Runtime (lean image, no build tools) ──
FROM node:20-slim

# Terminal capabilities for neo-blessed
ENV TERM=xterm-256color \
    COLORTERM=truecolor \
    NODE_ENV=production

WORKDIR /app

# Copy compiled node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY package.json ./
COPY bin/ ./bin/
COPY lib/ ./lib/
COPY test-data/ ./test-data/

# Default data mount point
RUN mkdir -p /data

# Make entry point executable
RUN chmod +x bin/irflow-tui.js

ENTRYPOINT ["node", "bin/irflow-tui.js"]

# Default: show help if no files provided
CMD ["--help"]
