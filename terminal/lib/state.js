"use strict";

/**
 * state.js — Central state management for IRFlow Timeline TUI
 *
 * Single mutable state object shared across all widgets.
 * Widgets read from state and call mutators that emit events.
 */

const EventEmitter = require("events");

class AppState extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);

    // ── Tabs ──
    this.tabs = [];         // [{ id, name, filePath, headers, rowCount, tsColumns, numericColumns }]
    this.activeTabIndex = -1;

    // ── Data grid ──
    this.rows = [];         // Current visible rows from queryRows
    this.totalRows = 0;     // Total rows matching current filters
    this.offset = 0;        // Current pagination offset
    this.limit = 200;       // Rows per page/window
    this.selectedRow = 0;   // Index within current window
    this.colScroll = 0;     // Horizontal column scroll offset

    // ── Sort ──
    this.sortCol = null;
    this.sortOrder = null;  // "asc" | "desc" | null

    // ── Search ──
    this.searchTerm = "";
    this.searchMode = "and";       // and, or, exact, regex, fuzzy
    this.searchCondition = "contains";
    this.searchCount = 0;
    this.searchActive = false;

    // ── Filters ──
    this.advancedFilters = [];
    this.tagFilter = null;
    this.bookmarkedOnly = false;

    // ── UI state ──
    this.theme = "dark";
    this.detailOpen = false;
    this.activeModal = null;  // "column-manager" | "color-rules" | "filter" | "help" | etc.
    this.activePanel = null;  // "histogram" | "stacking" | "process-tree" | etc.

    // ── Color rules ──
    this.colorRules = [];

    // ── Tags ──
    this.tagColors = {};

    // ── FTS/Index status ──
    this.ftsStatus = {};    // tabId -> { ready, building, progress }
    this.indexStatus = {};   // tabId -> { building, progress }

    // ── Import ──
    this.importing = false;
    this.importProgress = { phase: "", current: 0, total: 0, fileName: "" };

    // ── Visible columns ──
    this.visibleColumns = [];
    this.columnWidths = {};
    this.pinnedColumns = [];

    // ── Per-tab view state ──
    this._tabViewState = new Map(); // tabId -> saved view state
  }

  // ── Tab management ──

  get activeTab() {
    return this.tabs[this.activeTabIndex] || null;
  }

  get activeTabId() {
    return this.activeTab?.id || null;
  }

  addTab(tab) {
    this.tabs.push(tab);
    this.activeTabIndex = this.tabs.length - 1;
    this.visibleColumns = tab.headers.slice();
    this.resetView();
    this.emit("tab-changed");
    this.emit("tabs-updated");
  }

  switchTab(index) {
    if (index >= 0 && index < this.tabs.length && index !== this.activeTabIndex) {
      this._saveTabViewState();
      this.activeTabIndex = index;
      const tab = this.activeTab;
      if (tab) {
        this._restoreTabViewState(tab.id);
      } else {
        this.resetView();
      }
      this.emit("tab-changed");
    }
  }

  closeTab(index) {
    if (index < 0 || index >= this.tabs.length) return;
    const closedTab = this.tabs[index];
    if (closedTab) this._tabViewState.delete(closedTab.id);
    this.tabs.splice(index, 1);
    if (this.tabs.length === 0) {
      this.activeTabIndex = -1;
      this.resetView();
    } else {
      if (this.activeTabIndex >= this.tabs.length) {
        this.activeTabIndex = this.tabs.length - 1;
      }
      const tab = this.activeTab;
      if (tab) {
        this._restoreTabViewState(tab.id);
      } else {
        this.resetView();
      }
    }
    this.emit("tab-changed");
    this.emit("tabs-updated");
  }

  // ── View reset ──

  resetView() {
    this.offset = 0;
    this.selectedRow = 0;
    this.colScroll = 0;
    this.rows = [];
    this.totalRows = 0;
    this.sortCol = null;
    this.sortOrder = null;
    this.searchTerm = "";
    this.searchActive = false;
    this.advancedFilters = [];
    this.tagFilter = null;
    this.bookmarkedOnly = false;
  }

  _saveTabViewState() {
    const tab = this.activeTab;
    if (!tab) return;
    this._tabViewState.set(tab.id, {
      offset: this.offset,
      selectedRow: this.selectedRow,
      colScroll: this.colScroll,
      sortCol: this.sortCol,
      sortOrder: this.sortOrder,
      searchTerm: this.searchTerm,
      searchMode: this.searchMode,
      searchCondition: this.searchCondition,
      searchActive: this.searchActive,
      advancedFilters: this.advancedFilters.slice(),
      tagFilter: this.tagFilter,
      bookmarkedOnly: this.bookmarkedOnly,
      visibleColumns: this.visibleColumns.slice(),
      columnWidths: { ...this.columnWidths },
      pinnedColumns: this.pinnedColumns.slice(),
      colorRules: this.colorRules.slice(),
    });
  }

  _restoreTabViewState(tabId) {
    const saved = this._tabViewState.get(tabId);
    if (saved) {
      this.offset = saved.offset;
      this.selectedRow = saved.selectedRow;
      this.colScroll = saved.colScroll;
      this.sortCol = saved.sortCol;
      this.sortOrder = saved.sortOrder;
      this.searchTerm = saved.searchTerm;
      this.searchMode = saved.searchMode;
      this.searchCondition = saved.searchCondition;
      this.searchActive = saved.searchActive;
      this.advancedFilters = saved.advancedFilters.slice();
      this.tagFilter = saved.tagFilter;
      this.bookmarkedOnly = saved.bookmarkedOnly;
      this.visibleColumns = saved.visibleColumns.slice();
      this.columnWidths = { ...saved.columnWidths };
      this.pinnedColumns = saved.pinnedColumns.slice();
      this.colorRules = saved.colorRules.slice();
    } else {
      this.resetView();
    }
  }

  // ── Sort ──

  cycleSort(colName) {
    if (this.sortCol !== colName) {
      this.sortCol = colName;
      this.sortOrder = "asc";
    } else if (this.sortOrder === "asc") {
      this.sortOrder = "desc";
    } else {
      this.sortCol = null;
      this.sortOrder = null;
    }
    this.offset = 0;
    this.selectedRow = 0;
    this.emit("sort-changed");
  }

  // ── Search ──

  setSearch(term, mode, condition) {
    this.searchTerm = term || "";
    if (mode) this.searchMode = mode;
    if (condition) this.searchCondition = condition;
    this.searchActive = !!this.searchTerm;
    this.offset = 0;
    this.selectedRow = 0;
    this.emit("search-changed");
  }

  // ── Filters ──

  setFilters(filters) {
    this.advancedFilters = filters || [];
    this.offset = 0;
    this.selectedRow = 0;
    this.emit("filter-changed");
  }

  addFilter(filter) {
    this.advancedFilters.push(filter);
    this.offset = 0;
    this.selectedRow = 0;
    this.emit("filter-changed");
  }

  clearFilters() {
    this.advancedFilters = [];
    this.tagFilter = null;
    this.bookmarkedOnly = false;
    this.offset = 0;
    this.selectedRow = 0;
    this.emit("filter-changed");
  }

  clearAllTabFilters() {
    // Clear filters in all saved tab view states
    for (const [tabId, saved] of this._tabViewState) {
      saved.advancedFilters = [];
      saved.tagFilter = null;
      saved.bookmarkedOnly = false;
      saved.offset = 0;
      saved.selectedRow = 0;
    }
    // Clear current tab filters
    this.clearFilters();
  }

  // ── UI ──

  setModal(name) {
    this.activeModal = name;
    this.emit("modal-changed", name);
  }

  closeModal() {
    this.activeModal = null;
    this.emit("modal-changed", null);
  }

  setPanel(name) {
    const prev = this.activePanel;
    if (name === null) {
      // Explicit close
      this.activePanel = null;
    } else if (this.activePanel === name) {
      // Toggle off if same panel key pressed again
      this.activePanel = null;
    } else {
      // Close previous panel before opening new one
      if (prev) {
        this.activePanel = null;
        this.emit("panel-changed", null);
      }
      this.activePanel = name;
    }
    this.emit("panel-changed", this.activePanel);
  }

  setTheme(t) {
    this.theme = t;
    this.emit("theme-changed", t);
  }

  // ── Import ──

  setImporting(importing, progress) {
    this.importing = importing;
    if (progress) this.importProgress = progress;
    this.emit("import-progress", this.importProgress);
  }

  // ── Data update ──

  setRows(rows, totalRows) {
    this.rows = rows;
    this.totalRows = totalRows;
    this.emit("data-changed");
  }

  // ── Query options builder ──

  getQueryOptions(overrides = {}) {
    return {
      sortCol: this.sortCol,
      sortOrder: this.sortOrder,
      offset: this.offset,
      limit: this.limit,
      advancedFilters: this.advancedFilters.length ? this.advancedFilters : undefined,
      searchTerm: this.searchTerm || undefined,
      searchMode: this.searchMode,
      searchCondition: this.searchCondition,
      tagFilter: this.tagFilter || undefined,
      bookmarkedOnly: this.bookmarkedOnly || undefined,
      ...overrides,
    };
  }
}

module.exports = AppState;
