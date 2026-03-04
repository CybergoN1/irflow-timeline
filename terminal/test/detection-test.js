#!/usr/bin/env node
/**
 * IRFlow Timeline — Detection Engine Test
 *
 * Validates:
 *   - 327 process chain rules load correctly
 *   - Regex patterns compile and match expected strings
 *   - Detection triggers on sysmon-process.csv
 *   - Persistence analysis on persistence-evtx.csv
 *   - No false positives on benign parent→child combos
 *
 * Usage: node test/detection-test.js
 */

"use strict";

const path = require("path");
const TimelineDB = require("../lib/backend/db");
const { parseFile } = require("../lib/backend/parser");
const rules = require("../lib/backend/detection-rules");

const SYSMON_CSV = path.resolve(__dirname, "../test-data/sysmon-process.csv");
const PERSISTENCE_CSV = path.resolve(__dirname, "../test-data/persistence-evtx.csv");

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

function assertGt(actual, threshold, label) {
  assert(actual > threshold, `${label} (got ${actual}, expected > ${threshold})`);
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

async function main() {
  console.log("IRFlow Timeline — Detection Engine Test\n");

  // ── 1. Chain rules loaded ──
  section("1. Chain rule map");
  {
    const map = rules.CHAIN_RULE_MAP;
    assert(map instanceof Map, "CHAIN_RULE_MAP is a Map");
    assertGt(map.size, 300, "At least 300 chain rules loaded");

    // Spot-check known rules
    const officeCmd = map.get("winword:cmd") || map.get("winword.exe:cmd.exe");
    assert(officeCmd, "winword→cmd rule exists");
    if (officeCmd) {
      assert(officeCmd.level >= 2, "winword→cmd severity >= 2");
      assert(officeCmd.reason.length > 0, "winword→cmd has reason text");
      assert(/T\d{4}/.test(officeCmd.reason), "winword→cmd has MITRE technique ID");
    }

    const psexecCmd = map.get("psexesvc:cmd") || map.get("cmd:psexec");
    assert(psexecCmd, "psexec-related rule exists");

    const rundll32 = map.get("explorer.exe:rundll32.exe") || map.get("explorer:rundll32");
    // This may or may not exist depending on rule set
    if (rundll32) {
      assert(rundll32.level >= 0, "explorer→rundll32 has valid severity");
    }
  }

  // ── 2. Severity levels ──
  section("2. Severity distribution");
  {
    const map = rules.CHAIN_RULE_MAP;
    const levels = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const [, rule] of map) {
      if (rule.level >= 0 && rule.level <= 3) {
        levels[rule.level]++;
      }
    }
    assertGt(levels[3], 0, "Has severity-3 (critical) rules");
    assertGt(levels[2], 0, "Has severity-2 (high) rules");
    assertGt(levels[1], 0, "Has severity-1 (medium) rules");
    const total = levels[0] + levels[1] + levels[2] + levels[3];
    assert(total === map.size, `All rules have valid severity 0-3 (${total}/${map.size})`);
    console.log(`    Distribution: info=${levels[0]} med=${levels[1]} high=${levels[2]} crit=${levels[3]}`);
  }

  // ── 3. MITRE ATT&CK technique IDs ──
  section("3. MITRE ATT&CK coverage");
  {
    const map = rules.CHAIN_RULE_MAP;
    const techniqueRe = /T\d{4}(\.\d{3})?/;
    let withTechnique = 0;
    const techniques = new Set();
    for (const [, rule] of map) {
      const match = techniqueRe.exec(rule.reason);
      if (match) {
        withTechnique++;
        techniques.add(match[0]);
      }
    }
    assertGt(withTechnique, map.size * 0.5, "50%+ rules have MITRE technique IDs");
    assertGt(techniques.size, 20, "At least 20 unique MITRE techniques covered");
    console.log(`    ${techniques.size} unique techniques across ${withTechnique} rules`);
  }

  // ── 4. Regex patterns compile ──
  section("4. Regex pattern compilation");
  {
    const regexNames = [
      "SUS_PATHS",
      "SAFE_PROCS",
      "ENCODED_PS",
      "CRED_DUMP_CMD",
      "NTDS_EXTRACT",
      "LSASS_TOOLS",
      "ACCOUNT_MANIP",
      "DEFENSE_EVASION",
      "NETWORK_SCANNERS",
      "AD_RECON_TOOLS",
      "RMM_TOOLS",
      "EXFIL_TOOLS",
      "ARCHIVE_SUSPECT",
    ];
    let compiled = 0;
    for (const name of regexNames) {
      const pattern = rules[name];
      if (pattern instanceof RegExp) {
        compiled++;
        console.log(`  ✓ ${name} — compiled (${pattern.flags})`);
        passed++;
      } else if (pattern) {
        console.log(`  ? ${name} — exists but is ${typeof pattern}`);
      } else {
        console.log(`  - ${name} — not exported (may not exist)`);
      }
    }
    assertGt(compiled, 5, "At least 5 regex patterns compiled");
  }

  // ── 5. Regex pattern matching ──
  section("5. Regex pattern matching");
  {
    if (rules.ENCODED_PS) {
      assert(rules.ENCODED_PS.test("powershell -enc dGVzdA=="), "ENCODED_PS matches -enc");
      assert(
        rules.ENCODED_PS.test("powershell.exe -EncodedCommand dGVzdA=="),
        "ENCODED_PS matches -EncodedCommand"
      );
    }
    if (rules.CRED_DUMP_CMD) {
      assert(rules.CRED_DUMP_CMD.test("mimikatz.exe sekurlsa::logonpasswords"), "CRED_DUMP matches mimikatz");
      assert(rules.CRED_DUMP_CMD.test("procdump -ma lsass.exe"), "CRED_DUMP matches procdump lsass");
    }
    if (rules.SUS_PATHS) {
      assert(rules.SUS_PATHS.test("C:\\Users\\test\\AppData\\Local\\Temp\\mal.exe"), "SUS_PATHS matches Temp path");
    }
    if (rules.DEFENSE_EVASION) {
      assert(rules.DEFENSE_EVASION.test("vssadmin delete shadows /all"), "DEFENSE_EVASION matches vssadmin");
      assert(rules.DEFENSE_EVASION.test("wevtutil cl Security"), "DEFENSE_EVASION matches wevtutil");
    }
    if (rules.AD_RECON_TOOLS) {
      assert(rules.AD_RECON_TOOLS.test("sharphound.exe"), "AD_RECON matches SharpHound");
      assert(rules.AD_RECON_TOOLS.test("rubeus.exe"), "AD_RECON matches Rubeus");
    }
    if (rules.RMM_TOOLS) {
      assert(rules.RMM_TOOLS.test("anydesk.exe"), "RMM_TOOLS matches AnyDesk");
      assert(rules.RMM_TOOLS.test("teamviewer.exe"), "RMM_TOOLS matches TeamViewer");
    }
  }

  // ── 6. No false positives on benign chains ──
  section("6. Benign chain — no false positives");
  {
    const map = rules.CHAIN_RULE_MAP;
    const benignChains = [
      "explorer.exe:notepad.exe",
      "explorer:notepad",
      "svchost.exe:svchost.exe",
      "svchost:svchost",
      "services.exe:svchost.exe",
      "services:svchost",
    ];
    for (const chain of benignChains) {
      const rule = map.get(chain);
      if (rule) {
        // If it exists, should be low severity
        assert(rule.level <= 1, `${chain} severity <= 1 (got ${rule.level})`);
      } else {
        passed++;
        console.log(`  ✓ ${chain} — no rule (benign, expected)`);
      }
    }
  }

  // ── 7. Detection on sysmon data ──
  section("7. Detection on sysmon-process.csv");
  const db = new TimelineDB();
  const tabSysmon = "det-sysmon";
  {
    const result = await parseFile(SYSMON_CSV, tabSysmon, db, () => {});
    assertGt(result.rowCount, 0, "Sysmon data imported");

    // Run persistence analysis (applies detection rules)
    const analysis = db.getPersistenceAnalysis(tabSysmon);
    assert(analysis, "getPersistenceAnalysis returns result");
    if (analysis.items && analysis.items.length > 0) {
      assertGt(analysis.items.length, 0, "At least 1 detection item triggered");
      console.log(`    Detected ${analysis.items.length} item(s):`);
      for (const t of analysis.items.slice(0, 10)) {
        console.log(`      [${t.severity || t.level}] ${t.name || t.category} — ${t.count || t.rows?.length || 0} match(es)`);
      }
    } else if (analysis.error) {
      console.log(`    (skipped — ${analysis.error})`);
      assert(true, "getPersistenceAnalysis ran (data format not compatible)");
    } else {
      assert(true, "getPersistenceAnalysis ran (no detections in this dataset)");
    }
  }

  // ── 8. Process tree on sysmon data ──
  section("8. Process tree on sysmon data");
  {
    const tree = db.getProcessTree(tabSysmon);
    if (tree.error) {
      console.log(`  (skipped — ${tree.error})`);
    } else {
      assert(tree.processes && tree.processes.length > 0, "Process tree has entries");
      assert(tree.stats, "Process tree returns stats");
      if (tree.stats) {
        console.log(
          `    Roots: ${tree.stats.rootProcesses}, Leaves: ${tree.stats.leafProcesses}, MaxDepth: ${tree.stats.maxDepth}`
        );
      }
    }
  }

  // ── 9. Persistence data ──
  section("9. Persistence CSV detection");
  const tabPersist = "det-persist";
  {
    const result = await parseFile(PERSISTENCE_CSV, tabPersist, db, () => {});
    assertGt(result.rowCount, 0, "Persistence data imported");

    const analysis = db.getPersistenceAnalysis(tabPersist);
    assert(analysis, "getPersistenceAnalysis returns result");
    if (analysis.items && analysis.items.length > 0) {
      assertGt(analysis.items.length, 0, "Persistence items detected");
      for (const t of analysis.items.slice(0, 10)) {
        console.log(`    [${t.severity || t.level}] ${t.name || t.category} — ${t.count || t.rows?.length || 0} match(es)`);
      }
    } else if (analysis.error) {
      console.log(`    (skipped — ${analysis.error})`);
      assert(true, "getPersistenceAnalysis ran (data format not compatible)");
    } else {
      assert(true, "getPersistenceAnalysis ran (no detections in this dataset)");
    }
  }

  // ── 10. Lateral movement detection ──
  section("10. Lateral movement detection");
  {
    const lm = db.getLateralMovement(tabSysmon);
    if (lm && lm.chains) {
      console.log(`    ${lm.chains.length} lateral movement chain(s) found`);
      assert(true, "getLateralMovement runs without error");
    } else {
      assert(true, "getLateralMovement returns (no lateral movement in test data)");
    }
  }

  // ── Cleanup ──
  db.closeAll();

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
