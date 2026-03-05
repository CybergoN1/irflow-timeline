"use strict";

/**
 * filter-bar.js — Colored indicator bar shown when filters are active
 *
 *  ⊛ FILTERED: EventID in [4624,4625] │ Source startsWith "Sec..."  ──  Ctrl+A clear all
 */

const FILTER = "\u229B"; // ⊛
const SEP    = " \u2502 "; // │

function createFilterBar(blessed, screen, state, theme, gridWidget) {
  const bar = blessed.box({
    parent: screen,
    top: 2,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    hidden: true,
    style: { bg: theme.statusBar.segmentBg, fg: theme.statusBar.warnFg },
  });

  function formatFilter(f) {
    const col = f.column || "?";
    const op = f.operator || "contains";
    let val = Array.isArray(f.value)
      ? `[${f.value.slice(0, 3).join(",")}${f.value.length > 3 ? ",..." : ""}]`
      : String(f.value || "");
    if (val.length > 20) val = val.slice(0, 18) + "..";
    return `${col} ${op} "${val}"`;
  }

  function update() {
    const hasFilters = state.advancedFilters.length > 0;
    const hasBookmark = state.bookmarkedOnly;
    const hasTag = !!state.tagFilter;
    const active = hasFilters || hasBookmark || hasTag;

    if (!active) {
      if (!bar.hidden) {
        bar.hide();
        gridWidget.top = 2;
        gridWidget.height = "100%-4";
        screen.render();
      }
      return;
    }

    // Show bar and shift grid down
    if (bar.hidden) {
      bar.show();
      gridWidget.top = 3;
      gridWidget.height = "100%-5";
    }

    const parts = [];

    if (hasFilters) {
      const summaries = state.advancedFilters.slice(0, 4).map(formatFilter);
      if (state.advancedFilters.length > 4) {
        summaries.push(`+${state.advancedFilters.length - 4} more`);
      }
      parts.push(summaries.join(SEP));
    }
    if (hasBookmark) parts.push("\u2605 Bookmarked");
    if (hasTag) parts.push(`\u25CF ${state.tagFilter}`);

    const count = state.advancedFilters.length + (hasBookmark ? 1 : 0) + (hasTag ? 1 : 0);
    const label = `{${theme.statusBar.warnFg}-fg}{bold} ${FILTER} ${count} FILTER${count > 1 ? "S" : ""}{/}`;
    const detail = `{${theme.statusBar.fg}-fg} ${parts.join(SEP)}{/}`;
    const hint = `{${theme.accent}-fg} Ctrl+A{/}{${theme.statusBar.fg}-fg}=clear tab{/}` +
      `{${theme.accent}-fg} Ctrl+X{/}{${theme.statusBar.fg}-fg}=clear all{/}`;

    bar.setContent(`${label}${detail}  ${hint}`);
    screen.render();
  }

  state.on("filter-changed", update);
  state.on("tab-changed", update);

  return { widget: bar, update };
}

module.exports = { createFilterBar };
