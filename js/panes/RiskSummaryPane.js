// site/js/RiskSummaryPane.js
// PanesCore pane: data-pane="risk-summary"
// Shows total danger (sum of disabled control danger values) + message based on configured ranges.

import { Panes } from "../core/PanesCore.js";
import {
  loadState,
  fetchJSON,
  el,
  normalizeStatus,
  getDangerPercent
} from "../core/helpers.js";

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

function computeTotalDisabledDanger(rows, catState) {
  let total = 0;
  (rows || []).forEach((row) => {
    const id = String(row.id || "").trim();
    const defaultStatus = normalizeStatus(row.default);
    const saved = catState ? catState[id] : null;
    const status = normalizeStatus(saved != null ? saved : defaultStatus);
    /*
      Only disabled controls contribute danger.
      Enabled controls contribute 0%.
    */
    if (status !== "enabled") total += getDangerPercent(row);
  });
  if (total > 100) total = 100;
  return total;
}

function render(container, total, msgObj) {
  container.innerHTML = "";
  container.appendChild(el("h2", "rt-title", "Risk Summary"));

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

  container.appendChild(table);
}

function init(container, api) {
  const ds = container.dataset || {};
  const riskKey = ds.riskKey || "";
  const dataUrl = ds.dataUrl || "data/riskTables.json";
  const messagesUrl = ds.messagesUrl || "data/riskSummaryMessages.json";
  const storageKey = ds.storageKey || "riskAnalysisState.v1";

  if (!riskKey) {
    container.innerHTML = '<div class="rs-error">Missing data-risk-key.</div>';
    return { destroy() {} };
  }

  let rowsCache = null;
  let rangesCache = null;

  function rebuild() {
    const state = loadState(storageKey, {});
    const catState = (state && state[riskKey]) ? state[riskKey] : {};
    const total = computeTotalDisabledDanger(rowsCache || [], catState);
    const msgObj = findMessage(rangesCache || [], total);
    render(container, total, msgObj);
  }

  function loadAll() {
    return Promise.all([fetchJSON(dataUrl), fetchJSON(messagesUrl)]).then((res) => {
      const allTables = res[0] || {};
      rangesCache = res[1] || [];
      rowsCache = allTables[riskKey] || [];
      rebuild();
    }).catch((err) => {
      container.innerHTML = '<div class="rs-error">' + String(err && (err.message || err)) + "</div>";
    });
  }

  /*
    Live update: RiskTablePane emits "risk:changed" whenever a control is toggled.
    Rebuild from persisted state to stay consistent and simple.
  */
  const onChanged = function (ev) {
    if (!ev || !ev.detail || ev.detail.category !== riskKey) return;
    rebuild();
  };

  if (api && api.events && api.events.on) api.events.on("risk:changed", onChanged);

  loadAll();

  return { destroy() {} };
}

Panes.register("risk-summary", function (container, api) {
  container.classList.add("pane");
  container.classList.add("pane-host--risk-summary");
  return init(container, api);
});