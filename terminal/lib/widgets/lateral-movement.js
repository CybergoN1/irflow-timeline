"use strict";

/**
 * lateral-movement.js — Panel: network lateral movement table
 *
 * Shows source → destination connections with users, logon types,
 * hostnames + IPs where available, and failure indicators.
 */

const { formatNumber } = require("../utils/format");

const LOGON_NAMES = {
  "2": "Interactive", "3": "Network", "4": "Batch", "5": "Service",
  "7": "Unlock", "8": "NetworkClear", "9": "NewCred", "10": "RDP", "11": "CachedInt",
};

function createLateralMovement(blessed, screen, state, theme, db) {
  const box = blessed.box({
    parent: screen,
    bottom: 1,
    left: 0,
    width: "100%",
    height: "50%",
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Lateral Movement Analysis{/} `,
  });

  const list = blessed.list({
    parent: box,
    top: 1,
    left: 1,
    width: "100%-2",
    height: "100%-3",
    tags: true,
    keys: true,
    vi: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: "\u2588", style: { fg: theme.accent } },
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      selected: { bg: theme.modal.selectedBg, fg: theme.modal.selectedFg },
    },
  });

  const hint = blessed.text({
    parent: box,
    bottom: 0,
    left: 1,
    width: "100%-2",
    height: 1,
    tags: true,
    content: ` {${theme.accentAlt}-fg}Enter{/}=filter to connection  {${theme.accentAlt}-fg}Esc{/}=close`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  let sortedEdges = [];   // the edges after sorting — for Enter indexing
  let edgeListOffset = 0; // number of header/stats lines before edges start

  /**
   * Build hostname ↔ IP lookup from raw data so we can display both.
   * db.js prefers WorkstationName over IpAddress in edge.source,
   * so the IP gets lost. This recovers it.
   */
  function buildHostIpMap() {
    const hostToIp = new Map();
    const ipToHost = new Map();
    if (!state.activeTabId || !db) return { hostToIp, ipToHost };

    try {
      // Detect which columns exist
      const headers = state.activeTab?.headers || [];
      const ipCol = headers.find(h => /^IpAddress$|^SourceNetworkAddress$|^SourceAddress$/i.test(h));
      const wsCol = headers.find(h => /^WorkstationName$|^Workstation_Name$|^SourceHostname$/i.test(h));
      const compCol = headers.find(h => /^Computer$|^ComputerName$/i.test(h));

      if (!ipCol) return { hostToIp, ipToHost };

      // Sample rows to build the mapping
      const result = db.queryRows(state.activeTabId, { limit: 2000, offset: 0 });
      const rows = result?.rows || [];

      for (const row of rows) {
        const ip = String(row[ipCol] || "").trim().toUpperCase();
        if (!ip || ip === "-" || ip === "127.0.0.1" || ip === "::1") continue;

        // Map WorkstationName ↔ IP
        if (wsCol) {
          const ws = String(row[wsCol] || "").trim().toUpperCase();
          if (ws && ws !== "-") {
            hostToIp.set(ws, ip);
            ipToHost.set(ip, ws);
          }
        }

        // Map Computer ↔ IP (target host often has FQDN)
        if (compCol) {
          const comp = String(row[compCol] || "").trim().toUpperCase();
          if (comp && comp !== "-") {
            // Strip domain for matching (DC01.CORP.LOCAL → DC01)
            const short = comp.split(".")[0];
            if (!hostToIp.has(comp)) hostToIp.set(comp, ip);
            if (!hostToIp.has(short)) hostToIp.set(short, ip);
          }
        }
      }
    } catch { /* best effort */ }

    return { hostToIp, ipToHost };
  }

  /**
   * Format a host string showing hostname + IP when both are available.
   */
  function formatHost(host, hostToIp, ipToHost) {
    if (!host) return "?";
    const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
    if (isIP) {
      const name = ipToHost.get(host);
      return name ? `${name} (${host})` : host;
    }
    // host is a hostname — strip domain for lookup
    const short = host.split(".")[0];
    const ip = hostToIp.get(host) || hostToIp.get(short);
    return ip ? `${host} (${ip})` : host;
  }

  function show() {
    if (!state.activeTabId || !db) return;

    let resultObj;
    try {
      const opts = state.getQueryOptions({ limit: undefined, offset: undefined });
      resultObj = db.getLateralMovement(state.activeTabId, opts);
      if (resultObj && resultObj.error) {
        list.setItems([
          `  {${theme.severity[3]}-fg}${resultObj.error}{/}`,
          "",
          "  Lateral movement analysis requires columns like:",
          `  {${theme.accentAlt}-fg}IpAddress{/}, {${theme.accentAlt}-fg}Computer{/}, {${theme.accentAlt}-fg}LogonType{/}, {${theme.accentAlt}-fg}TargetUserName{/}`,
          "",
          "  Best with Windows Security logs (4624/4625/4648/4778)",
        ]);
        sortedEdges = [];
        list.select(0);
        box.show();
        list.focus();
        state.setPanel("lateral-movement");
        screen.render();
        return;
      }
    } catch {
      sortedEdges = [];
      list.setItems(["  Error loading lateral movement data."]);
      list.select(0);
      box.show();
      list.focus();
      state.setPanel("lateral-movement");
      screen.render();
      return;
    }

    const edges = Array.isArray(resultObj) ? resultObj : (resultObj?.edges || []);

    // Build hostname ↔ IP lookup
    const { hostToIp, ipToHost } = buildHostIpMap();

    // Also add clientAddresses from edges to the maps
    for (const edge of edges) {
      const addrs = Array.isArray(edge.clientAddresses) ? edge.clientAddresses : [];
      const names = Array.isArray(edge.clientNames) ? edge.clientNames : [];
      for (const addr of addrs) {
        if (addr && !ipToHost.has(addr.toUpperCase())) {
          if (names.length > 0) ipToHost.set(addr.toUpperCase(), names[0].toUpperCase());
        }
      }
      for (const name of names) {
        if (name && !hostToIp.has(name.toUpperCase())) {
          if (addrs.length > 0) hostToIp.set(name.toUpperCase(), addrs[0].toUpperCase());
        }
      }
    }

    if (edges.length === 0) {
      sortedEdges = [];
      list.setItems([
        "  No lateral movement connections detected.",
        "",
        "  Requires: IpAddress/SourceNetworkAddress, Computer,",
        "  TargetUserName, LogonType (Windows Security Event format)",
      ]);
    } else {
      // Stats summary
      const stats = resultObj?.stats || {};
      const items = [];
      items.push(`  {${theme.modal.dimFg}-fg}${formatNumber(stats.totalEvents || 0)} events | ` +
        `${formatNumber(stats.uniqueHosts || 0)} hosts | ` +
        `${formatNumber(stats.uniqueUsers || 0)} users | ` +
        `${formatNumber(stats.uniqueConnections || 0)} connections` +
        (stats.failedLogons ? ` | {${theme.severity[3]}-fg}${stats.failedLogons} with failures{/}{${theme.modal.dimFg}-fg}` : "") +
        `{/}`);
      items.push("");

      edgeListOffset = items.length;

      // Sort: failures first, then by count descending
      sortedEdges = [...edges].sort((a, b) => {
        if (a.hasFailures && !b.hasFailures) return -1;
        if (!a.hasFailures && b.hasFailures) return 1;
        return (b.count || 0) - (a.count || 0);
      });

      for (const edge of sortedEdges) {
        const users = Array.isArray(edge.users) ? edge.users : [];
        const logonTypes = Array.isArray(edge.logonTypes) ? edge.logonTypes : [];
        const count = edge.count || 0;

        // Format source and dest with hostname + IP
        const srcDisplay = formatHost(String(edge.source || ""), hostToIp, ipToHost);
        const tgtDisplay = formatHost(String(edge.target || ""), hostToIp, ipToHost);

        // Logon type display
        const ltDisplay = logonTypes.map(lt => LOGON_NAMES[String(lt)] || `Type${lt}`).join(", ");

        // Color + badge based on risk
        let lineColor = theme.accentAlt;
        let badge = `{${theme.accentAlt}-fg}\u2192{/}`;  // → Network
        if (edge.hasFailures) {
          lineColor = theme.severity[3];
          badge = `{${theme.severity[3]}-fg}\u2716{/}`;  // ✖ Failed
        } else if (logonTypes.some(lt => String(lt) === "10")) {
          lineColor = theme.severity[2];
          badge = `{${theme.severity[2]}-fg}\u25C6{/}`;  // ◆ RDP
        }

        // Main line: source → destination  [count]
        const countStr = formatNumber(count).padStart(6);
        items.push(` ${badge} {${lineColor}-fg}${srcDisplay}{/}  \u2192  {${lineColor}-fg}${tgtDisplay}{/}  ${countStr}`);

        // Detail line: users, logon types, time range
        const detailParts = [];
        if (users.length > 0) {
          const userStr = users.slice(0, 4).join(", ") + (users.length > 4 ? ` +${users.length - 4}` : "");
          detailParts.push(`{${theme.accent}-fg}${userStr}{/}`);
        }
        if (ltDisplay) {
          detailParts.push(`{${theme.modal.dimFg}-fg}[${ltDisplay}]{/}`);
        }
        if (edge.firstSeen && edge.lastSeen && edge.firstSeen !== edge.lastSeen) {
          const first = String(edge.firstSeen).substring(0, 19);
          const last = String(edge.lastSeen).substring(0, 19);
          detailParts.push(`{${theme.modal.dimFg}-fg}${first} \u2014 ${last}{/}`);
        }
        if (detailParts.length > 0) {
          items.push(`     ${detailParts.join("  ")}`);
        }
      }

      // Movement chains
      const chains = resultObj?.chains || [];
      if (chains.length > 0) {
        items.push("");
        items.push(` {${theme.accent}-fg}{bold}\u25C8 Movement Chains{/}`);
        for (const chain of chains.slice(0, 10)) {
          const hops = chain.hops || chain.path?.length || 0;
          const pathStr = Array.isArray(chain.path)
            ? chain.path.map(h => formatHost(h, hostToIp, ipToHost)).join(` {${theme.modal.dimFg}-fg}\u2192{/} `)
            : String(chain.chain || "");
          items.push(`   {${theme.severity[2]}-fg}${hops} hops:{/} ${pathStr}`);
        }
      }

      list.setItems(items);
      box.setLabel(` {${theme.modal.titleFg}-fg}{bold}\u25C8 Lateral Movement \u2014 ${edges.length} connections{/} `);
    }

    list.select(0);
    box.show();
    list.focus();
    state.setPanel("lateral-movement");
    screen.render();
  }

  function hide() {
    box.hide();
    state.setPanel(null);
    screen.render();
  }

  // Enter = filter data grid to show only events for the selected connection
  list.key("enter", () => {
    const idx = list.selected;
    if (sortedEdges.length === 0) return;

    // Map list index back to edge index: each edge occupies 2 lines (main + detail),
    // starting after edgeListOffset header lines
    const edgeIdx = Math.floor((idx - edgeListOffset) / 2);
    if (edgeIdx < 0 || edgeIdx >= sortedEdges.length) return;

    const edge = sortedEdges[edgeIdx];

    // Find the source column (IpAddress or WorkstationName)
    const headers = state.activeTab?.headers || [];
    const srcCol = headers.find(h => /^IpAddress$|^SourceNetworkAddress$|^WorkstationName$/i.test(h));
    const tgtCol = headers.find(h => /^Computer$|^ComputerName$/i.test(h));

    const filters = [];
    if (srcCol && edge.source) {
      filters.push({ column: srcCol, operator: "contains", value: edge.source, logic: "AND" });
    }
    if (tgtCol && edge.target) {
      filters.push({ column: tgtCol, operator: "contains", value: edge.target, logic: "AND" });
    }

    if (filters.length > 0) {
      state.setFilters(filters);
      hide();
    }
  });

  list.key(["escape", "L"], hide);

  return { widget: box, show, hide };
}

module.exports = { createLateralMovement };
