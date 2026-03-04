"use strict";

/**
 * format.js — Date/time and number formatting utilities
 */

function formatNumber(n) {
  if (n == null) return "";
  return Number(n).toLocaleString();
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
}

function formatPercent(value, total) {
  if (!total) return "0%";
  return ((value / total) * 100).toFixed(1) + "%";
}

function padRight(str, len) {
  str = String(str);
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

function padLeft(str, len) {
  str = String(str);
  return str.length >= len ? str.slice(0, len) : " ".repeat(len - str.length) + str;
}

function padCenter(str, len) {
  str = String(str);
  if (str.length >= len) return str.slice(0, len);
  const left = Math.floor((len - str.length) / 2);
  const right = len - str.length - left;
  return " ".repeat(left) + str + " ".repeat(right);
}

module.exports = { formatNumber, formatBytes, formatDuration, formatPercent, padRight, padLeft, padCenter };
