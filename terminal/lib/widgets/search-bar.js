"use strict";

/**
 * search-bar.js — Cyberpunk search input with mode pill and magnifying glass
 *
 *  🔍 /and: ▎search term here...
 */

function createSearchBar(blessed, screen, state, theme, onSearch) {
  const container = blessed.box({
    parent: screen,
    top: 1,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    style: { bg: theme.searchBar.bg, fg: theme.searchBar.fg },
  });

  // Mode indicator
  const modeLabel = blessed.text({
    parent: container,
    left: 0,
    top: 0,
    width: 16,
    height: 1,
    tags: true,
    content: "",
    style: { bg: theme.searchBar.bg, fg: theme.searchBar.modeFg },
  });

  // Text input
  const input = blessed.textbox({
    parent: container,
    left: 16,
    top: 0,
    width: "100%-16",
    height: 1,
    inputOnFocus: true,
    style: {
      bg: theme.searchBar.inputBg,
      fg: theme.searchBar.inputFg,
      focus: { bg: theme.searchBar.inputBg, fg: theme.searchBar.inputFg },
    },
  });

  const modes = ["and", "or", "exact", "regex", "fuzzy"];
  const modeIcons = {
    and:   "\u2227",   // ∧
    or:    "\u2228",   // ∨
    exact: "\u2261",   // ≡
    regex: "\u223C",   // ∼
    fuzzy: "\u2248",   // ≈
  };
  let modeIndex = 0;

  function updateModeLabel() {
    const mode = modes[modeIndex];
    const icon = modeIcons[mode];
    modeLabel.setContent(
      ` {${theme.searchBar.iconFg}-fg}\u2315{/}` +  // ⌕ search icon
      ` {${theme.searchBar.modeFg}-fg}{bold}${icon} /${mode}{/}` +
      `{${theme.searchBar.fg}-fg}:{/} `
    );
    screen.render();
  }

  function focus() {
    state.searchBarFocused = true;
    input.focus();
    input.readInput();
    updateModeLabel();
    screen.render();
  }

  function blur() {
    state.searchBarFocused = false;
    input.cancel();
    screen.render();
  }

  input.key("tab", () => {
    modeIndex = (modeIndex + 1) % modes.length;
    state.searchMode = modes[modeIndex];
    updateModeLabel();
  });

  input.on("submit", (value) => {
    state.searchBarFocused = false;
    const term = (value || "").trim();
    state.setSearch(term, modes[modeIndex], "contains");
    if (onSearch) onSearch(term);
    screen.render();
  });

  input.on("cancel", () => {
    state.searchBarFocused = false;
    screen.render();
  });

  input.key("escape", () => blur());

  function render() {
    updateModeLabel();
    if (state.searchTerm) input.setValue(state.searchTerm);
  }

  state.on("theme-changed", () => {
    container.style.bg = theme.searchBar.bg;
    modeLabel.style.bg = theme.searchBar.bg;
    modeLabel.style.fg = theme.searchBar.modeFg;
    input.style.bg = theme.searchBar.inputBg;
    input.style.fg = theme.searchBar.inputFg;
    render();
  });

  updateModeLabel();

  return { widget: container, input, focus, blur, render };
}

module.exports = { createSearchBar };
