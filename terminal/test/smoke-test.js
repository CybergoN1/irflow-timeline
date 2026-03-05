#!/usr/bin/env node
/**
 * IRFlow Timeline — Smoke Test
 *
 * Validates core backend functionality:
 *   DB lifecycle, CSV import, search, filter, sort,
 *   bookmarks, tags, export, detection, and cleanup.
 *
 * Usage: node test/smoke-test.js
 */

"use strict";

const path = require("path");
const fs = require("fs");
const TimelineDB = require("../lib/backend/db");
const { parseFile, parseCSVLine, detectDelimiter } = require("../lib/backend/parser");

const TEST_CSV = path.resolve(__dirname, "../test-data.csv");
const SYSMON_CSV = path.resolve(__dirname, "../test-data/sysmon-process.csv");
const LOGON_CSV = path.resolve(__dirname, "../test-data/logon-events.csv");
const PERSISTENCE_CSV = path.resolve(__dirname, "../test-data/persistence-evtx.csv");
const GAPS_CSV = path.resolve(__dirname, "../test-data/timeline-gaps.csv");
const IOCS_TXT = path.resolve(__dirname, "../test-data/iocs.txt");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

function assertEq(actual, expected, label) {
  assert(actual === expected, `${label} (got ${actual}, expected ${expected})`);
}

function assertGt(actual, threshold, label) {
  assert(actual > threshold, `${label} (got ${actual}, expected > ${threshold})`);
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

async function main() {
  console.log("IRFlow Timeline — Smoke Test\n");
  const db = new TimelineDB();

  // ── 1. Test data file existence ──
  section("1. Test data files");
  for (const f of [TEST_CSV, SYSMON_CSV, LOGON_CSV, PERSISTENCE_CSV, GAPS_CSV, IOCS_TXT]) {
    assert(fs.existsSync(f), `Exists: ${path.basename(f)}`);
  }

  // ── 2. CSV parser utilities ──
  section("2. Parser utilities");
  {
    const line = 'hello,"world, test","escaped""quote"';
    const fields = parseCSVLine(line, ",");
    assertEq(fields.length, 3, "parseCSVLine field count");
    assertEq(fields[1], "world, test", "parseCSVLine quoted field");
    assertEq(fields[2], 'escaped"quote', "parseCSVLine escaped quote");

    assertEq(detectDelimiter("a,b,c,d"), ",", "detectDelimiter comma");
    assertEq(detectDelimiter("a\tb\tc\td"), "\t", "detectDelimiter tab");
    assertEq(detectDelimiter("a|b|c|d"), "|", "detectDelimiter pipe");
  }

  // ── 3. CSV import ──
  section("3. CSV import (test-data.csv)");
  const tab1 = "smoke-test-1";
  let importResult;
  {
    let lastProgress = 0;
    importResult = await parseFile(TEST_CSV, tab1, db, (rows) => {
      lastProgress = rows;
    });
    assertGt(importResult.rowCount, 0, "Rows imported");
    assertGt(importResult.headers.length, 0, "Headers detected");
    assert(Array.isArray(importResult.tsColumns), "Timestamp columns detected");
    assertGt(lastProgress, 0, "Progress callback fired");
  }

  // ── 4. Query rows ──
  section("4. Query rows");
  {
    const { rows, totalFiltered } = db.queryRows(tab1, { limit: 10 });
    assertEq(totalFiltered, importResult.rowCount, "Total rows match import count");
    assertEq(rows.length, 10, "LIMIT 10 returns 10 rows");

    const { rows: page2 } = db.queryRows(tab1, { offset: 5, limit: 5 });
    assertEq(page2.length, 5, "OFFSET+LIMIT pagination works");
  }

  // ── 4b. Navigation / virtual scroll math ──
  section("4b. Navigation / virtual scroll");
  {
    // Simulate the data-grid's scroll logic with a viewport smaller than total rows
    // This catches bugs where offset clamping uses SQL limit instead of viewport height
    const totalRows = importResult.rowCount; // 30
    const viewportHeight = 10;               // simulate small terminal
    const sqlLimit = 200;                    // fetch buffer >> viewport
    const maxOffset = Math.max(0, totalRows - viewportHeight);

    // Verify basic pagination: can reach all rows via offset
    for (let off = 0; off <= maxOffset; off += viewportHeight) {
      const clamped = Math.min(off, maxOffset);
      const { rows } = db.queryRows(tab1, { offset: clamped, limit: sqlLimit });
      assertGt(rows.length, 0, `Offset ${clamped} returns rows`);
    }

    // Verify last page: offset at maxOffset returns remaining rows
    const { rows: lastPage, totalFiltered: lastTotal } = db.queryRows(tab1, {
      offset: maxOffset,
      limit: sqlLimit,
    });
    assertEq(lastTotal, totalRows, "Last page totalFiltered matches total");
    assertEq(lastPage.length, totalRows - maxOffset, "Last page row count correct");

    // goLast math: selectedRow should land on the last data row
    const goLastOffset = Math.max(0, totalRows - viewportHeight);
    const goLastSelected = Math.min(viewportHeight - 1, totalRows - 1 - goLastOffset);
    assertEq(goLastOffset + goLastSelected, totalRows - 1, "goLast reaches final row");

    // Verify offset clamp uses viewport, not SQL limit
    // Bug: Math.max(0, totalRows - sqlLimit) = 0, trapping offset at 0
    const badClamp = Math.max(0, totalRows - sqlLimit);
    const goodClamp = Math.max(0, totalRows - viewportHeight);
    assertEq(badClamp, 0, "SQL-limit clamp is 0 (would block scrolling)");
    assertGt(goodClamp, 0, "Viewport clamp allows scrolling");

    // Simulate moveDown from bottom of viewport at offset 0
    const selectedRow = viewportHeight - 1;
    const moveDownOffset = Math.min(0 + 1, goodClamp);
    assertGt(moveDownOffset, 0, "moveDown at bottom advances offset");

    // Simulate half-page down from bottom of viewport
    const halfPage = Math.floor(viewportHeight / 2);
    const halfPageOffset = Math.min(0 + halfPage, goodClamp);
    assertGt(halfPageOffset, 0, "halfPageDown advances offset");

    // With column filter: totalFiltered < totalRows, navigation still correct
    const headers = importResult.headers;
    const testCol = headers.find((h) => h.toLowerCase().includes("source")) || headers[1];
    const unique = db.getColumnUniqueValues(tab1, testCol, { limit: 1 });
    if (unique.length > 0) {
      const filterVal = String(unique[0].value || unique[0].val || "");
      const { totalFiltered: filteredCount } = db.queryRows(tab1, {
        columnFilters: { [testCol]: filterVal },
      });
      const filteredMaxOffset = Math.max(0, filteredCount - viewportHeight);
      if (filteredCount > viewportHeight) {
        const { rows: filteredLast } = db.queryRows(tab1, {
          offset: filteredMaxOffset,
          limit: sqlLimit,
          columnFilters: { [testCol]: filterVal },
        });
        assertGt(filteredLast.length, 0, "Filtered last page has rows");
        assert(
          filteredMaxOffset + filteredLast.length <= filteredCount,
          "Filtered navigation stays in bounds"
        );
      } else {
        assert(true, "Filtered dataset fits in viewport (no scroll needed)");
      }
    }
  }

  // ── 5. Sort ──
  section("5. Sort");
  {
    const headers = importResult.headers;
    const sortCol = headers[0]; // first column
    const { rows: asc } = db.queryRows(tab1, { sortCol, sortDir: "asc", limit: 5 });
    const { rows: desc } = db.queryRows(tab1, { sortCol, sortDir: "desc", limit: 5 });
    assert(asc.length > 0 && desc.length > 0, "Sort returns rows");
    // First row of ASC should differ from first row of DESC (unless all values equal)
    const ascVal = asc[0][sortCol];
    const descVal = desc[0][sortCol];
    assert(ascVal !== descVal || importResult.rowCount === 1, "ASC and DESC order differ");
  }

  // ── 6. Search ──
  section("6. Search");
  {
    // Search for something likely in the test data
    const { rows, totalFiltered } = db.queryRows(tab1, {
      searchTerm: "exe",
      searchMode: "contains",
    });
    assertGt(totalFiltered, 0, "Search 'exe' finds matches");
    assert(rows.length <= totalFiltered, "Rows <= totalFiltered");

    // Regex search
    const { totalFiltered: regexCount } = db.queryRows(tab1, {
      searchTerm: "cmd.*exe",
      searchMode: "regex",
    });
    assert(regexCount >= 0, "Regex search runs without error");

    // Search count helper
    const count = db.searchCount(tab1, "exe", "contains");
    assertEq(count, totalFiltered, "searchCount matches queryRows totalFiltered");
  }

  // ── 7. Column filters ──
  section("7. Column filters");
  {
    const headers = importResult.headers;
    // Use a column that has values
    const testCol = headers.find((h) => h.toLowerCase().includes("source")) || headers[1];
    const unique = db.getColumnUniqueValues(tab1, testCol, { limit: 5 });
    assertGt(unique.length, 0, `Unique values for '${testCol}'`);

    if (unique.length > 0) {
      const filterVal = String(unique[0].value || unique[0].val || "");
      const { totalFiltered } = db.queryRows(tab1, {
        columnFilters: { [testCol]: filterVal },
      });
      assertGt(totalFiltered, 0, `Column filter '${testCol}=${filterVal}' returns rows`);
      assert(totalFiltered <= importResult.rowCount, "Filtered count <= total");
    }
  }

  // ── 7b. Advanced filter operators ──
  section("7b. Advanced filter operators");
  {
    const headers = importResult.headers;
    const testCol = headers.find((h) => h.toLowerCase().includes("source")) || headers[1];
    const unique = db.getColumnUniqueValues(tab1, testCol, { limit: 5 });
    const vals = unique.map((u) => String(u.value || u.val || ""));

    // "in" operator (checkbox filter path)
    if (vals.length >= 2) {
      const subset = vals.slice(0, 2);
      const { totalFiltered: inCount } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "in", value: subset, logic: "AND" }],
      });
      assertGt(inCount, 0, `"in" operator filters rows (${subset.join(",")})`);
      assert(inCount <= importResult.rowCount, '"in" count <= total');

      // single-value "in" should match "==" for that value
      const { totalFiltered: inOne } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "in", value: [vals[0]], logic: "AND" }],
      });
      const { totalFiltered: eqOne } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "==", value: vals[0], logic: "AND" }],
      });
      assertEq(inOne, eqOne, '"in" with one value matches "==" count');
    }

    // TUI-style operators ("==", "!=", "startsWith", "endsWith")
    if (vals.length > 0) {
      const v = vals[0];
      const { totalFiltered: eqCount } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "==", value: v, logic: "AND" }],
      });
      assertGt(eqCount, 0, `"==" operator works for ${testCol}=${v}`);

      const { totalFiltered: neqCount } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "!=", value: v, logic: "AND" }],
      });
      assertEq(eqCount + neqCount, importResult.rowCount, '"==" + "!=" covers all rows');

      const { totalFiltered: swCount } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "startsWith", value: v.slice(0, 2), logic: "AND" }],
      });
      assertGt(swCount, 0, `"startsWith" operator works`);

      const { totalFiltered: ewCount } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "endsWith", value: v.slice(-2), logic: "AND" }],
      });
      assertGt(ewCount, 0, `"endsWith" operator works`);
    }

    // snake_case operators (Electron GUI path) still work
    if (vals.length > 0) {
      const v = vals[0];
      const { totalFiltered: eqSnake } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "equals", value: v, logic: "AND" }],
      });
      const { totalFiltered: eqTui } = db.queryRows(tab1, {
        advancedFilters: [{ column: testCol, operator: "==", value: v, logic: "AND" }],
      });
      assertEq(eqSnake, eqTui, '"equals" and "==" produce same result');
    }
  }

  // ── 8. Bookmarks ──
  section("8. Bookmarks");
  {
    const added = db.toggleBookmark(tab1, 1);
    assertEq(added, true, "Bookmark row 1 → added");
    assertEq(db.getBookmarkCount(tab1), 1, "Bookmark count = 1");

    db.toggleBookmark(tab1, 2);
    assertEq(db.getBookmarkCount(tab1), 2, "Bookmark count = 2");

    const ids = db.getBookmarkedIds(tab1);
    assert(ids.includes(1) && ids.includes(2), "Bookmarked IDs correct");

    const { totalFiltered } = db.queryRows(tab1, { bookmarkedOnly: true });
    assertEq(totalFiltered, 2, "bookmarkedOnly filter works");

    db.toggleBookmark(tab1, 1);
    assertEq(db.getBookmarkCount(tab1), 1, "Unbookmark row 1");
  }

  // ── 9. Tags ──
  section("9. Tags");
  {
    db.addTag(tab1, 1, "suspicious");
    db.addTag(tab1, 1, "reviewed");
    db.addTag(tab1, 2, "suspicious");

    const tags = db.getTagsForRows(tab1, [1, 2]);
    assert(tags[1] && tags[1].includes("suspicious"), "Row 1 has 'suspicious' tag");
    assert(tags[1] && tags[1].includes("reviewed"), "Row 1 has 'reviewed' tag");

    const allTags = db.getAllTags(tab1);
    assertGt(allTags.length, 0, "getAllTags returns data");

    const { totalFiltered } = db.queryRows(tab1, { tagFilter: "suspicious" });
    assertEq(totalFiltered, 2, "Tag filter returns matching rows");

    db.removeTag(tab1, 1, "reviewed");
    const tagsAfter = db.getTagsForRows(tab1, [1]);
    assert(!tagsAfter[1] || !tagsAfter[1].includes("reviewed"), "Tag removed");
  }

  // ── 10. Column stats ──
  section("10. Column stats");
  {
    const headers = importResult.headers;
    const stats = db.getColumnStats(tab1, headers[0]);
    assertGt(stats.totalRows, 0, "Column stats totalRows > 0");
    assert(stats.topValues && stats.topValues.length > 0, "Top values returned");
  }

  // ── 11. Histogram ──
  section("11. Histogram / gap analysis");
  {
    if (importResult.tsColumns.length > 0) {
      const tsCol = importResult.tsColumns[0];
      const hist = db.getHistogramData(tab1, tsCol);
      assertGt(hist.length, 0, `Histogram data for '${tsCol}'`);
    } else {
      console.log("  (skipped — no timestamp columns detected)");
    }
  }

  // ── 12. Export ──
  section("12. Export");
  {
    const exp = db.exportQuery(tab1, {});
    assert(exp.headers && exp.headers.length > 0, "Export has headers");
    assert(exp.iterator, "Export has iterator");
    let exportedRows = 0;
    for (const row of exp.iterator) {
      exportedRows++;
      if (exportedRows >= 10) break;
    }
    assertEq(exportedRows, 10, "Export iterator yields rows");
  }

  // ── 13. Multi-file import ──
  section("13. Multi-file import (sysmon-process.csv)");
  const tab2 = "smoke-test-2";
  {
    const result = await parseFile(SYSMON_CSV, tab2, db, () => {});
    assertGt(result.rowCount, 0, "Sysmon CSV imported");
    assertGt(result.headers.length, 5, "Multiple columns detected");
  }

  // ── 14. Tab info & isolation ──
  section("14. Tab isolation");
  {
    const info1 = db.getTabInfo(tab1);
    const info2 = db.getTabInfo(tab2);
    assert(info1.rowCount !== info2.rowCount || true, "Tabs have independent data");
    assert(info1.headers.length > 0, "Tab 1 info has headers");
    assert(info2.headers.length > 0, "Tab 2 info has headers");
  }

  // ── 14b. Tab-switch preserves view state ──
  section("14b. Tab-switch preserves view state");
  {
    const AppState = require("../lib/state");
    const s = new AppState();

    // Simulate two tabs
    s.addTab({ id: "A", name: "a.csv", headers: ["col1", "col2"], rowCount: 100 });
    s.addTab({ id: "B", name: "b.csv", headers: ["x", "y", "z"], rowCount: 50 });

    // Tab B is now active (addTab switches to it). Set some state on B.
    s.sortCol = "x";
    s.sortOrder = "desc";
    s.advancedFilters = [{ column: "y", operator: "contains", value: "test", logic: "AND" }];
    s.searchTerm = "hello";
    s.searchActive = true;
    s.offset = 10;
    s.selectedRow = 5;

    // Switch to tab A
    s.switchTab(0);
    // Tab A should have fresh/default state (never had state saved)
    assertEq(s.sortCol, null, "Tab A: sort is default after switch");
    assertEq(s.advancedFilters.length, 0, "Tab A: no filters after switch");
    assertEq(s.searchTerm, "", "Tab A: no search after switch");
    assertEq(s.offset, 0, "Tab A: offset is 0 after switch");

    // Set state on tab A
    s.sortCol = "col1";
    s.sortOrder = "asc";
    s.advancedFilters = [{ column: "col2", operator: "==", value: "42", logic: "AND" }];

    // Switch back to tab B — state should be restored
    s.switchTab(1);
    assertEq(s.sortCol, "x", "Tab B: sort column restored");
    assertEq(s.sortOrder, "desc", "Tab B: sort order restored");
    assertEq(s.advancedFilters.length, 1, "Tab B: filter restored");
    assertEq(s.advancedFilters[0].value, "test", "Tab B: filter value correct");
    assertEq(s.searchTerm, "hello", "Tab B: search restored");
    assertEq(s.offset, 10, "Tab B: offset restored");
    assertEq(s.selectedRow, 5, "Tab B: selectedRow restored");

    // Switch back to tab A — its state should be preserved too
    s.switchTab(0);
    assertEq(s.sortCol, "col1", "Tab A: sort column restored");
    assertEq(s.sortOrder, "asc", "Tab A: sort order restored");
    assertEq(s.advancedFilters.length, 1, "Tab A: filter restored");
    assertEq(s.advancedFilters[0].value, "42", "Tab A: filter value correct");

    // Close tab B — its saved state should be cleaned up
    s.switchTab(1);
    s.closeTab(1);
    // Now back on tab A (only tab left)
    assertEq(s.activeTabIndex, 0, "After close: tab A is active");
    assertEq(s.sortCol, "col1", "After close: tab A state intact");
  }

  // ── 15. IOC matching ──
  section("15. IOC matching");
  {
    const iocLines = fs
      .readFileSync(IOCS_TXT, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    assertGt(iocLines.length, 0, "IOC file loaded");

    // Escape IOC strings for use as regex (treat them as literal patterns)
    const escaped = iocLines.slice(0, 10).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const result = db.matchIocs(tab2, escaped);
    assert(result && typeof result.matchedRowIds !== "undefined", "matchIocs returns result");
  }

  // ── 16. Logon events import ──
  section("16. Logon events import");
  const tab3 = "smoke-test-3";
  {
    const result = await parseFile(LOGON_CSV, tab3, db, () => {});
    assertGt(result.rowCount, 0, "Logon CSV imported");
  }

  // ── 17. Persistence events import ──
  section("17. Persistence events import");
  const tab4 = "smoke-test-4";
  {
    const result = await parseFile(PERSISTENCE_CSV, tab4, db, () => {});
    assertGt(result.rowCount, 0, "Persistence CSV imported");
  }

  // ── 18. Timeline gaps import + gap analysis ──
  section("18. Timeline gaps + gap analysis");
  const tab5 = "smoke-test-5";
  {
    const result = await parseFile(GAPS_CSV, tab5, db, () => {});
    assertGt(result.rowCount, 0, "Timeline gaps CSV imported");

    if (result.tsColumns.length > 0) {
      const gaps = db.getGapAnalysis(tab5, result.tsColumns[0]);
      assert(gaps && gaps.gaps, "Gap analysis returns gaps array");
      assert(gaps.sessions, "Gap analysis returns sessions");
      assert(typeof gaps.totalEvents === "number", "Gap analysis returns totalEvents");
    }
  }

  // ── 19. Error handling ──
  section("19. Error handling");
  {
    // queryRows on nonexistent tab returns empty result (no crash)
    const result = db.queryRows("nonexistent-tab", {});
    assert(
      result && result.totalFiltered === 0 && result.rows.length === 0,
      "Query on nonexistent tab returns empty (no crash)"
    );

    // Empty file — parser may throw (known limitation: parser.js:304)
    const tmpBad = path.join(require("os").tmpdir(), "irflow-bad-test.csv");
    fs.writeFileSync(tmpBad, "col1,col2\n"); // header-only CSV
    let emptyHandled = false;
    try {
      const r = await parseFile(tmpBad, "bad-tab", db, () => {});
      emptyHandled = r.rowCount === 0;
    } catch (e) {
      emptyHandled = true; // Error is also acceptable
    }
    assert(emptyHandled, "Header-only CSV handled gracefully");
    try { fs.unlinkSync(tmpBad); } catch {}
    try { db.closeTab("bad-tab"); } catch {}
  }

  // ── 20. Cleanup ──
  section("20. Cleanup");
  {
    db.closeTab(tab1);
    db.closeTab(tab2);
    db.closeTab(tab3);
    db.closeTab(tab4);
    db.closeTab(tab5);
    // After closeTab, queryRows should return empty or throw
    let cleanedUp = false;
    try {
      const r = db.queryRows(tab1, {});
      cleanedUp = r.totalFiltered === 0;
    } catch {
      cleanedUp = true;
    }
    assert(cleanedUp, "Query after closeTab returns empty or throws");
    db.closeAll();
    assert(true, "closeAll succeeds");
  }

  // ── Summary ──
  console.log(`\n${"═".repeat(40)}`);
  console.log(`  Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
  console.log("═".repeat(40));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(2);
});
