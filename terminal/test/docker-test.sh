#!/usr/bin/env bash
# IRFlow Timeline — Docker Test Script
#
# Validates:
#   - Docker build succeeds
#   - Image size < 500MB
#   - Container runs with test data
#   - Exit codes correct
#   - TTY allocation works
#
# Usage: bash test/docker-test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TERMINAL_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="irflow-tui-test"
MAX_SIZE_MB=500

passed=0
failed=0
total=0

pass() {
  ((passed++)) || true
  ((total++)) || true
  echo "  ✓ $1"
}

fail() {
  ((failed++)) || true
  ((total++)) || true
  echo "  ✗ $1"
}

check() {
  if eval "$1"; then
    pass "$2"
  else
    fail "$2"
  fi
}

echo "IRFlow Timeline — Docker Test"
echo ""

# ── 1. Docker available ──
echo "── Prerequisites ──"
if ! command -v docker &>/dev/null; then
  echo "  ✗ Docker not found — skipping all Docker tests"
  exit 1
fi
pass "Docker available ($(docker --version | head -1))"

# ── 2. Build ──
echo ""
echo "── Docker Build ──"
cd "$TERMINAL_DIR"

BUILD_START=$(date +%s)
if docker build -t "$IMAGE_NAME" . 2>&1 | tail -5; then
  BUILD_END=$(date +%s)
  BUILD_TIME=$((BUILD_END - BUILD_START))
  pass "Docker build succeeded (${BUILD_TIME}s)"
else
  fail "Docker build failed"
  echo ""
  echo "═══════════════════════════════"
  echo "  Passed: $passed  Failed: $failed  Total: $total"
  echo "═══════════════════════════════"
  exit 1
fi

# ── 3. Image size ──
echo ""
echo "── Image Size ──"
SIZE_BYTES=$(docker image inspect "$IMAGE_NAME" --format='{{.Size}}' 2>/dev/null || echo "0")
SIZE_MB=$((SIZE_BYTES / 1024 / 1024))
if [ "$SIZE_MB" -lt "$MAX_SIZE_MB" ]; then
  pass "Image size: ${SIZE_MB}MB (< ${MAX_SIZE_MB}MB)"
else
  fail "Image size: ${SIZE_MB}MB (exceeds ${MAX_SIZE_MB}MB)"
fi

# ── 4. Help flag ──
echo ""
echo "── Container Execution ──"
if docker run --rm "$IMAGE_NAME" --help 2>&1 | grep -qi "irflow\|usage\|timeline\|tui"; then
  pass "--help flag works"
else
  fail "--help flag — no recognizable output"
fi

# ── 5. Test data included ──
if docker run --rm --entrypoint ls "$IMAGE_NAME" /app/test-data/ 2>&1 | grep -q "sysmon"; then
  pass "Test data included in image"
else
  fail "Test data not found in image"
fi

# ── 6. Environment variables ──
TERM_VAL=$(docker run --rm --entrypoint env "$IMAGE_NAME" 2>/dev/null | grep "^TERM=" | cut -d= -f2)
if [ "$TERM_VAL" = "xterm-256color" ]; then
  pass "TERM=xterm-256color set"
else
  fail "TERM not set correctly (got: $TERM_VAL)"
fi

COLORTERM_VAL=$(docker run --rm --entrypoint env "$IMAGE_NAME" 2>/dev/null | grep "^COLORTERM=" | cut -d= -f2)
if [ "$COLORTERM_VAL" = "truecolor" ]; then
  pass "COLORTERM=truecolor set"
else
  fail "COLORTERM not set correctly (got: $COLORTERM_VAL)"
fi

NODE_ENV_VAL=$(docker run --rm --entrypoint env "$IMAGE_NAME" 2>/dev/null | grep "^NODE_ENV=" | cut -d= -f2)
if [ "$NODE_ENV_VAL" = "production" ]; then
  pass "NODE_ENV=production set"
else
  fail "NODE_ENV not set correctly (got: $NODE_ENV_VAL)"
fi

# ── 7. Volume mount ──
echo ""
echo "── Volume Mounts ──"
# Create a temp CSV to mount
TMPCSV=$(mktemp /tmp/irflow-docker-test-XXXXXX.csv)
echo 'datetime,source,message' > "$TMPCSV"
echo '2024-01-01 00:00:00,test,hello world' >> "$TMPCSV"

BASENAME=$(basename "$TMPCSV")
if docker run --rm -v "$TMPCSV:/data/$BASENAME" --entrypoint ls "$IMAGE_NAME" "/data/$BASENAME" 2>&1 | grep -q "$BASENAME"; then
  pass "Volume mount readable"
else
  fail "Volume mount not accessible"
fi
rm -f "$TMPCSV"

# ── 8. Exit codes ──
echo ""
echo "── Exit Codes ──"
# --help should exit 0
docker run --rm "$IMAGE_NAME" --help >/dev/null 2>&1
HELP_EXIT=$?
if [ "$HELP_EXIT" -eq 0 ]; then
  pass "--help exits with code 0"
else
  fail "--help exit code: $HELP_EXIT (expected 0)"
fi

# ── 9. Docker Compose ──
echo ""
echo "── Docker Compose ──"
if [ -f "$TERMINAL_DIR/docker-compose.yml" ]; then
  pass "docker-compose.yml exists"
  if docker compose config -q 2>/dev/null; then
    pass "docker-compose.yml is valid"
  elif docker-compose config -q 2>/dev/null; then
    pass "docker-compose.yml is valid (v1)"
  else
    fail "docker-compose.yml validation failed"
  fi
else
  fail "docker-compose.yml not found"
fi

# ── Cleanup ──
echo ""
echo "── Cleanup ──"
docker rmi "$IMAGE_NAME" >/dev/null 2>&1 && pass "Test image removed" || fail "Could not remove test image"

# ── Summary ──
echo ""
echo "═══════════════════════════════════"
echo "  Passed: $passed  Failed: $failed  Total: $total"
echo "═══════════════════════════════════"

[ "$failed" -eq 0 ] && exit 0 || exit 1
