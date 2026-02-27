export const NOOP_PANE = Object.freeze({ destroy() {} });


export function safeJSONParse(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return fallback;
  }
}


export function loadState(storageKey, fallback = {}) {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return fallback;
  return safeJSONParse(raw, fallback);
}


export function saveState(storageKey, stateObj) {
  window.localStorage.setItem(storageKey, JSON.stringify(stateObj));
}


export async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load JSON: ${url} (${res.status})`);
  return res.json();
}


export function el(tag, cls = "", text = "") {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null && text !== "") node.textContent = String(text);
  return node;
}


export function clearHost(host) {
  host.innerHTML = "";
  return host;
}


export function addHostClasses(host, classes) {
  (classes || []).forEach((name) => {
    if (name) host.classList.add(name);
  });
  return host;
}


export function renderHostMessage(host, message, className, replace = true, tag = "div") {
  if (replace) clearHost(host);
  const box = el(tag, className, message);
  host.appendChild(box);
  return box;
}


export function renderHostTitle(host, title, className = "rt-title") {
  const heading = el("h2", className, title);
  host.appendChild(heading);
  return heading;
}


export function normalizeStatus(value) {
  return value === "enabled" ? "enabled" : "disabled";
}


export function getDangerPercent(row) {
  const n = Number(row && row.danger);
  if (!isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}
