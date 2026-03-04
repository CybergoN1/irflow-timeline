"use strict";

/**
 * truncate.js — Smart column text truncation
 */

function truncate(str, maxLen) {
  if (str == null) return "";
  str = String(str);
  if (str.length <= maxLen) return str;
  if (maxLen <= 3) return str.slice(0, maxLen);
  return str.slice(0, maxLen - 1) + "\u2026";  // ellipsis
}

/**
 * Calculate optimal column widths based on content
 */
function calculateColumnWidths(headers, rows, maxTotalWidth, minColWidth = 6, maxColWidth = 60) {
  const widths = {};
  for (const h of headers) {
    widths[h] = Math.max(minColWidth, h.length + 2);
  }

  // Sample first ~100 rows to estimate width needs
  const sample = rows.slice(0, 100);
  for (const row of sample) {
    for (const h of headers) {
      const val = String(row[h] || "");
      widths[h] = Math.max(widths[h], Math.min(val.length + 2, maxColWidth));
    }
  }

  // Cap each column
  for (const h of headers) {
    widths[h] = Math.min(widths[h], maxColWidth);
  }

  // If total exceeds maxTotalWidth, proportionally shrink
  const total = headers.reduce((s, h) => s + widths[h], 0);
  if (total > maxTotalWidth && maxTotalWidth > 0) {
    const ratio = maxTotalWidth / total;
    for (const h of headers) {
      widths[h] = Math.max(minColWidth, Math.floor(widths[h] * ratio));
    }
  }

  return widths;
}

module.exports = { truncate, calculateColumnWidths };
