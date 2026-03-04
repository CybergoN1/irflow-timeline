"use strict";

/**
 * tab-bar.js — Cyberpunk styled tab selector with powerline separators
 *
 * ◗ 1:timeline.csv ◗ 2:events.evtx ◗
 */

const path = require("path");

// Powerline / separator glyphs
const SEP_RIGHT = "\u25E5"; // ◥
const BULLET    = "\u2022"; // •
const DIAMOND   = "\u25C6"; // ◆

function createTabBar(blessed, screen, state, theme) {
  const box = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    style: { bg: theme.tabBar.bg, fg: theme.tabBar.fg },
  });

  function render() {
    const t = theme;
    if (state.tabs.length === 0) {
      box.setContent(
        `{${t.splash.logoPrimary}-fg}{bold} \u25C8 IRFlow Timeline{/}` +
        `{${t.tabBar.inactiveFg}-fg}  \u2500\u2500 Press {/}` +
        `{${t.splash.keyFg}-fg}Ctrl+O{/}` +
        `{${t.tabBar.inactiveFg}-fg} to open a file \u2500\u2500{/}`
      );
      screen.render();
      return;
    }

    let content = "";
    state.tabs.forEach((tab, i) => {
      const name = path.basename(tab.filePath || tab.name || `Tab ${i + 1}`);
      const num = i + 1;
      const rows = tab.rowCount ? ` ${shortNum(tab.rowCount)}` : "";
      if (i === state.activeTabIndex) {
        content += `{${t.tabBar.activeBg}-bg}{${t.tabBar.activeFg}-fg}{bold} ${DIAMOND} ${num}:${name}${rows} {/}`;
      } else {
        content += `{${t.tabBar.separator}-fg} ${BULLET} {/}{${t.tabBar.inactiveFg}-fg}${num}:${name}${rows}{/}`;
      }
    });

    // Right-aligned info
    const tabCount = `{${t.tabBar.inactiveFg}-fg}  \u2502 ${state.tabs.length} tab${state.tabs.length > 1 ? "s" : ""}{/}`;
    content += tabCount;

    box.setContent(content);
    screen.render();
  }

  function shortNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(0) + "K";
    return String(n);
  }

  state.on("tabs-updated", render);
  state.on("tab-changed", render);
  state.on("theme-changed", () => {
    box.style.bg = theme.tabBar.bg;
    box.style.fg = theme.tabBar.fg;
    render();
  });

  render();
  return { widget: box, render };
}

module.exports = { createTabBar };
