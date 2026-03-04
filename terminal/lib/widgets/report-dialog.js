"use strict";

/**
 * report-dialog.js — Modal: HTML report generation
 */

const fs = require("fs");
const path = require("path");

function createReportDialog(blessed, screen, state, theme, db) {
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 55,
    height: 11,
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Generate Report{/} `,
  });

  blessed.text({
    parent: box, top: 1, left: 2, tags: true,
    content: "Save HTML report to:",
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  const fileInput = blessed.textbox({
    parent: box, top: 3, left: 2, width: "100%-4", height: 1,
    inputOnFocus: true,
    style: { bg: theme.searchBar.inputBg, fg: theme.searchBar.inputFg, focus: { bg: theme.searchBar.inputBg } },
  });

  const statusText = blessed.text({
    parent: box, top: 5, left: 2, width: "100%-4", height: 2, tags: true,
    content: "",
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  blessed.text({
    parent: box, bottom: 0, left: 2, tags: true,
    content: ` {${theme.accentAlt}-fg}Enter{/}=generate  {${theme.accentAlt}-fg}Esc{/}=cancel`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  function show() {
    const defaultName = state.activeTab
      ? path.basename(state.activeTab.filePath || "report", path.extname(state.activeTab.filePath || "")) + "_report.html"
      : "report.html";
    fileInput.setValue(defaultName);
    statusText.setContent("");
    box.show();
    fileInput.focus();
    fileInput.readInput();
    state.setModal("report");
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

    statusText.setContent(`{${theme.accent}-fg}Generating report...{/}`);
    screen.render();

    try {
      const opts = state.getQueryOptions({ limit: 10000, offset: 0 });
      const result = db.exportQuery(state.activeTabId, opts) || db.queryRows(state.activeTabId, opts);
      const reportData = {
        rows: result?.rows || [],
        headers: state.visibleColumns.length ? state.visibleColumns : (state.activeTab?.headers || []),
      };
      const html = buildReportHTML(reportData, state);
      fs.writeFileSync(filePath, html, "utf8");
      statusText.setContent(`{green-fg}Report saved to:\n${filePath}{/}`);
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

function buildReportHTML(data, state) {
  const rows = data?.rows || [];
  const headers = state.visibleColumns.length ? state.visibleColumns : (data?.headers || []);
  const tab = state.activeTab;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>IRFlow Timeline Report</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2em; background: #1a1a2e; color: #e0e0e0; }
  h1 { color: #e85d2a; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th { background: #2a2a4a; color: #e85d2a; padding: 6px 8px; text-align: left; }
  td { padding: 4px 8px; border-bottom: 1px solid #333; }
  tr:nth-child(even) { background: #0f1114; }
  .meta { color: #888; margin-bottom: 1em; }
</style></head><body>
<h1>IRFlow Timeline Report</h1>
<p class="meta">File: ${tab?.filePath || "N/A"} | Rows: ${rows.length} | Generated: ${new Date().toISOString()}</p>
<table><thead><tr>${headers.map((h) => `<th>${escHTML(h)}</th>`).join("")}</tr></thead>
<tbody>${rows.slice(0, 10000).map((row) => `<tr>${headers.map((h) => `<td>${escHTML(String(row[h] ?? ""))}</td>`).join("")}</tr>`).join("\n")}</tbody></table>
</body></html>`;
}

function escHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

module.exports = { createReportDialog };
