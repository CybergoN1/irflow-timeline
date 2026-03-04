"use strict";

/**
 * keybindings.js — Keyboard shortcut registry and dispatcher
 *
 * Central place for all keybinding definitions. The app registers
 * handlers for each action, and this module dispatches key events.
 */

const KEYMAP = {
  // ── Navigation ──
  "j":           "row-down",
  "down":        "row-down",
  "k":           "row-up",
  "up":          "row-up",
  "C-d":         "half-page-down",
  "pagedown":    "half-page-down",
  "C-u":         "half-page-up",
  "pageup":      "half-page-up",
  "g":           "first-row",
  "home":        "first-row",
  "G":           "last-row",
  "end":         "last-row",
  "h":           "scroll-left",
  "left":        "scroll-left",
  "l":           "scroll-right",
  "right":       "scroll-right",

  // ── Tab switching ──
  "tab":         "next-tab",
  "S-tab":       "prev-tab",
  "1":           "tab-1",
  "2":           "tab-2",
  "3":           "tab-3",
  "4":           "tab-4",
  "5":           "tab-5",
  "6":           "tab-6",
  "7":           "tab-7",
  "8":           "tab-8",
  "9":           "tab-9",

  // ── Search ──
  "/":           "focus-search",
  "C-f":         "focus-search",
  "n":           "search-next",
  "N":           "search-prev",

  // ── Row actions ──
  "enter":       "toggle-detail",
  "b":           "toggle-bookmark",
  "t":           "add-tag",
  "T":           "remove-tag",
  "space":       "toggle-select",
  "v":           "visual-select",
  "y":           "copy-row",
  "Y":           "copy-selection",

  // ── Column operations ──
  "s":           "sort-column",
  "f":           "filter-column",
  "F":           "clear-column-filter",
  "C-a":         "clear-all-filters",

  // ── Panels & tools ──
  "H":           "histogram",
  "S":           "stacking",
  "P":           "process-tree",
  "L":           "lateral-movement",
  "A":           "persistence",
  "C-g":         "gap-analysis",
  "c":           "column-manager",
  "r":           "color-rules",
  "i":           "ioc-matcher",
  "C-e":         "export",
  "C-r":         "generate-report",
  "C-s":         "save-session",
  "C-o":         "open-file",
  "C-t":         "cycle-theme",
  "?":           "help",

  // ── Quit ──
  "Q":           "quit",
  "C-q":         "quit",
  "C-c":         "quit",

  // ── Modal dismiss ──
  "escape":      "escape",
};

class KeybindingManager {
  constructor() {
    this.handlers = new Map(); // action -> [handler, ...]
  }

  on(action, handler) {
    if (!this.handlers.has(action)) this.handlers.set(action, []);
    this.handlers.get(action).push(handler);
  }

  off(action, handler) {
    const list = this.handlers.get(action);
    if (!list) return;
    const idx = list.indexOf(handler);
    if (idx >= 0) list.splice(idx, 1);
  }

  dispatch(key, state) {
    // If a modal is open, only allow escape, modal navigation, and quit
    if (state.activeModal) {
      if (key === "escape") {
        this._fire("escape");
        return true;
      }
      // Let modal handle its own keys
      return false;
    }

    // If search bar is focused, don't dispatch grid keys
    if (state.searchBarFocused) {
      if (key === "escape") {
        this._fire("escape");
        return true;
      }
      return false;
    }

    const action = KEYMAP[key];
    if (action) {
      this._fire(action);
      return true;
    }
    return false;
  }

  _fire(action) {
    const list = this.handlers.get(action);
    if (list) {
      for (const h of list) h();
    }
  }
}

module.exports = { KeybindingManager, KEYMAP };
