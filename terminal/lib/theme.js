"use strict";

/**
 * theme.js — Terminal color palettes for IRFlow Timeline TUI
 *
 * Themes: cyberpunk (default), matrix, ember, light
 * Cycle with Ctrl+T
 */

const themes = {
  // ── Cyberpunk: neon purple + electric green + hot pink ──
  cyberpunk: {
    name: "cyberpunk",
    label: "Cyberpunk",
    bg: "black",
    fg: "#c0c0c0",
    tabBar: {
      bg: "#0d0d1a",
      fg: "#c0c0c0",
      activeBg: "#7b2fff",
      activeFg: "#ffffff",
      inactiveBg: "#0d0d1a",
      inactiveFg: "#555577",
      separator: "#2a1a4a",
    },
    grid: {
      bg: "#08080f",
      fg: "#b8b8cc",
      headerBg: "#0d0d1a",
      headerFg: "#00ff9f",
      selectedBg: "#2a1a5a",
      selectedFg: "#ffffff",
      altBg: "#0c0c18",
      borderFg: "#2a2a44",
      rowNumFg: "#555577",
    },
    statusBar: {
      bg: "#0d0d1a",
      fg: "#8888aa",
      accentFg: "#00ff9f",
      warnFg: "#ff6bff",
      segmentBg: "#14142a",
    },
    searchBar: {
      bg: "#0d0d1a",
      fg: "#c0c0c0",
      modeFg: "#7b2fff",
      inputBg: "#14142a",
      inputFg: "#00ff9f",
      iconFg: "#ff6bff",
    },
    detail: {
      bg: "#0a0a14",
      fg: "#b8b8cc",
      labelFg: "#7b2fff",
      valueFg: "#00ff9f",
      borderFg: "#2a2a44",
    },
    modal: {
      bg: "#0d0d1a",
      fg: "#c0c0c0",
      borderFg: "#7b2fff",
      titleFg: "#00ff9f",
      selectedBg: "#7b2fff",
      selectedFg: "#ffffff",
      dimFg: "#555577",
    },
    bookmarkFg: "#ff6bff",
    tagFg: "#00ccff",
    severity: ["#555577", "#00ff9f", "#ff6bff", "#ff2244"],
    accent: "#7b2fff",
    accentAlt: "#00ff9f",
    border: "#2a2a44",
    progress: {
      barFg: "#00ff9f",
      barBg: "#14142a",
      barDone: "#7b2fff",
      textFg: "#c0c0c0",
      spinnerFg: "#ff6bff",
    },
    splash: {
      logoPrimary: "#7b2fff",
      logoSecondary: "#00ff9f",
      logoTertiary: "#ff6bff",
      textFg: "#555577",
      keyFg: "#00ff9f",
    },
  },

  // ── Matrix: classic green-on-black terminal ──
  matrix: {
    name: "matrix",
    label: "Matrix",
    bg: "black",
    fg: "#33ff33",
    tabBar: {
      bg: "#000800",
      fg: "#33ff33",
      activeBg: "#00aa00",
      activeFg: "#000000",
      inactiveBg: "#000800",
      inactiveFg: "#005500",
      separator: "#003300",
    },
    grid: {
      bg: "#000400",
      fg: "#33ff33",
      headerBg: "#001a00",
      headerFg: "#00ff00",
      selectedBg: "#004400",
      selectedFg: "#00ff00",
      altBg: "#000800",
      borderFg: "#004400",
      rowNumFg: "#006600",
    },
    statusBar: {
      bg: "#001a00",
      fg: "#009900",
      accentFg: "#00ff00",
      warnFg: "#ffff00",
      segmentBg: "#002200",
    },
    searchBar: {
      bg: "#001a00",
      fg: "#33ff33",
      modeFg: "#00ff00",
      inputBg: "#002200",
      inputFg: "#00ff00",
      iconFg: "#88ff88",
    },
    detail: {
      bg: "#000800",
      fg: "#33ff33",
      labelFg: "#00ff00",
      valueFg: "#88ff88",
      borderFg: "#004400",
    },
    modal: {
      bg: "#001a00",
      fg: "#33ff33",
      borderFg: "#00aa00",
      titleFg: "#00ff00",
      selectedBg: "#00aa00",
      selectedFg: "#000000",
      dimFg: "#006600",
    },
    bookmarkFg: "#ffff00",
    tagFg: "#88ff88",
    severity: ["#006600", "#33ff33", "#ffff00", "#ff3333"],
    accent: "#00aa00",
    accentAlt: "#00ff00",
    border: "#004400",
    progress: {
      barFg: "#00ff00",
      barBg: "#002200",
      barDone: "#00aa00",
      textFg: "#33ff33",
      spinnerFg: "#88ff88",
    },
    splash: {
      logoPrimary: "#00ff00",
      logoSecondary: "#00aa00",
      logoTertiary: "#33ff33",
      textFg: "#006600",
      keyFg: "#00ff00",
    },
  },

  // ── Ember: warm amber/orange on dark ──
  ember: {
    name: "ember",
    label: "Ember",
    bg: "#0a0806",
    fg: "#d4b896",
    tabBar: {
      bg: "#1a1008",
      fg: "#d4b896",
      activeBg: "#e85d2a",
      activeFg: "#ffffff",
      inactiveBg: "#1a1008",
      inactiveFg: "#665544",
      separator: "#332211",
    },
    grid: {
      bg: "#0c0a06",
      fg: "#d4b896",
      headerBg: "#1a1008",
      headerFg: "#ffaa44",
      selectedBg: "#3d2211",
      selectedFg: "#ffffff",
      altBg: "#100e08",
      borderFg: "#443322",
      rowNumFg: "#665544",
    },
    statusBar: {
      bg: "#1a1008",
      fg: "#998877",
      accentFg: "#ffaa44",
      warnFg: "#ff4444",
      segmentBg: "#221a0e",
    },
    searchBar: {
      bg: "#1a1008",
      fg: "#d4b896",
      modeFg: "#e85d2a",
      inputBg: "#221a0e",
      inputFg: "#ffaa44",
      iconFg: "#ff6644",
    },
    detail: {
      bg: "#100e08",
      fg: "#d4b896",
      labelFg: "#e85d2a",
      valueFg: "#ffaa44",
      borderFg: "#443322",
    },
    modal: {
      bg: "#1a1008",
      fg: "#d4b896",
      borderFg: "#e85d2a",
      titleFg: "#ffaa44",
      selectedBg: "#e85d2a",
      selectedFg: "#ffffff",
      dimFg: "#665544",
    },
    bookmarkFg: "#ff6644",
    tagFg: "#ffcc66",
    severity: ["#665544", "#ffaa44", "#ff6644", "#ff2222"],
    accent: "#e85d2a",
    accentAlt: "#ffaa44",
    border: "#443322",
    progress: {
      barFg: "#ffaa44",
      barBg: "#221a0e",
      barDone: "#e85d2a",
      textFg: "#d4b896",
      spinnerFg: "#ff6644",
    },
    splash: {
      logoPrimary: "#e85d2a",
      logoSecondary: "#ffaa44",
      logoTertiary: "#ff6644",
      textFg: "#665544",
      keyFg: "#ffaa44",
    },
  },

  // ── Light: clean muted tones ──
  light: {
    name: "light",
    label: "Light",
    bg: "#f0f0f5",
    fg: "#1a1a2e",
    tabBar: {
      bg: "#dddde8",
      fg: "#1a1a2e",
      activeBg: "#6a1bdb",
      activeFg: "#ffffff",
      inactiveBg: "#dddde8",
      inactiveFg: "#777799",
      separator: "#bbbbcc",
    },
    grid: {
      bg: "#f0f0f5",
      fg: "#1a1a2e",
      headerBg: "#dddde8",
      headerFg: "#008866",
      selectedBg: "#d0c8f0",
      selectedFg: "#1a1a2e",
      altBg: "#e8e8f0",
      borderFg: "#bbbbcc",
      rowNumFg: "#777799",
    },
    statusBar: {
      bg: "#dddde8",
      fg: "#444466",
      accentFg: "#008866",
      warnFg: "#aa44aa",
      segmentBg: "#ccccdd",
    },
    searchBar: {
      bg: "#dddde8",
      fg: "#1a1a2e",
      modeFg: "#6a1bdb",
      inputBg: "#f0f0f5",
      inputFg: "#008866",
      iconFg: "#aa44aa",
    },
    detail: { bg: "#e8e8f0", fg: "#1a1a2e", labelFg: "#6a1bdb", valueFg: "#008866", borderFg: "#bbbbcc" },
    modal: { bg: "#e8e8f0", fg: "#1a1a2e", borderFg: "#6a1bdb", titleFg: "#008866", selectedBg: "#6a1bdb", selectedFg: "#ffffff", dimFg: "#777799" },
    bookmarkFg: "#aa44aa",
    tagFg: "#0066aa",
    severity: ["#999999", "#008866", "#aa44aa", "#cc0033"],
    accent: "#6a1bdb",
    accentAlt: "#008866",
    border: "#bbbbcc",
    progress: { barFg: "#008866", barBg: "#ccccdd", barDone: "#6a1bdb", textFg: "#1a1a2e", spinnerFg: "#aa44aa" },
    splash: { logoPrimary: "#6a1bdb", logoSecondary: "#008866", logoTertiary: "#aa44aa", textFg: "#777799", keyFg: "#008866" },
  },
};

// Keep "dark" as alias for "cyberpunk" for backwards compat
themes.dark = themes.cyberpunk;

// Theme cycle order
const THEME_ORDER = ["cyberpunk", "matrix", "ember", "light"];

function getTheme(name) {
  return themes[name] || themes.cyberpunk;
}

function getNextTheme(currentName) {
  const idx = THEME_ORDER.indexOf(currentName);
  const nextIdx = (idx + 1) % THEME_ORDER.length;
  return THEME_ORDER[nextIdx];
}

module.exports = { themes, getTheme, getNextTheme, THEME_ORDER };
