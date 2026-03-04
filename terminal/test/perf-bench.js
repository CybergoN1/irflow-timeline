#!/usr/bin/env node
/**
 * IRFlow Timeline — Performance Benchmark
 *
 * Measures:
 *   - Import throughput (rows/sec, MB/sec)
 *   - FTS5 search latency
 *   - Query + filter latency
 *   - Memory usage
 *
 * Usage:
 *   node test/perf-bench.js                        # uses built-in test data
 *   node test/perf-bench.js /path/to/large.csv     # uses custom file
 *
 * Targets (from test plan):
 *   - 1GB CSV import: < 60s
 *   - FTS5 search: < 500ms
 *   - Memory idle: < 200MB
 *   - First row rendered: < 2s
 */

"use strict";

const path = require("path");
const fs = require("fs");
const TimelineDB = require("../lib/backend/db");
const { parseFile } = require("../lib/backend/parser");

const DEFAULT_CSV = path.resolve(__dirname, "../test-data.csv");

// Targets from the test plan
const TARGETS = {
  searchLatencyMs: 500,
  memoryIdleMB: 200,
  firstRowMs: 2000,
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function memMB() {
  return Math.round(process.memoryUsage.rss() / 1024 / 1024);
}

function hrMs(start) {
  const [s, ns] = process.hrtime(start);
  return s * 1000 + ns / 1e6;
}

async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV;

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const fileSize = fs.statSync(csvPath).size;
  console.log("IRFlow Timeline — Performance Benchmark\n");
  console.log(`File: ${path.basename(csvPath)}`);
  console.log(`Size: ${formatBytes(fileSize)}`);
  console.log(`Memory baseline: ${memMB()} MB\n`);

  const db = new TimelineDB();
  const tabId = "perf-bench";
  const results = {};

  // ── 1. Import ──
  console.log("── Import ──");
  const importStart = process.hrtime();
  let firstRowTime = null;
  let rowCount = 0;
  const importResult = await parseFile(csvPath, tabId, db, (rows) => {
    if (!firstRowTime && rows > 0) {
      firstRowTime = hrMs(importStart);
    }
    rowCount = rows;
  });
  const importMs = hrMs(importStart);

  results.importMs = importMs;
  results.importRows = importResult.rowCount;
  results.importHeaders = importResult.headers.length;
  results.firstRowMs = firstRowTime || importMs;
  results.importRowsPerSec = Math.round((importResult.rowCount / importMs) * 1000);
  results.importMBPerSec = fileSize > 0 ? ((fileSize / 1024 / 1024) / (importMs / 1000)).toFixed(1) : "N/A";

  console.log(`  Rows: ${importResult.rowCount.toLocaleString()}`);
  console.log(`  Columns: ${importResult.headers.length}`);
  console.log(`  Time: ${(importMs / 1000).toFixed(2)}s`);
  console.log(`  Throughput: ${results.importRowsPerSec.toLocaleString()} rows/sec, ${results.importMBPerSec} MB/sec`);
  console.log(`  First row callback: ${results.firstRowMs.toFixed(0)}ms`);
  console.log(`  Memory after import: ${memMB()} MB`);

  if (results.firstRowMs > TARGETS.firstRowMs) {
    console.log(`  ⚠ First row > ${TARGETS.firstRowMs}ms target`);
  }

  // ── 2. Finalize + index ──
  console.log("\n── Index Building ──");
  const finResult = db.finalizeImport(tabId);

  const ftsStart = process.hrtime();
  await db.buildFtsAsync(tabId, (p) => {
    if (p.done) console.log(`  FTS: ${p.indexed.toLocaleString()} rows indexed`);
  });
  const ftsMs = hrMs(ftsStart);
  console.log(`  FTS build: ${(ftsMs / 1000).toFixed(2)}s`);

  const idxStart = process.hrtime();
  await db.buildIndexesAsync(tabId, () => {});
  const idxMs = hrMs(idxStart);
  console.log(`  B-tree indexes: ${(idxMs / 1000).toFixed(2)}s`);
  console.log(`  Memory after indexing: ${memMB()} MB`);

  // ── 3. Search latency ──
  console.log("\n── Search Latency (10 iterations) ──");
  const searchTerms = ["cmd.exe", "powershell", "svchost", "explorer", "chrome", "temp", "system32", "admin", "error", "exe"];
  const searchTimes = [];

  for (const term of searchTerms) {
    const t = process.hrtime();
    const { totalFiltered } = db.queryRows(tabId, {
      searchTerm: term,
      searchMode: "contains",
      limit: 50,
    });
    const ms = hrMs(t);
    searchTimes.push(ms);
    console.log(`  "${term}": ${ms.toFixed(1)}ms (${totalFiltered} matches)`);
  }

  const avgSearch = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
  const maxSearch = Math.max(...searchTimes);
  results.avgSearchMs = avgSearch;
  results.maxSearchMs = maxSearch;
  console.log(`  Avg: ${avgSearch.toFixed(1)}ms  Max: ${maxSearch.toFixed(1)}ms`);
  if (maxSearch > TARGETS.searchLatencyMs) {
    console.log(`  ⚠ Max search > ${TARGETS.searchLatencyMs}ms target`);
  }

  // ── 4. Regex search ──
  console.log("\n── Regex Search ──");
  {
    const t = process.hrtime();
    const { totalFiltered } = db.queryRows(tabId, {
      searchTerm: "cmd.*exe",
      searchMode: "regex",
      limit: 50,
    });
    const ms = hrMs(t);
    results.regexSearchMs = ms;
    console.log(`  "cmd.*exe": ${ms.toFixed(1)}ms (${totalFiltered} matches)`);
  }

  // ── 5. Sort + paginate ──
  console.log("\n── Sort + Paginate ──");
  {
    const sortCol = importResult.headers[0];
    const t = process.hrtime();
    db.queryRows(tabId, { sortCol, sortDir: "asc", limit: 100, offset: 0 });
    const ms1 = hrMs(t);

    const t2 = process.hrtime();
    db.queryRows(tabId, {
      sortCol,
      sortDir: "desc",
      limit: 100,
      offset: Math.max(0, importResult.rowCount - 100),
    });
    const ms2 = hrMs(t2);
    results.sortMs = (ms1 + ms2) / 2;
    console.log(`  Page 1 (ASC): ${ms1.toFixed(1)}ms`);
    console.log(`  Last page (DESC): ${ms2.toFixed(1)}ms`);
  }

  // ── 6. Filter ──
  console.log("\n── Column Filter ──");
  {
    const filterCol = importResult.headers[1] || importResult.headers[0];
    const t = process.hrtime();
    const { totalFiltered } = db.queryRows(tabId, {
      columnFilters: { [filterCol]: "a" },
      limit: 50,
    });
    const ms = hrMs(t);
    results.filterMs = ms;
    console.log(`  Filter '${filterCol}' contains 'a': ${ms.toFixed(1)}ms (${totalFiltered} rows)`);
  }

  // ── 7. Analysis ──
  console.log("\n── Analysis Functions ──");
  {
    const tsCol = importResult.tsColumns[0];
    if (tsCol) {
      const t = process.hrtime();
      db.getHistogramData(tabId, tsCol);
      console.log(`  Histogram: ${hrMs(t).toFixed(1)}ms`);

      const t2 = process.hrtime();
      db.getGapAnalysis(tabId, tsCol);
      console.log(`  Gap analysis: ${hrMs(t2).toFixed(1)}ms`);
    }

    const t3 = process.hrtime();
    db.getPersistenceAnalysis(tabId);
    console.log(`  Persistence analysis: ${hrMs(t3).toFixed(1)}ms`);

    const t4 = process.hrtime();
    db.getProcessTree(tabId);
    console.log(`  Process tree: ${hrMs(t4).toFixed(1)}ms`);
  }

  // ── 8. Memory final ──
  const memFinal = memMB();
  results.memFinalMB = memFinal;
  console.log(`\n── Memory ──`);
  console.log(`  Final: ${memFinal} MB`);
  if (memFinal > TARGETS.memoryIdleMB) {
    console.log(`  ⚠ Memory > ${TARGETS.memoryIdleMB}MB target (may be expected for large files)`);
  }

  // ── Cleanup ──
  db.closeAll();

  // ── Summary ──
  console.log(`\n${"═".repeat(50)}`);
  console.log("  BENCHMARK SUMMARY");
  console.log("═".repeat(50));
  console.log(`  File:              ${path.basename(csvPath)} (${formatBytes(fileSize)})`);
  console.log(`  Import:            ${(results.importMs / 1000).toFixed(2)}s (${results.importRowsPerSec.toLocaleString()} rows/sec)`);
  console.log(`  First row:         ${results.firstRowMs.toFixed(0)}ms ${results.firstRowMs <= TARGETS.firstRowMs ? "✓" : "⚠"}`);
  console.log(`  Search avg:        ${results.avgSearchMs.toFixed(1)}ms ${results.avgSearchMs <= TARGETS.searchLatencyMs ? "✓" : "⚠"}`);
  console.log(`  Search max:        ${results.maxSearchMs.toFixed(1)}ms ${results.maxSearchMs <= TARGETS.searchLatencyMs ? "✓" : "⚠"}`);
  console.log(`  Regex search:      ${results.regexSearchMs.toFixed(1)}ms`);
  console.log(`  Sort + paginate:   ${results.sortMs.toFixed(1)}ms`);
  console.log(`  Column filter:     ${results.filterMs.toFixed(1)}ms`);
  console.log(`  Memory final:      ${results.memFinalMB} MB ${results.memFinalMB <= TARGETS.memoryIdleMB ? "✓" : "⚠"}`);
  console.log("═".repeat(50));
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(2);
});
