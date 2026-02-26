// js/core/helpers.js
// -----------------------------------------------------------------------------
// Shared helper utilities used across panes.
//
// Purpose:
//   - Eliminate duplicated utility logic
//   - Keep panes focused on rendering + behaviour
//   - Provide safe, small, dependency-free helpers
//
// NOTE:
//   This is an ES module. Import what you need from panes/pages.
// -----------------------------------------------------------------------------

/* Parses JSON safely with a fallback value. */
export function safeJSONParse(raw, fallback = null) {
  try { return JSON.parse(raw); } catch (_e) { return fallback; }
}

/* Loads persisted state from localStorage. */
export function loadState(storageKey, fallback = {}) {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return fallback;
  return safeJSONParse(raw, fallback);
}

/* Saves state to localStorage. */
export function saveState(storageKey, stateObj) {
  window.localStorage.setItem(storageKey, JSON.stringify(stateObj));
}

/* Fetches JSON from a URL and returns a parsed object. */
export async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load JSON: ${url} (${res.status})`);
  return res.json();
}

/* Creates a DOM element with optional class and text. */
export function el(tag, cls = "", text = "") {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null && text !== "") n.textContent = String(text);
  return n;
}

/* Normalizes status values to the supported set. */
export function normalizeStatus(value) {
  return value === "enabled" ? "enabled" : "disabled";
}

/* Extracts a numeric danger percentage (0–100) from a row. */
export function getDangerPercent(row) {
  const n = Number(row && row.danger);
  if (!isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}