"use strict";

/**
 * column-manager.js — Modal: show/hide/reorder columns
 */

function createColumnManager(blessed, screen, state, theme, grid) {
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 50,
    height: "70%",
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Column Manager{/} `,
  });

  const hint = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content: ` {${theme.accentAlt}-fg}Space{/}=toggle  {${theme.accentAlt}-fg}Ctrl+\u2191/\u2193{/}=reorder  {${theme.accentAlt}-fg}Enter{/}=done`,
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

  let allColumns = [];
  let visibleSet = new Set();

  function populateList() {
    if (!state.activeTab) return;
    allColumns = state.activeTab.headers.slice();
    visibleSet = new Set(state.visibleColumns);

    const items = allColumns.map((col) => {
      const checked = visibleSet.has(col) ? "\u2611" : "\u2610"; // ☑ ☐
      return ` ${checked} ${col}`;
    });
    list.setItems(items);
    list.select(0);
  }

  function toggleColumn() {
    const idx = list.selected;
    if (idx < 0 || idx >= allColumns.length) return;
    const col = allColumns[idx];

    if (visibleSet.has(col)) {
      visibleSet.delete(col);
    } else {
      visibleSet.add(col);
    }

    // Rebuild visible columns maintaining order
    state.visibleColumns = allColumns.filter((c) => visibleSet.has(c));

    // Update display
    const items = allColumns.map((c) => {
      const checked = visibleSet.has(c) ? "\u2611" : "\u2610";
      return ` ${checked} ${c}`;
    });
    list.setItems(items);
    list.select(idx);
    screen.render();
  }

  function moveUp() {
    const idx = list.selected;
    if (idx <= 0) return;
    [allColumns[idx], allColumns[idx - 1]] = [allColumns[idx - 1], allColumns[idx]];
    state.visibleColumns = allColumns.filter((c) => visibleSet.has(c));
    populateList();
    list.select(idx - 1);
    screen.render();
  }

  function moveDown() {
    const idx = list.selected;
    if (idx >= allColumns.length - 1) return;
    [allColumns[idx], allColumns[idx + 1]] = [allColumns[idx + 1], allColumns[idx]];
    state.visibleColumns = allColumns.filter((c) => visibleSet.has(c));
    populateList();
    list.select(idx + 1);
    screen.render();
  }

  function show() {
    populateList();
    box.show();
    list.focus();
    state.setModal("column-manager");
    screen.render();
  }

  function hide() {
    box.hide();
    state.closeModal();
    if (grid) grid.render();
    screen.render();
  }

  list.key("space", toggleColumn);
  list.key("enter", hide);
  list.key(["escape", "c"], hide);
  list.key("C-up", moveUp);
  list.key("C-down", moveDown);

  return { widget: box, show, hide };
}

module.exports = { createColumnManager };
