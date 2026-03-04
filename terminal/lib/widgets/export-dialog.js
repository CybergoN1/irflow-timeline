"use strict";

/**
 * export-dialog.js — Modal: export filtered data
 */

const fs = require("fs");
const path = require("path");
const { formatNumber } = require("../utils/format");

function createExportDialog(blessed, screen, state, theme, db) {
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 55,
    height: 13,
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Export Data{/} `,
  });

  blessed.text({
    parent: box, top: 1, left: 2, tags: true,
    content: `Export ${"{bold}"}filtered data${"{/}"} to CSV file:`,
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  const fileInput = blessed.textbox({
    parent: box, top: 3, left: 2, width: "100%-4", height: 1,
    inputOnFocus: true,
    style: { bg: theme.searchBar.inputBg, fg: theme.searchBar.inputFg, focus: { bg: theme.searchBar.inputBg } },
  });

  const statusText = blessed.text({
    parent: box, top: 5, left: 2, width: "100%-4", height: 3, tags: true,
    content: "",
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  blessed.text({
    parent: box, bottom: 1, left: 2, tags: true,
    content: ` {${theme.accentAlt}-fg}Enter{/}=export  {${theme.accentAlt}-fg}Esc{/}=cancel`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  function show() {
    const defaultName = state.activeTab
      ? path.basename(state.activeTab.filePath || "export", path.extname(state.activeTab.filePath || "")) + "_filtered.csv"
      : "export.csv";
    fileInput.setValue(defaultName);
    statusText.setContent(`Rows to export: ${formatNumber(state.totalRows)}`);
    box.show();
    fileInput.focus();
    fileInput.readInput();
    state.setModal("export");
    screen.render();
  }

  function hide() {
    box.hide();
    state.closeModal();
    screen.render();
  }

  fileInput.on("submit", (filePath) => {
    if (!filePath || !state.activeTabId || !db) return;
    filePath = filePath.trim();
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(process.cwd(), filePath);
    }

    statusText.setContent(`{${theme.accent}-fg}Exporting...{/}`);
    screen.render();

    try {
      const opts = state.getQueryOptions({ limit: undefined, offset: undefined });
      const result = db.exportQuery(state.activeTabId, opts);
      const rows = result.rows || [];
      const headers = state.visibleColumns.length ? state.visibleColumns : (state.activeTab?.headers || []);

      // Write CSV
      const csvLines = [headers.join(",")];
      for (const row of rows) {
        const cells = headers.map((h) => {
          const val = row[h] != null ? String(row[h]) : "";
          // Escape CSV: quote if contains comma, newline, or quote
          if (val.includes(",") || val.includes("\n") || val.includes('"')) {
            return '"' + val.replace(/"/g, '""') + '"';
          }
          return val;
        });
        csvLines.push(cells.join(","));
      }

      fs.writeFileSync(filePath, csvLines.join("\n"), "utf8");
      statusText.setContent(`{green-fg}Exported ${formatNumber(rows.length)} rows to:\n${filePath}{/}`);
      screen.render();

      setTimeout(hide, 2000);
    } catch (err) {
      statusText.setContent(`{red-fg}Error: ${err.message}{/}`);
      screen.render();
    }
  });

  fileInput.key("escape", hide);

  return { widget: box, show, hide };
}

module.exports = { createExportDialog };
