"use strict";

/**
 * ioc-matcher.js — Modal: IOC file load + bulk match
 */

const fs = require("fs");
const path = require("path");
const { formatNumber } = require("../utils/format");

function createIocMatcher(blessed, screen, state, theme, db) {
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 65,
    height: "70%",
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 IOC Matcher{/} `,
  });

  const hint = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-2",
    height: 2,
    tags: true,
    content: ` Enter path to IOC file (one pattern per line):\n Supports: IP, domain, hash, regex patterns`,
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  const fileInput = blessed.textbox({
    parent: box,
    top: 3,
    left: 2,
    width: "100%-4",
    height: 1,
    inputOnFocus: true,
    style: {
      bg: theme.searchBar.inputBg,
      fg: theme.searchBar.inputFg,
      focus: { bg: theme.searchBar.inputBg },
    },
  });

  const resultList = blessed.list({
    parent: box,
    top: 5,
    left: 1,
    width: "100%-2",
    height: "100%-7",
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

  const statusBar = blessed.text({
    parent: box,
    bottom: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content: "",
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  function show() {
    resultList.setItems(["  Load an IOC file to begin matching"]);
    statusBar.setContent(` {${theme.accentAlt}-fg}Enter{/}{${theme.modal.dimFg}-fg}=load file  {/}{${theme.accentAlt}-fg}Esc{/}{${theme.modal.dimFg}-fg}=close{/}`);
    box.show();
    fileInput.focus();
    fileInput.readInput();
    state.setModal("ioc-matcher");
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

    // Resolve relative paths
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(process.cwd(), filePath);
    }

    try {
      if (!fs.existsSync(filePath)) {
        resultList.setItems([`  File not found: ${filePath}`]);
        screen.render();
        return;
      }

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

      // Parse IOC patterns
      const patterns = lines.map((line) => {
        // Defang: hxxp -> http, [.] -> .
        let cleaned = line.replace(/hxxp/gi, "http").replace(/\[\.\]/g, ".");
        return { original: line, pattern: cleaned };
      });

      statusBar.setContent(` Matching ${patterns.length} IOCs...`);
      screen.render();

      // Run matching — returns { matchedRowIds, perIocCounts, perRowIocs }
      const results = db.matchIocs(state.activeTabId, patterns.map((p) => p.pattern), 10000);
      const perIocCounts = results?.perIocCounts || {};
      const matchResults = Object.entries(perIocCounts)
        .map(([pattern, count]) => ({ pattern, count }))
        .filter((m) => m.count > 0);

      if (matchResults.length === 0) {
        resultList.setItems(["  No matches found"]);
      } else {
        const items = matchResults.map((m) => {
          const ioc = String(m.pattern || "").padEnd(30);
          const count = formatNumber(m.count || 0).padStart(8);
          return ` {${theme.severity[3]}-fg}${ioc}{/} ${count} matches`;
        });
        resultList.setItems(items);
      }

      statusBar.setContent(` ${patterns.length} IOCs \u2192 ${matchResults.length} hits  {${theme.accentAlt}-fg}Esc{/}{${theme.modal.dimFg}-fg}=close{/}`);
      resultList.focus();
      screen.render();
    } catch (err) {
      resultList.setItems([`  Error: ${err.message}`]);
      screen.render();
    }
  });

  fileInput.key("escape", hide);
  resultList.key(["escape"], hide);

  return { widget: box, show, hide };
}

module.exports = { createIocMatcher };
