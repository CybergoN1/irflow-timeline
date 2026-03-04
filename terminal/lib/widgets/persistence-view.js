"use strict";

/**
 * persistence-view.js — Panel: persistence mechanism analysis
 */

const { formatNumber } = require("../utils/format");

function createPersistenceView(blessed, screen, state, theme, db) {
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
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Persistence Analysis{/} `,
  });

  const list = blessed.list({
    parent: box,
    top: 1,
    left: 1,
    width: "100%-2",
    height: "100%-3",
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
    content: ` {${theme.accentAlt}-fg}Enter{/}=filter to item  {${theme.accentAlt}-fg}Esc{/}=close`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  let persistData = [];

  function show() {
    if (!state.activeTabId || !db) return;

    try {
      const opts = state.getQueryOptions({ limit: undefined, offset: undefined });
      const result = db.getPersistenceAnalysis(state.activeTabId, opts);
      persistData = Array.isArray(result) ? result : (result?.items || []);
    } catch {
      persistData = [];
    }

    if (persistData.length === 0) {
      list.setItems(["  No persistence mechanisms detected.",
        "  (Requires registry, service, or task columns)"]);
    } else {
      const header = ` ${"Type".padEnd(15)} ${"Detail".padEnd(35)} ${"Count".padStart(8)}`;
      const items = [header, " " + "\u2500".repeat(header.length - 1)];
      for (const row of persistData) {
        const type = String(row.type || "").padEnd(15);
        const detail = String(row.detail || row.value || "").padEnd(35);
        const count = formatNumber(row.count || 0).padStart(8);

        let color = theme.modal.fg;
        if (row.severity >= 2) color = theme.severity[3];
        else if (row.severity >= 1) color = theme.severity[2];

        items.push(` {${color}-fg}${type} ${detail} ${count}{/}`);
      }
      list.setItems(items);
    }

    list.select(0);
    box.show();
    list.focus();
    state.setPanel("persistence");
    screen.render();
  }

  function hide() {
    box.hide();
    state.setPanel(null);
    screen.render();
  }

  list.key(["escape", "A"], hide);

  return { widget: box, show, hide };
}

module.exports = { createPersistenceView };
