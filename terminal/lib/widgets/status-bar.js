"use strict";

/**
 * status-bar.js — Cyberpunk styled bottom bar with segmented info sections
 *
 *  ◈ 30 rows │ ▸ 12/30 │ ▲ datetime │ ⊛ 2 filters │ ◎ "powershell" 5 hits │ ?=Help
 */

const { formatNumber } = require("../utils/format");

const SEP     = " \u2502 "; // │
const ARROW_R = "\u25B8";   // ▸
const DIAMOND = "\u25C8";   // ◈
const CIRCLE  = "\u25CE";   // ◎
const FILTER  = "\u229B";   // ⊛
const SPINNER_FRAMES = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];

function createStatusBar(blessed, screen, state, theme) {
  const box = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    style: { bg: theme.statusBar.bg, fg: theme.statusBar.fg },
  });

  let spinnerIdx = 0;
  let spinnerInterval = null;

  function render() {
    const t = theme;

    if (!state.activeTab) {
      box.setContent(
        ` {${t.statusBar.accentFg}-fg}${DIAMOND}{/}` +
        ` {${t.statusBar.fg}-fg}IRFlow Timeline TUI{/}` +
        `${SEP}{${t.statusBar.accentFg}-fg}?{/}=Help` +
        `${SEP}{${t.statusBar.accentFg}-fg}Ctrl+O{/}=Open`
      );
      screen.render();
      return;
    }

    const parts = [];
    const tab = state.activeTab;

    // Row count
    if (tab.rowCount && state.totalRows !== tab.rowCount) {
      parts.push(`{${t.statusBar.accentFg}-fg}${DIAMOND}{/} ${formatNumber(state.totalRows)}{${t.statusBar.fg}-fg}/${formatNumber(tab.rowCount)}{/}`);
    } else {
      parts.push(`{${t.statusBar.accentFg}-fg}${DIAMOND}{/} ${formatNumber(state.totalRows)} rows`);
    }

    // Position
    if (state.rows.length > 0) {
      const pos = state.offset + state.selectedRow + 1;
      parts.push(`{${t.statusBar.accentFg}-fg}${ARROW_R}{/} ${formatNumber(pos)}`);
    }

    // Sort
    if (state.sortCol) {
      const arrow = state.sortOrder === "asc" ? "\u25B2" : "\u25BC";
      parts.push(`{${t.accent}-fg}${arrow}{/} ${state.sortCol}`);
    }

    // Filters
    if (state.advancedFilters.length > 0) {
      parts.push(`{${t.statusBar.warnFg}-fg}${FILTER}{/} ${state.advancedFilters.length} filter${state.advancedFilters.length > 1 ? "s" : ""}`);
    }
    if (state.bookmarkedOnly) {
      parts.push(`{${t.bookmarkFg}-fg}\u2605 Bookmarked{/}`);
    }
    if (state.tagFilter) {
      parts.push(`{${t.tagFg}-fg}\u25CF ${state.tagFilter}{/}`);
    }

    // Search
    if (state.searchActive) {
      parts.push(`{${t.statusBar.accentFg}-fg}${CIRCLE}{/} "${state.searchTerm}" {${t.statusBar.accentFg}-fg}${state.searchCount}{/} hits`);
    }

    // FTS building spinner
    const fts = state.ftsStatus[state.activeTabId];
    if (fts && fts.building) {
      const frame = SPINNER_FRAMES[spinnerIdx % SPINNER_FRAMES.length];
      parts.push(`{${t.progress.spinnerFg}-fg}${frame} FTS ${Math.round(fts.progress || 0)}%{/}`);
      startSpinner();
    } else {
      stopSpinner();
    }

    // Help hint
    parts.push(`{${t.accent}-fg}?{/}=Help`);

    box.setContent(" " + parts.join(SEP));
    screen.render();
  }

  function startSpinner() {
    if (spinnerInterval) return;
    spinnerInterval = setInterval(() => {
      spinnerIdx++;
      render();
    }, 100);
  }

  function stopSpinner() {
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
    }
  }

  state.on("data-changed", render);
  state.on("tab-changed", render);
  state.on("sort-changed", render);
  state.on("filter-changed", render);
  state.on("search-changed", render);
  state.on("theme-changed", render);

  render();
  return { widget: box, render };
}

module.exports = { createStatusBar };
