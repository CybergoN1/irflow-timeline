"use strict";

/**
 * filter-modal.js — Modal: advanced AND/OR filter builder
 */

function createFilterModal(blessed, screen, state, theme) {
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
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Advanced Filters{/} `,
  });

  const hint = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-2",
    height: 2,
    tags: true,
    content: ` {${theme.accentAlt}-fg}a{/}=add  {${theme.accentAlt}-fg}d{/}=delete  {${theme.accentAlt}-fg}Enter{/}=apply  {${theme.accentAlt}-fg}x{/}=clear all`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  const list = blessed.list({
    parent: box,
    top: 3,
    left: 1,
    width: "100%-2",
    height: "100%-4",
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

  let filters = []; // working copy

  function populateList() {
    if (filters.length === 0) {
      list.setItems(["  (no filters — press 'a' to add)"]);
    } else {
      const items = filters.map((f, i) => {
        const logic = i === 0 ? "   " : ` ${f.logic} `;
        return `${logic}${f.column} ${f.operator} "${f.value}"`;
      });
      list.setItems(items);
    }
    list.select(Math.min(list.selected || 0, Math.max(0, filters.length - 1)));
  }

  function addFilter() {
    // Show inline prompt for new filter
    const addBox = blessed.form({
      parent: screen,
      top: "center",
      left: "center",
      width: 55,
      height: 13,
      border: { type: "line" },
      tags: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: { fg: theme.accent },
      },
      label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Add Filter{/} `,
      keys: true,
    });

    const headers = state.activeTab ? state.activeTab.headers : [];

    blessed.text({ parent: addBox, top: 1, left: 2, content: "Column:", style: { bg: theme.modal.bg, fg: theme.modal.fg } });
    const colInput = blessed.textbox({
      parent: addBox, top: 1, left: 12, width: 30, height: 1,
      inputOnFocus: true, style: { bg: theme.searchBar.inputBg, fg: theme.searchBar.inputFg, focus: { bg: theme.searchBar.inputBg } },
    });

    blessed.text({ parent: addBox, top: 3, left: 2, content: "Operator:", style: { bg: theme.modal.bg, fg: theme.modal.fg } });
    const opLabel = blessed.text({
      parent: addBox, top: 3, left: 12, width: 20, height: 1, tags: true,
      content: "{bold}contains{/}", style: { bg: theme.modal.bg, fg: theme.accent },
    });

    blessed.text({ parent: addBox, top: 5, left: 2, content: "Value:", style: { bg: theme.modal.bg, fg: theme.modal.fg } });
    const valInput = blessed.textbox({
      parent: addBox, top: 5, left: 12, width: 30, height: 1,
      inputOnFocus: true, style: { bg: theme.searchBar.inputBg, fg: theme.searchBar.inputFg, focus: { bg: theme.searchBar.inputBg } },
    });

    blessed.text({ parent: addBox, top: 7, left: 2, content: "Logic:", style: { bg: theme.modal.bg, fg: theme.modal.fg } });
    const logicLabel = blessed.text({
      parent: addBox, top: 7, left: 12, width: 10, height: 1, tags: true,
      content: "{bold}AND{/}", style: { bg: theme.modal.bg, fg: theme.accent },
    });

    const ops = ["contains", "==", "!=", "<", ">", "<=", ">=", "startsWith", "endsWith", "regex"];
    let opIdx = 0;
    let logicVal = "AND";

    blessed.text({
      parent: addBox, top: 9, left: 2, width: "100%-4", height: 1, tags: true,
      content: ` {${theme.accentAlt}-fg}Tab{/}=next  {${theme.accentAlt}-fg}o{/}=cycle op  {${theme.accentAlt}-fg}g{/}=toggle logic  {${theme.accentAlt}-fg}Enter{/}=save  {${theme.accentAlt}-fg}Esc{/}=cancel`,
      style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
    });

    // Focus the column input first
    colInput.focus();
    colInput.readInput();

    function closeAdd() {
      addBox.destroy();
      list.focus();
      screen.render();
    }

    colInput.on("submit", () => {
      valInput.focus();
      valInput.readInput();
    });

    colInput.key("escape", closeAdd);
    valInput.key("escape", closeAdd);

    valInput.on("submit", () => {
      const col = colInput.getValue().trim();
      const val = valInput.getValue().trim();
      if (col && val) {
        filters.push({ column: col, operator: ops[opIdx], value: val, logic: logicVal });
        populateList();
      }
      closeAdd();
    });

    addBox.key("o", () => {
      opIdx = (opIdx + 1) % ops.length;
      opLabel.setContent(`{bold}${ops[opIdx]}{/}`);
      screen.render();
    });

    addBox.key("g", () => {
      logicVal = logicVal === "AND" ? "OR" : "AND";
      logicLabel.setContent(`{bold}${logicVal}{/}`);
      screen.render();
    });

    screen.render();
  }

  function deleteFilter() {
    const idx = list.selected;
    if (idx >= 0 && idx < filters.length) {
      filters.splice(idx, 1);
      populateList();
      screen.render();
    }
  }

  function applyFilters() {
    state.setFilters(filters.slice());
    hide();
  }

  function clearAll() {
    filters = [];
    populateList();
    screen.render();
  }

  function show() {
    filters = state.advancedFilters.slice();
    populateList();
    box.show();
    list.focus();
    state.setModal("filter");
    screen.render();
  }

  function hide() {
    box.hide();
    state.closeModal();
    screen.render();
  }

  list.key("a", addFilter);
  list.key("d", deleteFilter);
  list.key("enter", applyFilters);
  list.key("x", clearAll);
  list.key(["escape"], hide);

  return { widget: box, show, hide };
}

module.exports = { createFilterModal };
