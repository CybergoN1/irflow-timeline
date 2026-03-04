"use strict";

/**
 * ascii-chart.js — Bar chart renderer using Unicode block characters
 */

const BLOCKS = [" ", "\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"]; // ▁▂▃▄▅▆▇█

/**
 * Render a horizontal bar of given fraction (0-1) using block chars
 */
function renderBar(fraction, width) {
  if (fraction <= 0) return " ".repeat(width);
  if (fraction >= 1) return BLOCKS[8].repeat(width);
  const filled = fraction * width;
  const full = Math.floor(filled);
  const partial = filled - full;
  const partialIdx = Math.round(partial * 8);
  let bar = BLOCKS[8].repeat(full);
  if (partialIdx > 0 && bar.length < width) bar += BLOCKS[partialIdx];
  return bar + " ".repeat(Math.max(0, width - bar.length));
}

/**
 * Render a vertical histogram from array of values
 * Returns array of strings (top to bottom)
 */
function renderHistogram(values, height, width) {
  if (!values.length) return [];
  const max = Math.max(...values, 1);
  const lines = [];

  for (let row = height - 1; row >= 0; row--) {
    let line = "";
    const threshold = (row / height) * max;
    for (let col = 0; col < Math.min(values.length, width); col++) {
      if (values[col] > threshold) {
        const fraction = Math.min(1, (values[col] - threshold) / (max / height));
        const idx = Math.min(8, Math.max(1, Math.round(fraction * 8)));
        line += BLOCKS[idx];
      } else {
        line += " ";
      }
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Render a simple bar chart for label-value pairs
 */
function renderBarChart(items, maxBarWidth = 40) {
  if (!items.length) return [];
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  const maxLabelLen = Math.max(...items.map((i) => String(i.label).length), 1);

  return items.map((item) => {
    const label = String(item.label).padEnd(maxLabelLen);
    const barLen = Math.round((item.value / maxVal) * maxBarWidth);
    const bar = BLOCKS[8].repeat(barLen);
    const count = String(item.value).padStart(8);
    return `${label} ${bar} ${count}`;
  });
}

module.exports = { BLOCKS, renderBar, renderHistogram, renderBarChart };
