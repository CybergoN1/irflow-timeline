"use strict";

/**
 * stacking-view.js — Panel: frequency aggregation table
 */

const { formatNumber } = require("../utils/format");

function createStackingView(blessed, screen, state, theme, db) {
  const box = blessed.box({
    parent: screen,
    bottom: 1,
    left: 0,
    width: "100%",
    height: "45%",
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Stacking / Frequency Analysis{/} `,
  });

  // Column selector hint
  const hint = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content: ` {${theme.accentAlt}-fg}Tab{/}=change column  {${theme.accentAlt}-fg}Enter{/}=filter to value  {${theme.accentAlt}-fg}Esc{/}=close`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  const list = blessed.list({
    parent: box,
    top: 2,
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

  let stackingData = [];
  let currentCol = null;
  let colIndex = 0;

  function loadData() {
    if (!state.activeTabId || !db || !currentCol) return;

    try {
      const opts = state.getQueryOptions({ limit: undefined, offset: undefined });
      const result = db.getStackingData(state.activeTabId, currentCol, opts);
      stackingData = Array.isArray(result) ? result : (result?.values || []);
    } catch {
      stackingData = [];
    }

    box.setLabel(` {${theme.modal.titleFg}-fg}{bold}\u25C8 Stacking: ${currentCol}{/} `);

    if (stackingData.length === 0) {
      list.setItems(["  No data"]);
    } else {
      const maxVal = Math.max(...stackingData.map((d) => d.count), 1);
      const barWidth = Math.max(5, box.width - 45);
      const items = stackingData.map((d) => {
        const val = String(d.value != null ? d.value : "(empty)").padEnd(25);
        const barLen = Math.round((d.count / maxVal) * barWidth);
        let bar = "";
        for (let i = 0; i < barLen; i++) {
          const t_pos = i / barWidth;
          if (t_pos < 0.5) bar += `{${theme.accent}-fg}\u2588{/}`;
          else bar += `{${theme.accentAlt}-fg}\u2588{/}`;
        }
        const count = formatNumber(d.count).padStart(10);
        return ` ${val} ${bar} ${count}`;
      });
      list.setItems(items);
    }
    list.select(0);
    screen.render();
  }

  function show() {
    if (!state.activeTab) return;
    const headers = state.activeTab.headers;
    if (!headers.length) return;

    colIndex = 0;
    currentCol = headers[colIndex];
    loadData();

    box.show();
    list.focus();
    state.setPanel("stacking");
    screen.render();
  }

  function hide() {
    box.hide();
    state.setPanel(null);
    screen.render();
  }

  // Tab to cycle columns
  list.key("tab", () => {
    if (!state.activeTab) return;
    const headers = state.activeTab.headers;
    colIndex = (colIndex + 1) % headers.length;
    currentCol = headers[colIndex];
    loadData();
  });

  // Enter to filter to selected value
  list.key("enter", () => {
    const idx = list.selected;
    if (idx >= 0 && idx < stackingData.length && currentCol) {
      state.addFilter({
        column: currentCol,
        operator: "==",
        value: String(stackingData[idx].value),
        logic: "AND",
      });
      hide();
    }
  });

  list.key(["escape", "S"], hide);

  return { widget: box, show, hide };
}

module.exports = { createStackingView };
