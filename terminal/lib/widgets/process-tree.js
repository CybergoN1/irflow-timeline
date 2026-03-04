"use strict";

/**
 * process-tree.js — Cyberpunk styled process tree with severity badges
 * and Unicode tree-drawing characters
 *
 *  ├─ explorer.exe
 *  │  ├─ chrome.exe
 *  │  └─ winword.exe
 *  │     └─ ⬤ cmd.exe  [T1204.002] Word → cmd — macro execution
 *  │        └─ ⬤ powershell.exe -enc ...
 */

function createProcessTree(blessed, screen, state, theme, db) {
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
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Process Tree{/} `,
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

  // Severity legend
  const hint = blessed.text({
    parent: box,
    bottom: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content:
      ` {${theme.accentAlt}-fg}Enter{/}=filter ` +
      ` {${theme.severity[3]}-fg}\u2B24{/}Crit` +
      ` {${theme.severity[2]}-fg}\u2B24{/}Med` +
      ` {${theme.severity[1]}-fg}\u2B24{/}Low` +
      ` {${theme.severity[0]}-fg}\u2B24{/}Info` +
      `  {${theme.accentAlt}-fg}Esc{/}=close`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  let treeData = [];

  function show() {
    if (!state.activeTabId || !db) return;

    try {
      const opts = state.getQueryOptions({ limit: undefined, offset: undefined });
      const result = db.getProcessTree(state.activeTabId, opts);
      treeData = Array.isArray(result) ? result : (result?.processes || []);
    } catch {
      treeData = [];
    }

    if (treeData.length === 0) {
      list.setItems([
        `  {${theme.modal.dimFg}-fg}No process tree data available.{/}`,
        `  {${theme.modal.dimFg}-fg}(Requires parent/child process columns){/}`,
      ]);
    } else {
      const items = treeData.map((node, i) => {
        const depth = node.depth || 0;
        const isLast = (i + 1 >= treeData.length) || ((treeData[i + 1]?.depth || 0) <= depth);

        // Build tree prefix
        let prefix = "";
        for (let d = 0; d < depth; d++) {
          if (d === depth - 1) {
            prefix += isLast ? " \u2514\u2500 " : " \u251C\u2500 ";  // └─  or ├─
          } else {
            prefix += " \u2502  ";  // │
          }
        }

        const name = node.process || node.name || "(unknown)";
        const count = node.count ? ` (${node.count})` : "";

        // Severity badge
        let badge = "";
        let nameColor = theme.modal.fg;
        if (node.severity === 3) {
          badge = `{${theme.severity[3]}-fg}\u2B24{/} `;  // ⬤
          nameColor = theme.severity[3];
        } else if (node.severity === 2) {
          badge = `{${theme.severity[2]}-fg}\u2B24{/} `;
          nameColor = theme.severity[2];
        } else if (node.severity === 1) {
          badge = `{${theme.severity[1]}-fg}\u25CF{/} `;  // ●
          nameColor = theme.severity[1];
        }

        let line = `{${theme.modal.dimFg}-fg}${prefix}{/}${badge}{${nameColor}-fg}{bold}${name}{/}{${theme.modal.dimFg}-fg}${count}{/}`;

        // Detection reason
        if (node.reason) {
          line += `  {${theme.modal.dimFg}-fg}// ${node.reason}{/}`;
        }

        return line;
      });
      list.setItems(items);
    }

    list.select(0);
    box.show();
    list.focus();
    state.setPanel("process-tree");
    screen.render();
  }

  function hide() { box.hide(); state.setPanel(null); screen.render(); }

  list.key("enter", () => {
    const idx = list.selected;
    if (idx >= 0 && idx < treeData.length) {
      const node = treeData[idx];
      if (node.process || node.name) {
        const processCol = state.activeTab?.headers.find((h) => /process|image|executable/i.test(h));
        if (processCol) {
          state.addFilter({ column: processCol, operator: "contains", value: node.process || node.name, logic: "AND" });
          hide();
        }
      }
    }
  });

  list.key(["escape", "P"], hide);

  return { widget: box, show, hide };
}

module.exports = { createProcessTree };
