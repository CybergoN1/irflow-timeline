"use strict";

/**
 * color-rules.js — Modal: conditional formatting editor
 */

function createColorRules(blessed, screen, state, theme, grid) {
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
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Color Rules{/} `,
  });

  const hint = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content: ` {${theme.accentAlt}-fg}a{/}=add  {${theme.accentAlt}-fg}d{/}=delete  {${theme.accentAlt}-fg}Space{/}=toggle  {${theme.accentAlt}-fg}Enter{/}=done`,
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

  let rules = [];

  const presetColors = [
    { name: "Red", fg: "#ff4444", bg: null },
    { name: "Green", fg: "#44ff44", bg: null },
    { name: "Yellow", fg: "#ffff44", bg: null },
    { name: "Blue", fg: "#4488ff", bg: null },
    { name: "Orange", fg: "#ff8844", bg: null },
    { name: "Cyan", fg: "#44ffff", bg: null },
    { name: "Red BG", fg: "white", bg: "#660000" },
    { name: "Green BG", fg: "white", bg: "#006600" },
    { name: "Yellow BG", fg: "black", bg: "#666600" },
  ];

  function populateList() {
    if (rules.length === 0) {
      list.setItems(["  (no rules — press 'a' to add)"]);
    } else {
      const items = rules.map((r) => {
        const enabled = r.enabled ? "\u2611" : "\u2610";
        const preview = `{${r.fg || "white"}-fg}${r.bg ? `{${r.bg}-bg}` : ""}SAMPLE{/}`;
        return ` ${enabled} ${r.column} ${r.operator} "${r.value}" \u2192 ${preview}`;
      });
      list.setItems(items);
    }
    list.select(Math.min(list.selected || 0, Math.max(0, rules.length - 1)));
  }

  function toggleRule() {
    const idx = list.selected;
    if (idx >= 0 && idx < rules.length) {
      rules[idx].enabled = !rules[idx].enabled;
      state.colorRules = rules.slice();
      populateList();
      screen.render();
    }
  }

  function deleteRule() {
    const idx = list.selected;
    if (idx >= 0 && idx < rules.length) {
      rules.splice(idx, 1);
      state.colorRules = rules.slice();
      populateList();
      screen.render();
    }
  }

  function addRule() {
    const addBox = blessed.form({
      parent: screen,
      top: "center",
      left: "center",
      width: 55,
      height: 15,
      border: { type: "line" },
      tags: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: { fg: theme.accent },
      },
      label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Add Color Rule{/} `,
      keys: true,
    });

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

    blessed.text({ parent: addBox, top: 7, left: 2, content: "Color:", style: { bg: theme.modal.bg, fg: theme.modal.fg } });
    const colorLabel = blessed.text({
      parent: addBox, top: 7, left: 12, width: 30, height: 1, tags: true,
      content: "", style: { bg: theme.modal.bg, fg: theme.modal.fg },
    });

    const ops = ["contains", "equals", "startsWith", "endsWith", "regex", "!="];
    let opIdx = 0;
    let colorIdx = 0;

    function updateColorPreview() {
      const c = presetColors[colorIdx];
      colorLabel.setContent(`{${c.fg}-fg}${c.bg ? `{${c.bg}-bg}` : ""}\u2588\u2588 ${c.name}{/}`);
      screen.render();
    }
    updateColorPreview();

    blessed.text({
      parent: addBox, top: 9, left: 2, width: "100%-4", height: 2, tags: true,
      content: ` {${theme.accentAlt}-fg}Tab{/}=next  {${theme.accentAlt}-fg}o{/}=op  {${theme.accentAlt}-fg}p{/}=color  {${theme.accentAlt}-fg}Enter{/}=save  {${theme.accentAlt}-fg}Esc{/}=cancel`,
      style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
    });

    colInput.focus();
    colInput.readInput();

    function closeAdd() {
      addBox.destroy();
      list.focus();
      screen.render();
    }

    colInput.on("submit", () => { valInput.focus(); valInput.readInput(); });
    colInput.key("escape", closeAdd);
    valInput.key("escape", closeAdd);

    valInput.on("submit", () => {
      const col = colInput.getValue().trim();
      const val = valInput.getValue().trim();
      if (col && val) {
        const c = presetColors[colorIdx];
        rules.push({
          column: col, operator: ops[opIdx], value: val,
          fg: c.fg, bg: c.bg, enabled: true,
        });
        state.colorRules = rules.slice();
        populateList();
      }
      closeAdd();
    });

    addBox.key("o", () => { opIdx = (opIdx + 1) % ops.length; opLabel.setContent(`{bold}${ops[opIdx]}{/}`); screen.render(); });
    addBox.key("p", () => { colorIdx = (colorIdx + 1) % presetColors.length; updateColorPreview(); });
    screen.render();
  }

  function show() {
    rules = state.colorRules.slice();
    populateList();
    box.show();
    list.focus();
    state.setModal("color-rules");
    screen.render();
  }

  function hide() {
    box.hide();
    state.closeModal();
    if (grid) grid.render();
    screen.render();
  }

  list.key("a", addRule);
  list.key("d", deleteRule);
  list.key("space", toggleRule);
  list.key("enter", hide);
  list.key(["escape", "r"], hide);

  return { widget: box, show, hide };
}

module.exports = { createColorRules };
