"use strict";

/**
 * histogram.js — Cyberpunk styled ASCII timeline bar chart with gradient bars
 */

const { formatNumber } = require("../utils/format");

const BAR_CHARS = [" ", "\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"];

function createHistogram(blessed, screen, state, theme, db) {
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
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Histogram{/} `,
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
    content: ` {${theme.accentAlt}-fg}Enter{/}=zoom  {${theme.accentAlt}-fg}Esc{/}=close`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  let histogramData = [];
  let tsColumn = null;

  function show() {
    if (!state.activeTabId || !db) return;

    const tab = state.activeTab;
    if (!tab) return;
    tsColumn = tab.tsColumns ? [...tab.tsColumns][0] : null;
    if (!tsColumn) {
      tsColumn = tab.headers.find((h) => /datetime|timestamp|date|time/i.test(h)) || tab.headers[0];
    }

    box.setLabel(` {${theme.modal.titleFg}-fg}{bold}\u25C8 Histogram: ${tsColumn}{/} `);

    try {
      const opts = state.getQueryOptions({ limit: undefined, offset: undefined });
      const raw = db.getHistogramData(state.activeTabId, tsColumn, opts) || [];
      // db returns { day, cnt } — normalize to { label, count }
      histogramData = raw.map((d) => ({
        label: d.day || d.label || d.bucket || "",
        count: d.cnt || d.count || 0,
        rangeStart: d.day || d.rangeStart,
        rangeEnd: d.day || d.rangeEnd,
      }));
    } catch {
      histogramData = [];
    }

    if (histogramData.length === 0) {
      list.setItems([`  {${theme.modal.dimFg}-fg}No histogram data available{/}`]);
    } else {
      const maxVal = Math.max(...histogramData.map((d) => d.count), 1);
      const barWidth = Math.max(10, box.width - 38);

      const items = histogramData.map((d) => {
        const label = String(d.label || d.bucket || "").padEnd(20);
        const fraction = d.count / maxVal;
        const filledWidth = Math.round(fraction * barWidth);

        // Gradient bar: purple → green based on position
        let bar = "";
        for (let i = 0; i < filledWidth; i++) {
          const t_pos = i / barWidth;
          if (t_pos < 0.3) bar += `{${theme.accent}-fg}\u2588{/}`;
          else if (t_pos < 0.7) bar += `{${theme.progress.spinnerFg}-fg}\u2588{/}`;
          else bar += `{${theme.accentAlt}-fg}\u2588{/}`;
        }
        const emptyPart = barWidth - filledWidth;
        if (emptyPart > 0) bar += `{${theme.modal.dimFg}-fg}${"\u2591".repeat(emptyPart)}{/}`;

        const count = formatNumber(d.count).padStart(9);
        return ` {${theme.modal.fg}-fg}${label}{/} ${bar} {${theme.accentAlt}-fg}${count}{/}`;
      });
      list.setItems(items);
    }

    list.select(0);
    box.show();
    list.focus();
    state.setPanel("histogram");
    screen.render();
  }

  function hide() { box.hide(); state.setPanel(null); screen.render(); }

  list.key("enter", () => {
    const idx = list.selected;
    if (idx >= 0 && idx < histogramData.length && tsColumn) {
      const d = histogramData[idx];
      if (d.rangeStart && d.rangeEnd) {
        state.addFilter({ column: tsColumn, operator: ">=", value: d.rangeStart, logic: "AND" });
        state.addFilter({ column: tsColumn, operator: "<=", value: d.rangeEnd, logic: "AND" });
        hide();
      }
    }
  });

  list.key(["escape", "H"], hide);

  return { widget: box, show, hide };
}

module.exports = { createHistogram };
