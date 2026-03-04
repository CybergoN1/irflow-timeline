"use strict";

/**
 * color-mapper.js — Hex color to terminal 256-color nearest match
 */

// Standard 256-color palette (indices 16-231 are a 6x6x6 color cube)
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbTo256(r, g, b) {
  // Map 0-255 to 0-5 for the 6x6x6 cube
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);
  return 16 + (36 * ri) + (6 * gi) + bi;
}

function hexTo256(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbTo256(r, g, b);
}

/**
 * Build blessed-compatible style from a color rule
 */
function colorRuleToStyle(rule) {
  const style = {};
  if (rule.fg) style.fg = rule.fg;
  if (rule.bg) style.bg = rule.bg;
  if (rule.bold) style.bold = true;
  return style;
}

module.exports = { hexToRgb, rgbTo256, hexTo256, colorRuleToStyle };
