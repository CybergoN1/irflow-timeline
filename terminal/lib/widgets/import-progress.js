"use strict";

/**
 * import-progress.js — Cyberpunk styled overlay with animated spinner,
 * gradient progress bar, and throughput stats
 *
 *  ┌─── Importing ────────────────────────────┐
 *  │                                           │
 *  │  ⠋ Loading  test-data.csv                 │
 *  │                                           │
 *  │  ████████████████░░░░░░░░░░░  62.3%       │
 *  │                                           │
 *  │  156,234 rows  ·  3.2s  ·  48,823 rows/s │
 *  │                                           │
 *  └───────────────────────────────────────────┘
 */

const { formatNumber, formatDuration } = require("../utils/format");

const SPINNER = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
const BAR_FULL  = "\u2588"; // █
const BAR_MED   = "\u2593"; // ▓
const BAR_LIGHT = "\u2591"; // ░
const BAR_EMPTY = "\u2591"; // ░

function createImportProgress(blessed, screen, theme) {
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 62,
    height: 12,
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Importing{/} `,
  });

  // Decorative top line
  const decor = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  const phaseText = blessed.text({
    parent: box,
    top: 2,
    left: 3,
    width: "100%-6",
    height: 1,
    tags: true,
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  const progressBar = blessed.box({
    parent: box,
    top: 4,
    left: 3,
    width: "100%-6",
    height: 1,
    tags: true,
    style: { bg: theme.modal.bg, fg: theme.progress.barFg },
  });

  const percentText = blessed.text({
    parent: box,
    top: 5,
    left: 3,
    width: "100%-6",
    height: 1,
    tags: true,
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  const statsText = blessed.text({
    parent: box,
    top: 7,
    left: 3,
    width: "100%-6",
    height: 2,
    tags: true,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  let _startTime = 0;
  let _spinIdx = 0;
  let _spinInterval = null;

  function show() {
    _startTime = Date.now();
    _spinIdx = 0;
    box.show();
    _spinInterval = setInterval(() => {
      _spinIdx++;
      screen.render();
    }, 80);
    screen.render();
  }

  function hide() {
    box.hide();
    if (_spinInterval) { clearInterval(_spinInterval); _spinInterval = null; }
    screen.render();
  }

  function update(progress) {
    const { phase, current, total, fileName } = progress || {};
    const elapsed = Date.now() - _startTime;

    // Spinner + phase
    const frame = `{${theme.progress.spinnerFg}-fg}${SPINNER[_spinIdx % SPINNER.length]}{/}`;
    const name = fileName ? `  {bold}${fileName}{/}` : "";
    phaseText.setContent(`${frame} {${theme.modal.fg}-fg}${phase || "Loading"}${name}{/}`);

    // Progress bar with gradient
    const fraction = total > 0 ? Math.min(1, current / total) : 0;
    const barWidth = box.width - 8;
    const filledWidth = Math.round(fraction * barWidth);
    const emptyWidth = barWidth - filledWidth;

    let bar = "";
    // Gradient: filled portion goes from purple to green
    if (filledWidth > 0) {
      const purplePart = Math.floor(filledWidth * 0.4);
      const greenPart = filledWidth - purplePart;
      bar += `{${theme.accent}-fg}${BAR_FULL.repeat(purplePart)}{/}`;
      bar += `{${theme.progress.barFg}-fg}${BAR_FULL.repeat(greenPart)}{/}`;
    }
    if (emptyWidth > 0) {
      bar += `{${theme.progress.barBg}-fg}${BAR_EMPTY.repeat(emptyWidth)}{/}`;
    }
    progressBar.setContent(bar);

    // Percentage
    const pctStr = total > 0 ? `${(fraction * 100).toFixed(1)}%` : "";
    percentText.setContent(`{${theme.progress.barFg}-fg}{bold}${pctStr}{/}`);

    // Stats
    const parts = [];
    if (current > 0) parts.push(`{${theme.modal.fg}-fg}${formatNumber(current)} rows{/}`);
    if (elapsed > 1000) parts.push(`{${theme.modal.dimFg}-fg}${formatDuration(elapsed)}{/}`);
    if (elapsed > 500 && current > 0) {
      const rate = Math.round(current / (elapsed / 1000));
      parts.push(`{${theme.progress.barFg}-fg}${formatNumber(rate)} rows/sec{/}`);
    }
    statsText.setContent(parts.join(`  {${theme.modal.dimFg}-fg}\u00B7{/}  `));

    // Decorative animation
    const decorWidth = box.width - 4;
    const glowPos = _spinIdx % decorWidth;
    let decorLine = "";
    for (let i = 0; i < decorWidth; i++) {
      const dist = Math.abs(i - glowPos);
      if (dist === 0)      decorLine += `{${theme.progress.barFg}-fg}\u2501{/}`;
      else if (dist === 1) decorLine += `{${theme.accent}-fg}\u2500{/}`;
      else                 decorLine += `{${theme.modal.dimFg}-fg}\u2500{/}`;
    }
    decor.setContent(decorLine);

    screen.render();
  }

  return { widget: box, show, hide, update };
}

module.exports = { createImportProgress };
