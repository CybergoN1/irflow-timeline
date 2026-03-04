"use strict";

/**
 * gap-analysis.js — Panel: gap/burst detection
 */

const { formatNumber, formatDuration } = require("../utils/format");

function createGapAnalysis(blessed, screen, state, theme, db) {
  const box = blessed.box({
    parent: screen,
    bottom: 1,
    left: 0,
    width: "100%",
    height: "50%",
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Gap / Burst Analysis{/} `,
  });

  // Tab bar for switching between gaps and bursts
  const modeBar = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content: "",
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  const list = blessed.list({
    parent: box,
    top: 2,
    left: 1,
    width: "100%-2",
    height: "100%-4",
    tags: true,
    keys: true,
    vi: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: "\u2588", style: { fg: theme.accent } },
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      selected: { bg: theme.modal.selectedBg, fg: theme.modal.selectedFg },
    },
  });

  const hint = blessed.text({
    parent: box,
    bottom: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content: ` {${theme.accentAlt}-fg}Tab{/}=gaps/bursts  {${theme.accentAlt}-fg}Enter{/}=zoom  {${theme.accentAlt}-fg}Esc{/}=close`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  let mode = "gaps"; // "gaps" | "bursts"
  let gapData = [];
  let burstData = [];
  let tsColumn = null;

  function updateModeBar() {
    const gapStyle = mode === "gaps" ? `{${theme.accent}-fg}{bold}` : "";
    const burstStyle = mode === "bursts" ? `{${theme.accent}-fg}{bold}` : "";
    modeBar.setContent(` ${gapStyle}[Gaps]${mode === "gaps" ? "{/}" : ""}  ${burstStyle}[Bursts]${mode === "bursts" ? "{/}" : ""}`);
  }

  function loadData() {
    if (!state.activeTabId || !db) return;

    const tab = state.activeTab;
    if (!tab) return;
    tsColumn = tab.tsColumns ? [...tab.tsColumns][0] : null;
    if (!tsColumn) {
      tsColumn = tab.headers.find((h) => /datetime|timestamp|date|time/i.test(h)) || tab.headers[0];
    }

    const opts = state.getQueryOptions({ limit: undefined, offset: undefined });

    try {
      const gapResult = db.getGapAnalysis(state.activeTabId, tsColumn, 30, opts);
      gapData = Array.isArray(gapResult) ? gapResult : (gapResult?.gaps || []);
    } catch { gapData = []; }

    try {
      const burstResult = db.getBurstAnalysis(state.activeTabId, tsColumn, 5, 3, opts);
      burstData = Array.isArray(burstResult) ? burstResult : (burstResult?.bursts || []);
    } catch { burstData = []; }
  }

  function renderList() {
    updateModeBar();

    if (mode === "gaps") {
      if (gapData.length === 0) {
        list.setItems(["  No significant gaps detected"]);
      } else {
        const items = gapData.map((g) => {
          const start = String(g.from || g.gapStart || g.start || "").padEnd(22);
          const end = String(g.to || g.gapEnd || g.end || "").padEnd(22);
          const dur = g.durationMinutes ? `${formatNumber(Math.round(g.durationMinutes))} min` : "";
          return ` {${theme.accentAlt}-fg}${start}{/} \u2192 {${theme.accentAlt}-fg}${end}{/}  ${dur}`;
        });
        list.setItems(items);
      }
    } else {
      if (burstData.length === 0) {
        list.setItems(["  No bursts detected"]);
      } else {
        const items = burstData.map((b) => {
          const time = String(b.from || b.windowStart || b.time || "").padEnd(22);
          const count = formatNumber(b.eventCount || b.count || 0).padStart(8);
          const rate = b.peakRate ? ` (${formatNumber(Math.round(b.peakRate))}/min)` : "";
          return ` {${theme.progress.spinnerFg}-fg}${time}{/}  ${count} events${rate}`;
        });
        list.setItems(items);
      }
    }
    list.select(0);
    screen.render();
  }

  function show() {
    mode = "gaps";
    loadData();
    renderList();
    box.show();
    list.focus();
    state.setPanel("gap-analysis");
    screen.render();
  }

  function hide() {
    box.hide();
    state.setPanel(null);
    screen.render();
  }

  list.key("tab", () => {
    mode = mode === "gaps" ? "bursts" : "gaps";
    renderList();
  });

  list.key(["escape"], hide);

  return { widget: box, show, hide };
}

module.exports = { createGapAnalysis };
