"use strict";

/**
 * app.js — Main application: blessed screen, layout, lifecycle
 *
 * Creates the blessed screen, initializes all widgets, wires up
 * keybindings, and manages the file import lifecycle.
 */

const blessed = require("neo-blessed");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const AppState = require("./state");
const { getTheme } = require("./theme");
const { KeybindingManager } = require("./keybindings");
const { getNextTheme } = require("./theme");
const TimelineDB = require("./backend/db");
const { parseFile } = require("./backend/parser");

// Widgets
const { createTabBar } = require("./widgets/tab-bar");
const { createStatusBar } = require("./widgets/status-bar");
const { createSearchBar } = require("./widgets/search-bar");
const { createDataGrid } = require("./widgets/data-grid");
const { createImportProgress } = require("./widgets/import-progress");
const { createDetailPanel } = require("./widgets/detail-panel");
const { createHelpOverlay } = require("./widgets/help-overlay");
const { createColumnManager } = require("./widgets/column-manager");
const { createCheckboxFilter } = require("./widgets/checkbox-filter");
const { createFilterModal } = require("./widgets/filter-modal");
const { createColorRules } = require("./widgets/color-rules");
const { createHistogram } = require("./widgets/histogram");
const { createStackingView } = require("./widgets/stacking-view");
const { createProcessTree } = require("./widgets/process-tree");
const { createLateralMovement } = require("./widgets/lateral-movement");
const { createPersistenceView } = require("./widgets/persistence-view");
const { createGapAnalysis } = require("./widgets/gap-analysis");
const { createIocMatcher } = require("./widgets/ioc-matcher");
const { createExportDialog } = require("./widgets/export-dialog");
const { createReportDialog } = require("./widgets/report-dialog");
const { createSessionDialog } = require("./widgets/session-dialog");

function createApp(opts = {}) {
  // ── State & Theme ──
  const state = new AppState();
  const theme = getTheme(opts.theme || "dark");
  state.theme = opts.theme || "dark";

  // ── Database ──
  const db = new TimelineDB();

  // ── Blessed Screen ──
  const screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true,
    title: "IRFlow Timeline TUI",
    cursor: { artificial: true, shape: "line", blink: true, color: theme.accent },
    style: { bg: theme.bg, fg: theme.fg },
  });

  // ── Splash Screen (shown when no files loaded) ──
  const splash = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    tags: true,
    style: { bg: theme.bg, fg: theme.fg },
  });

  const logoArt = [
    `{${theme.splash.logoPrimary}-fg}{bold}`,
    `   ██╗██████╗ ███████╗██╗      ██████╗ ██╗    ██╗`,
    `   ██║██╔══██╗██╔════╝██║     ██╔═══██╗██║    ██║`,
    `   ██║██████╔╝█████╗  ██║     ██║   ██║██║ █╗ ██║`,
    `   ██║██╔══██╗██╔══╝  ██║     ██║   ██║██║███╗██║`,
    `   ██║██║  ██║██║     ███████╗╚██████╔╝╚███╔███╔╝`,
    `   ╚═╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ {/}`,
    ``,
    `   {${theme.splash.logoSecondary}-fg}T I M E L I N E{/}  {${theme.splash.logoTertiary}-fg}━━━━━━━━━━━━━━━━━━━━━{/}`,
    `   {${theme.splash.textFg}-fg}High-Performance DFIR Timeline Analysis{/}`,
    ``,
    `   {${theme.splash.textFg}-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/}`,
    ``,
    `   {${theme.splash.keyFg}-fg}Ctrl+O{/}  {${theme.splash.textFg}-fg}Open a file{/}`,
    `   {${theme.splash.keyFg}-fg}?{/}       {${theme.splash.textFg}-fg}Keyboard shortcuts{/}`,
    `   {${theme.splash.keyFg}-fg}Q{/}       {${theme.splash.textFg}-fg}Quit{/}`,
    ``,
    `   {${theme.splash.textFg}-fg}Supported:{/}  {${theme.splash.logoTertiary}-fg}CSV  TSV  XLSX  XLS  PLASO  EVTX{/}`,
    ``,
    `   {${theme.splash.textFg}-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/}`,
    `   {${theme.splash.textFg}-fg}Pass files as args:{/}  {${theme.splash.keyFg}-fg}irflow-tui timeline.csv events.evtx{/}`,
  ];

  // Center the logo vertically
  const splashContent = blessed.box({
    parent: splash,
    top: "center",
    left: "center",
    width: 56,
    height: logoArt.length + 2,
    tags: true,
    style: { bg: theme.bg, fg: theme.fg },
  });
  splashContent.setContent(logoArt.join("\n"));

  function hideSplash() {
    splash.hide();
    splash.detach();
    screen.render();
  }

  state.on("tabs-updated", () => {
    if (state.tabs.length > 0) hideSplash();
  });

  // ── Widgets ──
  const tabBar = createTabBar(blessed, screen, state, theme);
  const searchBar = createSearchBar(blessed, screen, state, theme, handleSearch);
  const grid = createDataGrid(blessed, screen, state, theme, db);
  const statusBar = createStatusBar(blessed, screen, state, theme);
  const importProgress = createImportProgress(blessed, screen, theme);
  const detailPanel = createDetailPanel(blessed, screen, state, theme);
  const helpOverlay = createHelpOverlay(blessed, screen, state, theme);
  const columnManager = createColumnManager(blessed, screen, state, theme, grid);
  const checkboxFilter = createCheckboxFilter(blessed, screen, state, theme, db);
  const filterModal = createFilterModal(blessed, screen, state, theme);
  const colorRules = createColorRules(blessed, screen, state, theme, grid);
  const histogram = createHistogram(blessed, screen, state, theme, db);
  const stackingView = createStackingView(blessed, screen, state, theme, db);
  const processTree = createProcessTree(blessed, screen, state, theme, db);
  const lateralMovement = createLateralMovement(blessed, screen, state, theme, db);
  const persistenceView = createPersistenceView(blessed, screen, state, theme, db);
  const gapAnalysis = createGapAnalysis(blessed, screen, state, theme, db);
  const iocMatcher = createIocMatcher(blessed, screen, state, theme, db);
  const exportDialog = createExportDialog(blessed, screen, state, theme, db);
  const reportDialog = createReportDialog(blessed, screen, state, theme, db);
  const sessionDialog = createSessionDialog(blessed, screen, state, theme);

  // ── Panel management: hide previous panel when switching ──
  const panels = {
    "histogram": histogram,
    "stacking": stackingView,
    "process-tree": processTree,
    "lateral-movement": lateralMovement,
    "persistence": persistenceView,
    "gap-analysis": gapAnalysis,
  };

  state.on("panel-changed", (newPanel) => {
    // Hide all panels except the newly active one
    for (const [name, panel] of Object.entries(panels)) {
      if (name !== newPanel && panel.widget && !panel.widget.hidden) {
        panel.widget.hide();
      }
    }
    // If no panel active, refocus the grid area
    if (!newPanel) {
      screen.render();
    }
  });

  // ── Keybindings ──
  const keys = new KeybindingManager();

  // Navigation
  keys.on("row-down", () => grid.moveDown());
  keys.on("row-up", () => grid.moveUp());
  keys.on("half-page-down", () => grid.halfPageDown());
  keys.on("half-page-up", () => grid.halfPageUp());
  keys.on("first-row", () => grid.goFirst());
  keys.on("last-row", () => grid.goLast());
  keys.on("scroll-left", () => grid.scrollLeft());
  keys.on("scroll-right", () => grid.scrollRight());

  // Tabs
  keys.on("next-tab", () => {
    if (state.tabs.length > 1) {
      state.switchTab((state.activeTabIndex + 1) % state.tabs.length);
    }
  });
  keys.on("prev-tab", () => {
    if (state.tabs.length > 1) {
      state.switchTab((state.activeTabIndex - 1 + state.tabs.length) % state.tabs.length);
    }
  });
  for (let i = 1; i <= 9; i++) {
    const idx = i - 1;
    keys.on(`tab-${i}`, () => {
      if (idx < state.tabs.length) state.switchTab(idx);
    });
  }

  // Search
  keys.on("focus-search", () => searchBar.focus());
  keys.on("search-next", () => {
    if (state.searchActive && state.totalRows > 0) {
      grid.moveDown();
    }
  });
  keys.on("search-prev", () => {
    if (state.searchActive && state.totalRows > 0) {
      grid.moveUp();
    }
  });

  // Row actions
  keys.on("toggle-detail", () => detailPanel.toggle());
  keys.on("toggle-bookmark", () => handleBookmark());
  keys.on("add-tag", () => handleAddTag());
  keys.on("remove-tag", () => handleRemoveTag());
  keys.on("copy-row", () => handleCopyRow());

  // Column operations
  keys.on("sort-column", () => {
    const col = grid.getCurrentColumn();
    if (col) state.cycleSort(col);
  });
  keys.on("filter-column", () => {
    const col = grid.getCurrentColumn();
    if (col) checkboxFilter.show(col);
  });
  keys.on("clear-column-filter", () => {
    const col = grid.getCurrentColumn();
    if (col) {
      state.setFilters(state.advancedFilters.filter((f) => f.column !== col));
    }
  });
  keys.on("clear-all-filters", () => state.clearFilters());

  // Panels & tools
  keys.on("histogram", () => histogram.show());
  keys.on("stacking", () => stackingView.show());
  keys.on("process-tree", () => processTree.show());
  keys.on("lateral-movement", () => lateralMovement.show());
  keys.on("persistence", () => persistenceView.show());
  keys.on("gap-analysis", () => gapAnalysis.show());
  keys.on("column-manager", () => columnManager.show());
  keys.on("color-rules", () => colorRules.show());
  keys.on("ioc-matcher", () => iocMatcher.show());
  keys.on("export", () => exportDialog.show());
  keys.on("generate-report", () => reportDialog.show());
  keys.on("save-session", () => sessionDialog.show("save"));
  keys.on("help", () => helpOverlay.toggle());

  // Theme cycling — Ctrl+T restarts with next theme
  keys.on("cycle-theme", () => {
    const nextTheme = getNextTheme(state.theme);
    const nextLabel = require("./theme").getTheme(nextTheme).label || nextTheme;

    // Flash a quick notification
    const notice = blessed.box({
      parent: screen, top: "center", left: "center",
      width: 30, height: 3, border: { type: "line" },
      tags: true, style: { bg: theme.modal.bg, fg: theme.accent, border: { fg: theme.accent } },
    });
    notice.setContent(` Switching to: {bold}${nextLabel}{/}`);
    screen.render();

    setTimeout(() => {
      // Save current file paths so we can restore after restart
      const filePaths = state.tabs.map((t) => t.filePath).filter(Boolean);
      cleanup();

      // Restart with new theme
      const { createApp } = require("./app");
      createApp({ theme: nextTheme, files: filePaths });
    }, 400);
  });

  // Open file
  keys.on("open-file", () => promptOpenFile());

  // Escape — close modals/panels
  keys.on("escape", () => {
    if (state.activeModal) {
      state.closeModal();
    } else if (state.activePanel) {
      state.setPanel(null);
    } else if (state.detailOpen) {
      detailPanel.hide();
    } else if (state.searchBarFocused) {
      searchBar.blur();
    }
  });

  // Quit
  keys.on("quit", () => {
    cleanup();
    process.exit(0);
  });

  // ── Key dispatch on screen ──
  screen.on("keypress", (ch, key) => {
    if (!key) return;

    // Build key name matching our KEYMAP format.
    // For printable characters, use `ch` directly — this preserves case
    // so 'H' maps to "histogram" and 'h' maps to "scroll-left".
    // neo-blessed reports Shift+H as key.full="S-h", which wouldn't match
    // our KEYMAP entries like "H", "S", "P", etc.
    // For special/control keys, use key.full (e.g. "C-d", "escape", "space").
    let keyName;
    if (ch && ch.length === 1 && ch > " " && ch <= "~" && !key.ctrl && !key.meta) {
      keyName = ch;
    } else {
      keyName = key.full || key.name || ch;
    }

    // Don't dispatch when search bar is focused (let it handle input)
    if (state.searchBarFocused && keyName !== "escape" && keyName !== "C-c") {
      return;
    }

    // Don't dispatch grid keys when a modal is open
    if (state.activeModal) {
      if (keyName === "escape") {
        keys._fire("escape");
      }
      return;
    }

    // Don't dispatch grid navigation when a panel is active —
    // only allow panel toggles, escape, quit, and theme cycling through
    if (state.activePanel) {
      const PANEL_PASSTHROUGH = new Set([
        "escape", "H", "S", "P", "L", "A", "Q", "?",
      ]);
      const PANEL_PASSTHROUGH_CTRL = new Set([
        "C-g", "C-q", "C-c", "C-t",
      ]);
      if (PANEL_PASSTHROUGH.has(keyName) || PANEL_PASSTHROUGH_CTRL.has(keyName)) {
        keys.dispatch(keyName, state);
      }
      // Everything else (j/k/arrows/g/G/etc.) is consumed by the panel's own list widget
      return;
    }

    keys.dispatch(keyName, state);
  });

  // ── File import ──

  async function importFile(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return;
    }

    const tabId = crypto.randomBytes(8).toString("hex");
    const fileName = path.basename(filePath);

    state.setImporting(true, { phase: "Starting", current: 0, total: 0, fileName });
    importProgress.show();
    importProgress.update(state.importProgress);
    screen.render();

    try {
      // Parse and import
      const result = await parseFile(filePath, tabId, db, (progress) => {
        state.setImporting(true, { ...progress, fileName });
        importProgress.update(state.importProgress);
      });

      // Build FTS index in background
      try {
        db.buildFtsAsync(tabId, (progress) => {
          state.ftsStatus[tabId] = { building: true, progress };
          statusBar.render();
        }).then(() => {
          state.ftsStatus[tabId] = { ready: true, building: false };
          statusBar.render();
        }).catch(() => {});
      } catch {}

      // Build column indexes in background
      try {
        db.buildIndexesAsync(tabId, (progress) => {
          state.indexStatus[tabId] = { building: true, progress };
        }).then(() => {
          state.indexStatus[tabId] = { building: false };
        }).catch(() => {});
      } catch {}

      // Add tab
      state.addTab({
        id: tabId,
        name: fileName,
        filePath,
        headers: result.headers || [],
        rowCount: result.rowCount || 0,
        tsColumns: result.tsColumns ? new Set(result.tsColumns) : new Set(),
        numericColumns: result.numericColumns ? new Set(result.numericColumns) : new Set(),
      });

      state.setImporting(false);
      importProgress.hide();

      // Auto-fit columns and fetch initial data
      grid.fetchRows().then(() => {
        grid.autoFitColumns();
      });

    } catch (err) {
      state.setImporting(false);
      importProgress.hide();

      // Show error
      const errBox = blessed.message({
        parent: screen,
        top: "center",
        left: "center",
        width: 50,
        height: 7,
        border: { type: "line" },
        style: { bg: theme.modal.bg, fg: "red", border: { fg: "red" } },
        label: " Error ",
      });
      errBox.error(`Failed to import ${fileName}:\n${err.message}`, 5);
      screen.render();
    }
  }

  function promptOpenFile() {
    const prompt = blessed.textbox({
      parent: screen,
      top: "center",
      left: "center",
      width: 60,
      height: 3,
      border: { type: "line" },
      inputOnFocus: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: { fg: theme.modal.borderFg },
        focus: { bg: theme.modal.bg, fg: theme.modal.fg },
      },
      label: ` {${theme.modal.titleFg}-fg}{bold}Open File{/} `,
      tags: true,
    });

    prompt.focus();
    prompt.readInput();

    prompt.on("submit", (value) => {
      prompt.destroy();
      screen.render();
      if (value && value.trim()) {
        let filePath = value.trim();
        if (!path.isAbsolute(filePath)) {
          filePath = path.resolve(process.cwd(), filePath);
        }
        importFile(filePath);
      }
    });

    prompt.on("cancel", () => {
      prompt.destroy();
      screen.render();
    });

    prompt.key("escape", () => {
      prompt.cancel();
    });

    screen.render();
  }

  // ── Search handler ──
  function handleSearch(term) {
    if (!state.activeTabId || !db) return;
    if (term) {
      try {
        const count = db.searchCount(state.activeTabId, term, state.searchMode, state.searchCondition);
        state.searchCount = count || 0;
      } catch {
        state.searchCount = 0;
      }
    }
    grid.fetchRows();
    statusBar.render();
  }

  // ── Bookmark handler ──
  function handleBookmark() {
    const row = grid.getCurrentRow();
    if (!row || !state.activeTabId) return;
    try {
      db.toggleBookmark(state.activeTabId, row.rowid || row._rowid);
      grid.fetchRows();
    } catch {}
  }

  // ── Tag handlers ──
  function handleAddTag() {
    const row = grid.getCurrentRow();
    if (!row || !state.activeTabId) return;

    const prompt = blessed.textbox({
      parent: screen,
      top: "center",
      left: "center",
      width: 40,
      height: 3,
      border: { type: "line" },
      inputOnFocus: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: { fg: theme.modal.borderFg },
        focus: { bg: theme.modal.bg },
      },
      label: ` {${theme.modal.titleFg}-fg}{bold}Add Tag{/} `,
      tags: true,
    });

    prompt.focus();
    prompt.readInput();

    prompt.on("submit", (value) => {
      prompt.destroy();
      screen.render();
      if (value && value.trim()) {
        try {
          db.addTag(state.activeTabId, row.rowid || row._rowid, value.trim());
          grid.fetchRows();
        } catch {}
      }
    });
    prompt.on("cancel", () => { prompt.destroy(); screen.render(); });
    prompt.key("escape", () => prompt.cancel());
    screen.render();
  }

  function handleRemoveTag() {
    const row = grid.getCurrentRow();
    if (!row || !state.activeTabId || !row._tags) return;
    try {
      const tags = row._tags.split(",").map((t) => t.trim());
      if (tags.length === 1) {
        db.removeTag(state.activeTabId, row.rowid || row._rowid, tags[0]);
        grid.fetchRows();
      } else {
        // Show tag picker
        const tagList = blessed.list({
          parent: screen,
          top: "center",
          left: "center",
          width: 30,
          height: Math.min(tags.length + 2, 15),
          border: { type: "line" },
          tags: true,
          keys: true,
          vi: true,
          items: tags,
          style: {
            bg: theme.modal.bg,
            fg: theme.modal.fg,
            border: { fg: theme.modal.borderFg },
            selected: { bg: theme.modal.selectedBg, fg: theme.modal.selectedFg },
          },
          label: ` {${theme.modal.titleFg}-fg}{bold}Remove Tag{/} `,
        });
        tagList.focus();
        tagList.on("select", (item, idx) => {
          db.removeTag(state.activeTabId, row.rowid || row._rowid, tags[idx]);
          tagList.destroy();
          grid.fetchRows();
          screen.render();
        });
        tagList.key(["escape", "q"], () => { tagList.destroy(); screen.render(); });
        screen.render();
      }
    } catch {}
  }

  // ── Copy row to clipboard ──
  function handleCopyRow() {
    const row = grid.getCurrentRow();
    if (!row) return;
    const headers = state.visibleColumns.length ? state.visibleColumns : (state.activeTab?.headers || []);
    const text = headers.map((h) => `${h}: ${row[h] || ""}`).join("\n");

    // Platform-detected clipboard
    const { execSync } = require("child_process");
    try {
      if (process.platform === "darwin") {
        execSync("pbcopy", { input: text });
      } else {
        try { execSync("xclip -selection clipboard", { input: text }); }
        catch { execSync("xsel --clipboard --input", { input: text }); }
      }
    } catch {}
  }

  // ── Cleanup ──
  function cleanup() {
    try { db.closeAll(); } catch {}
    screen.destroy();
  }

  // ── Handle session restore ──
  state.on("session-loaded", (session) => {
    if (session.tabs) {
      for (const tab of session.tabs) {
        if (tab.filePath && fs.existsSync(tab.filePath)) {
          importFile(tab.filePath);
        }
      }
    }
  });

  // ── Initial render ──
  screen.render();

  // ── Import files from CLI args ──
  if (opts.files && opts.files.length > 0) {
    (async () => {
      for (const f of opts.files) {
        await importFile(f);
      }
    })();
  }

  // Handle terminal resize
  screen.on("resize", () => {
    screen.render();
  });

  // Clean exit
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
  process.on("exit", () => {
    try { db.closeAll(); } catch {}
  });

  return { screen, state, db };
}

module.exports = { createApp };
