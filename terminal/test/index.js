#!/usr/bin/env node
/**
 * IRFlow Timeline — Test Runner
 *
 * Runs all test suites sequentially and reports combined results.
 *
 * Usage:
 *   node test/index.js              # run all tests
 *   node test/index.js --smoke      # smoke test only
 *   node test/index.js --detection  # detection test only
 *   node test/index.js --perf       # performance benchmark only
 *   node test/index.js --docker     # docker test only
 */

"use strict";

const { execSync } = require("child_process");
const path = require("path");

const SUITES = {
  smoke: { script: "test/smoke-test.js", label: "Smoke Test" },
  detection: { script: "test/detection-test.js", label: "Detection Engine" },
  perf: { script: "test/perf-bench.js", label: "Performance Benchmark" },
  docker: { script: "test/docker-test.sh", label: "Docker" },
};

function run(cmd, label) {
  console.log(`\n${"━".repeat(60)}`);
  console.log(`  ${label}`);
  console.log("━".repeat(60));
  try {
    execSync(cmd, {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
      timeout: 300000,
    });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  let suitesToRun;

  if (args.length === 0) {
    // Default: run smoke + detection (skip perf and docker which are heavier)
    suitesToRun = ["smoke", "detection"];
  } else {
    suitesToRun = args
      .map((a) => a.replace(/^--/, ""))
      .filter((a) => SUITES[a]);

    if (suitesToRun.length === 0) {
      console.log("Usage: node test/index.js [--smoke] [--detection] [--perf] [--docker]");
      console.log("\nAvailable suites:");
      for (const [key, { label }] of Object.entries(SUITES)) {
        console.log(`  --${key.padEnd(12)} ${label}`);
      }
      process.exit(1);
    }
  }

  console.log("IRFlow Timeline — Test Runner");
  console.log(`Suites: ${suitesToRun.join(", ")}\n`);

  const results = {};

  for (const key of suitesToRun) {
    const suite = SUITES[key];
    const cmd =
      key === "docker"
        ? `bash ${suite.script}`
        : `node ${suite.script}`;
    results[key] = run(cmd, suite.label);
  }

  console.log(`\n${"━".repeat(60)}`);
  console.log("  OVERALL RESULTS");
  console.log("━".repeat(60));
  let allPassed = true;
  for (const [key, ok] of Object.entries(results)) {
    const label = SUITES[key].label;
    console.log(`  ${ok ? "✓" : "✗"} ${label}`);
    if (!ok) allPassed = false;
  }
  console.log("━".repeat(60));

  process.exit(allPassed ? 0 : 1);
}

main();
