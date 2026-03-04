"use strict";

/**
 * detail-panel.js — Cyberpunk styled expanded row view with labeled fields,
 * severity badges, and visual dividers
 */

function createDetailPanel(blessed, screen, state, theme) {
  const box = blessed.box({
    parent: screen,
    bottom: 1,
    left: 0,
    width: "100%",
    height: "40%",
    border: { type: "line" },
    tags: true,
    hidden: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    scrollbar: { ch: "\u2588", style: { fg: theme.accent } },
    style: {
      bg: theme.detail.bg,
      fg: theme.detail.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Row Detail{/} `,
  });

  function render(row) {
    if (!row) {
      box.setContent(`  {${theme.modal.dimFg}-fg}No row selected{/}`);
      screen.render();
      return;
    }

    const headers = state.activeTab ? state.activeTab.headers : Object.keys(row);
    const lines = [];
    const maxLabelLen = Math.max(...headers.map((h) => h.length), 10);

    // Divider
    const divWidth = Math.min(box.width - 4, 70);
    const divider = `  {${theme.detail.borderFg}-fg}${"─".repeat(divWidth)}{/}`;

    // Meta indicators at top
    const metaParts = [];
    if (row._bookmarked) metaParts.push(`{${theme.bookmarkFg}-fg}\u2605 Bookmarked{/}`);
    if (row._tags) metaParts.push(`{${theme.tagFg}-fg}\u25CF Tags: ${row._tags}{/}`);
    if (metaParts.length) {
      lines.push(`  ${metaParts.join("  ")}`);
      lines.push(divider);
    }

    // Field rows
    for (const h of headers) {
      const val = row[h] != null ? String(row[h]) : "";
      const label = h.padEnd(maxLabelLen);
      // Highlight non-empty values in accent color
      const valColor = val ? theme.detail.valueFg : theme.modal.dimFg;
      const valDisplay = val || "(empty)";
      lines.push(`  {${theme.detail.labelFg}-fg}{bold}${label}{/}  {${valColor}-fg}${valDisplay}{/}`);
    }

    // Row ID at bottom
    lines.push(divider);
    const rowId = row.rowid || row._rowid || "?";
    lines.push(`  {${theme.modal.dimFg}-fg}rowid: ${rowId}  \u2502  ${headers.length} fields{/}`);

    box.setContent(lines.join("\n"));
    box.scrollTo(0);
    screen.render();
  }

  function show() { box.show(); state.detailOpen = true; screen.render(); }
  function hide() { box.hide(); state.detailOpen = false; screen.render(); }
  function toggle() {
    if (state.detailOpen) { hide(); }
    else { show(); render(state.rows[state.selectedRow]); }
  }

  state.on("data-changed", () => {
    if (state.detailOpen) render(state.rows[state.selectedRow]);
  });

  return { widget: box, render, show, hide, toggle };
}

module.exports = { createDetailPanel };
