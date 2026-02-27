// IMPORTS
import {
  loadState,
  fetchJSON,
  el,
  clearHost,
  addHostClasses,
  renderHostMessage,
  renderHostTitle,
  normalizeStatus,
  getDangerPercent
} from "../core/helpers.js";

// STATE
const SUMMARY_CLASS = "pane-host--risk-summary";
const SUMMARY_DATA_URL = "data/riskTables.json";
const SUMMARY_MESSAGES_URL = "data/riskSummaryMessages.json";
const SUMMARY_STORAGE_KEY = "riskAnalysisState.v1";

// BUILD
/** Finds the matching summary message range */
function findMessage(ranges, total) {
  for (let i = 0; i < (ranges || []).length; i++) {
    const r = ranges[i] || {};
    let min = Number(r.min);
    let max = Number(r.max);
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 100;
    if (total >= min && total <= max) return r;
  }
  return null;
}



/** Computes total disabled danger percentage */
function computeTotalDisabledDanger(rows, catState) {
  let total = 0;
  (rows || []).forEach((row) => {
    const id = String(row.id || "").trim();
    const defaultStatus = normalizeStatus(row.default);
    const saved = catState ? catState[id] : null;
    const status = normalizeStatus(saved != null ? saved : defaultStatus);
    if (status !== "enabled") total += getDangerPercent(row);
  });
  if (total > 100) total = 100;
  return total;
}



/** Renders summary table content */
function renderSummary(host, total, msgObj) {
  clearHost(host);
  renderHostTitle(host, "Risk Summary", "rt-title");
  const table = el("table", "rt-table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Message", "Risk Level", "Total Danger"].forEach((text) => {
    headRow.appendChild(el("th", "", text));
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  const bodyRow = document.createElement("tr");
  bodyRow.appendChild(el("td", "rs-message", msgObj && msgObj.message ? msgObj.message : ""));
  bodyRow.appendChild(el("td", "rs-level", msgObj && msgObj.title ? msgObj.title : ""));
  bodyRow.appendChild(el("td", "rs-total", String(total) + "%"));
  tbody.appendChild(bodyRow);
  table.appendChild(tbody);
  host.appendChild(table);
}



/** Initializes the risk summary pane node */
function initRiskSummaryPane(host, settings, api) {
  const riskKey = settings.riskKey || "";
  const dataUrl = settings.dataUrl || SUMMARY_DATA_URL;
  const messagesUrl = settings.messagesUrl || SUMMARY_MESSAGES_URL;
  const storageKey = settings.storageKey || SUMMARY_STORAGE_KEY;
  if (!riskKey) {
    renderHostMessage(host, "Missing data-risk-key.", "rs-error", true);
    return { destroy() {} };
  }
  let rowsCache = null;
  let rangesCache = null;
  /** Rebuilds summary output from current state and cache */
  function rebuild() {
    const state = loadState(storageKey, {});
    const catState = (state && state[riskKey]) ? state[riskKey] : {};
    const total = computeTotalDisabledDanger(rowsCache || [], catState);
    const msgObj = findMessage(rangesCache || [], total);
    renderSummary(host, total, msgObj);
  }
  /** Loads source data used by summary rendering */
  function loadAll() {
    return Promise.all([fetchJSON(dataUrl), fetchJSON(messagesUrl)]).then((res) => {
      const allTables = res[0] || {};
      rangesCache = res[1] || [];
      rowsCache = allTables[riskKey] || [];
      rebuild();
    }).catch((err) => {
      renderHostMessage(host, String(err && (err.message || err)), "rs-error", true);
    });
  }
  const onChanged = function (ev) {
    if (!ev || !ev.detail || ev.detail.category !== riskKey) return;
    rebuild();
  };
  const offChanged = (api && api.events && api.events.on) ? api.events.on("risk:changed", onChanged) : null;
  if (api && api.lifecycle && api.lifecycle.add && typeof offChanged === "function") api.lifecycle.add(offChanged);
  loadAll();
  return {
    destroy() {
      if (typeof offChanged === "function") offChanged();
    }
  };
}



/** Builds the risk summary pane */
export function buildRiskSummaryPane(options, api) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", SUMMARY_CLASS, "pane"]);
  const instance = initRiskSummaryPane(node, settings, api || {});
  return { node, destroy: instance.destroy };
}
