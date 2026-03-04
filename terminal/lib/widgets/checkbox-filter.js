"use strict";

/**
 * checkbox-filter.js — Modal: unique value multi-select for column filtering
 */

function createCheckboxFilter(blessed, screen, state, theme, db) {
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 55,
    height: "70%",
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Filter Values{/} `,
  });

  const hint = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content: ` {${theme.accentAlt}-fg}Space{/}=toggle  {${theme.accentAlt}-fg}a{/}=all  {${theme.accentAlt}-fg}x{/}=none  {${theme.accentAlt}-fg}Enter{/}=apply`,
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

  let columnName = "";
  let values = []; // [{ value, count, checked }]

  function populateList() {
    const items = values.map((v) => {
      const checked = v.checked ? "\u2611" : "\u2610";
      const count = String(v.count).padStart(8);
      return ` ${checked} ${v.value}${count}`;
    });
    list.setItems(items);
    list.select(0);
  }

  function toggleItem() {
    const idx = list.selected;
    if (idx < 0 || idx >= values.length) return;
    values[idx].checked = !values[idx].checked;
    populateList();
    list.select(idx);
    screen.render();
  }

  function selectAll() {
    values.forEach((v) => (v.checked = true));
    populateList();
    screen.render();
  }

  function selectNone() {
    values.forEach((v) => (v.checked = false));
    populateList();
    screen.render();
  }

  function apply() {
    // Build "in" filter from selected values
    const selected = values.filter((v) => v.checked).map((v) => v.value);
    if (selected.length === 0 || selected.length === values.length) {
      // No filter or all selected = clear filter for this column
      state.setFilters(state.advancedFilters.filter((f) => f.column !== columnName));
    } else {
      // Remove existing filter for this column, add new
      const existing = state.advancedFilters.filter((f) => f.column !== columnName);
      existing.push({
        column: columnName,
        operator: "in",
        value: selected,
        logic: "AND",
      });
      state.setFilters(existing);
    }
    hide();
  }

  function show(colName) {
    if (!state.activeTabId || !db) return;
    columnName = colName;
    box.setLabel(` {${theme.modal.titleFg}-fg}{bold}\u25C8 Filter: ${colName}{/} `);

    try {
      const result = db.getColumnUniqueValues(state.activeTabId, colName, state.getQueryOptions({ limit: undefined, offset: undefined }));
      const uniqueVals = result || [];
      values = uniqueVals.map((item) => ({
        value: item.value != null ? String(item.value) : "(empty)",
        count: item.count || 0,
        checked: true,
      }));
    } catch {
      values = [];
    }

    populateList();
    box.show();
    list.focus();
    state.setModal("checkbox-filter");
    screen.render();
  }

  function hide() {
    box.hide();
    state.closeModal();
    screen.render();
  }

  list.key("space", toggleItem);
  list.key("a", selectAll);
  list.key("x", selectNone);
  list.key("enter", apply);
  list.key(["escape"], hide);

  return { widget: box, show, hide };
}

module.exports = { createCheckboxFilter };
