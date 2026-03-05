"use strict";

/**
 * data-grid.js — Core scrollable data table with virtual scroll via SQL LIMIT/OFFSET
 *
 * Visual features:
 *   - Box-drawing column separators (│)
 *   - Header underline with column intersections (─┬─ / ─┼─)
 *   - Colored row numbers with gutter separator
 *   - Alternating row backgrounds
 *   - Bookmark ★ and tag ● colored indicators in gutter
 *   - Severity-based row highlighting for detection rule matches
 *   - Selected row with accent highlight bar
 */

const { truncate } = require("../utils/truncate");
const { padRight, padLeft } = require("../utils/format");

const DEFAULT_COL_WIDTH = 18;
const MIN_COL_WIDTH = 6;
const MAX_COL_WIDTH = 60;
const ROW_NUM_WIDTH = 7;

// Box-drawing characters
const V_LINE    = "\u2502"; // │
const H_LINE    = "\u2500"; // ─
const T_DOWN    = "\u252C"; // ┬
const T_CROSS   = "\u253C"; // ┼
const T_LEFT    = "\u2524"; // ┤
const T_RIGHT   = "\u251C"; // ├
const GUTTER    = "\u2502"; // │  gutter between row# and data

function createDataGrid(blessed, screen, state, theme, db) {
  const container = blessed.box({
    parent: screen,
    top: 2,
    left: 0,
    width: "100%",
    height: "100%-4",
    scrollable: false,
    tags: true,
    style: { bg: theme.grid.bg, fg: theme.grid.fg },
  });

  // Header row (column names)
  const headerBox = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    style: { bg: theme.grid.headerBg, fg: theme.grid.headerFg, bold: true },
  });

  // Header separator line (─┬─┬─)
  const separatorBox = blessed.box({
    parent: container,
    top: 1,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    style: { bg: theme.grid.bg, fg: theme.grid.borderFg },
  });

  // Data area
  const dataBox = blessed.box({
    parent: container,
    top: 2,
    left: 0,
    width: "100%",
    height: "100%-2",
    tags: true,
    scrollable: false,
    style: { bg: theme.grid.bg, fg: theme.grid.fg },
  });

  // ── Column width calculation ──
  function getColWidths() {
    const headers = getVisibleHeaders();
    const widths = {};
    for (const h of headers) {
      widths[h] = state.columnWidths[h] || Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, Math.max(h.length + 2, DEFAULT_COL_WIDTH)));
    }
    return widths;
  }

  function getVisibleHeaders() {
    if (state.visibleColumns.length > 0) return state.visibleColumns;
    return state.activeTab ? state.activeTab.headers : [];
  }

  // ── Rendering ──
  function renderHeader() {
    const headers = getVisibleHeaders();
    if (!headers.length) {
      headerBox.setContent("");
      separatorBox.setContent("");
      return;
    }

    const widths = getColWidths();
    const availWidth = screen.width;
    const startCol = state.colScroll;

    // ── Header line ──
    let hdr = `{${theme.grid.borderFg}-fg}${padRight(" #", ROW_NUM_WIDTH)}${GUTTER}{/}`;
    let sep = `{${theme.grid.borderFg}-fg}${H_LINE.repeat(ROW_NUM_WIDTH)}${T_DOWN}{/}`;

    let usedWidth = ROW_NUM_WIDTH + 1;
    for (let i = startCol; i < headers.length && usedWidth < availWidth; i++) {
      const h = headers[i];
      const w = Math.min(widths[h], availWidth - usedWidth - 1);
      if (w <= 0) break;

      let label = h;
      // Sort indicator
      if (state.sortCol === h) {
        label += state.sortOrder === "asc" ? " \u25B2" : " \u25BC";
      }
      // Filter indicator
      if (state.advancedFilters.some((f) => f.column === h)) {
        label += " \u229B";
      }

      hdr += `{${theme.grid.headerFg}-fg}{bold}${padRight(truncate(label, w - 1), w)}{/}`;
      sep += `{${theme.grid.borderFg}-fg}${H_LINE.repeat(w)}{/}`;

      usedWidth += w;
      if (i < headers.length - 1 && usedWidth < availWidth) {
        hdr += `{${theme.grid.borderFg}-fg}${V_LINE}{/}`;
        sep += `{${theme.grid.borderFg}-fg}${T_DOWN}{/}`;
        usedWidth += 1;
      }
    }

    headerBox.setContent(hdr);
    separatorBox.setContent(sep);
  }

  function renderData() {
    const headers = getVisibleHeaders();
    if (!headers.length || !state.rows.length) {
      if (state.activeTab && state.totalRows === 0 && !state.importing) {
        dataBox.setContent(`\n  {${theme.grid.borderFg}-fg}\u2500\u2500\u2500{/} No data matching current filters. {${theme.grid.borderFg}-fg}\u2500\u2500\u2500{/}`);
      } else if (!state.activeTab) {
        dataBox.setContent("");
      } else {
        dataBox.setContent("");
      }
      return;
    }

    const widths = getColWidths();
    const availWidth = screen.width;
    const visibleRows = dataBox.height;
    const startCol = state.colScroll;
    const lines = [];

    for (let r = 0; r < Math.min(state.rows.length, visibleRows); r++) {
      const row = state.rows[r];
      const absIdx = state.offset + r + 1;
      const isSelected = r === state.selectedRow;

      // ── Gutter: row number + bookmark/tag indicators ──
      let gutterIcon = " ";
      let gutterColor = theme.grid.borderFg;
      if (row._bookmarked) { gutterIcon = "\u2605"; gutterColor = theme.bookmarkFg; }       // ★
      else if (row._tags)  { gutterIcon = "\u25CF"; gutterColor = theme.tagFg; }              // ●

      const rowNumStr = padLeft(String(absIdx), ROW_NUM_WIDTH - 2);
      let gutter;
      if (isSelected) {
        gutter = `{${theme.grid.selectedBg}-bg}{${theme.accent}-fg}{bold}${gutterIcon}${rowNumStr}{/}{${theme.grid.borderFg}-fg}${GUTTER}{/}`;
      } else {
        gutter = `{${gutterColor}-fg}${gutterIcon}{/}{${theme.grid.borderFg}-fg}${rowNumStr}${GUTTER}{/}`;
      }

      // ── Data cells ──
      let cells = "";
      let usedWidth = ROW_NUM_WIDTH + 1;

      // Determine row background
      let rowBg = r % 2 === 1 ? theme.grid.altBg : theme.grid.bg;
      let rowFg = theme.grid.fg;

      // Color rules override
      const colorStyle = getRowColorStyle(row, headers);
      if (colorStyle) {
        if (colorStyle.bg) rowBg = colorStyle.bg;
        if (colorStyle.fg) rowFg = colorStyle.fg;
      }

      // Selected row override
      if (isSelected) {
        rowBg = theme.grid.selectedBg;
        rowFg = theme.grid.selectedFg;
      }

      for (let i = startCol; i < headers.length && usedWidth < availWidth; i++) {
        const h = headers[i];
        const w = Math.min(widths[h], availWidth - usedWidth - 1);
        if (w <= 0) break;

        const val = row[h] != null ? String(row[h]) : "";
        cells += `{${rowBg}-bg}{${rowFg}-fg}${padRight(truncate(val, w - 1), w)}{/}`;
        usedWidth += w;

        // Column separator
        if (i < headers.length - 1 && usedWidth < availWidth) {
          cells += `{${theme.grid.borderFg}-fg}${V_LINE}{/}`;
          usedWidth += 1;
        }
      }

      // Pad remaining width
      const remaining = Math.max(0, availWidth - usedWidth);
      if (remaining > 0) {
        cells += `{${rowBg}-bg}${" ".repeat(remaining)}{/}`;
      }

      lines.push(gutter + cells);
    }

    dataBox.setContent(lines.join("\n"));
  }

  function getRowColorStyle(row, _headers) {
    if (!state.colorRules.length) return null;

    for (const rule of state.colorRules) {
      if (!rule.enabled) continue;
      try {
        const val = row[rule.column];
        if (val == null) continue;
        const strVal = String(val).toLowerCase();
        const ruleVal = String(rule.value).toLowerCase();

        let match = false;
        switch (rule.operator) {
          case "contains": match = strVal.includes(ruleVal); break;
          case "equals": match = strVal === ruleVal; break;
          case "startsWith": match = strVal.startsWith(ruleVal); break;
          case "endsWith": match = strVal.endsWith(ruleVal); break;
          case "regex":
            try { match = new RegExp(rule.value, "i").test(String(val)); } catch {}
            break;
          case "!=": match = strVal !== ruleVal; break;
          default: match = strVal.includes(ruleVal);
        }

        if (match) return { fg: rule.fg, bg: rule.bg };
      } catch {}
    }
    return null;
  }

  function render() {
    renderHeader();
    renderData();
    screen.render();
  }

  // ── Data fetching ──
  let _fetchTimer = null;

  async function fetchRows() {
    if (!state.activeTabId || !db) return;
    try {
      const opts = state.getQueryOptions();
      const result = db.queryRows(state.activeTabId, opts);
      state.setRows(result.rows || [], result.totalFiltered || 0);
    } catch {}
  }

  function debouncedFetch() {
    if (_fetchTimer) clearTimeout(_fetchTimer);
    _fetchTimer = setTimeout(fetchRows, 50);
  }

  // ── Navigation ──
  function moveDown(n = 1) {
    const visibleRows = dataBox.height;
    const maxRow = Math.min(state.rows.length - 1, visibleRows - 1);
    const newRow = state.selectedRow + n;
    if (newRow > maxRow) {
      const maxOffset = Math.max(0, state.totalRows - visibleRows);
      if (state.offset < maxOffset) {
        state.offset = Math.min(state.offset + n, maxOffset);
        debouncedFetch();
      }
    } else {
      state.selectedRow = Math.min(newRow, maxRow);
      render();
    }
  }

  function moveUp(n = 1) {
    const newRow = state.selectedRow - n;
    if (newRow < 0) {
      const newOffset = state.offset - n;
      if (newOffset >= 0) {
        state.offset = newOffset;
        debouncedFetch();
      } else if (state.offset > 0) {
        state.offset = 0;
        state.selectedRow = 0;
        debouncedFetch();
      }
    } else {
      state.selectedRow = newRow;
      render();
    }
  }

  function goFirst() {
    state.offset = 0;
    state.selectedRow = 0;
    debouncedFetch();
  }

  function goLast() {
    const visibleRows = dataBox.height;
    state.offset = Math.max(0, state.totalRows - visibleRows);
    state.selectedRow = Math.min(visibleRows - 1, state.totalRows - 1 - state.offset);
    debouncedFetch();
  }

  function halfPageDown() {
    moveDown(Math.max(1, Math.floor(dataBox.height / 2)));
  }

  function halfPageUp() {
    moveUp(Math.max(1, Math.floor(dataBox.height / 2)));
  }

  function scrollLeft() {
    if (state.colScroll > 0) { state.colScroll--; render(); }
  }

  function scrollRight() {
    const headers = getVisibleHeaders();
    if (state.colScroll < headers.length - 1) { state.colScroll++; render(); }
  }

  function getCurrentRow() {
    return state.rows[state.selectedRow] || null;
  }

  function getCurrentColumn() {
    const headers = getVisibleHeaders();
    return headers[state.colScroll] || headers[0] || null;
  }

  function autoFitColumns() {
    const headers = getVisibleHeaders();
    const widths = {};
    for (const h of headers) {
      widths[h] = Math.max(MIN_COL_WIDTH, h.length + 2);
    }
    const sample = state.rows.slice(0, 100);
    for (const row of sample) {
      for (const h of headers) {
        const val = String(row[h] || "");
        widths[h] = Math.max(widths[h], Math.min(val.length + 2, MAX_COL_WIDTH));
      }
    }
    state.columnWidths = widths;
    render();
  }

  // ── Events ──
  state.on("data-changed", render);
  state.on("tab-changed", () => {
    if (state.activeTab) {
      state.limit = Math.max(50, dataBox.height + 50);
      debouncedFetch();
    } else { render(); }
  });
  state.on("sort-changed", debouncedFetch);
  state.on("filter-changed", debouncedFetch);
  state.on("search-changed", debouncedFetch);
  screen.on("resize", () => {
    if (state.activeTab) {
      state.limit = Math.max(50, dataBox.height + 50);
      debouncedFetch();
    }
  });

  return {
    widget: container, headerBox, dataBox, render, fetchRows,
    moveDown, moveUp, goFirst, goLast, halfPageDown, halfPageUp,
    scrollLeft, scrollRight, getCurrentRow, getCurrentColumn, autoFitColumns,
  };
}

module.exports = { createDataGrid };
