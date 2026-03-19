// IMPORTS
import {
  loadState,
  saveState,
  fetchJSON,
  el,
  clearHost,
  addHostClasses,
  renderHostMessage,
  renderHostTitle,
  normalizeStatus,
  getRiskScore
} from "../core/helpers.js";

// STATE
const TABLE_CLASS = "pane-host--risk-table";
const TABLE_TITLE = "Risk Table";
const TABLE_DATA_URL = "data/riskTables.json";
const TABLE_STORAGE_KEY = "riskAnalysisState.v1";
const DEFINITIONS_DATA_URL = "data/riskDefinitions.json";

// BUILD
/** Gets or initializes state for a risk category */
function getOrCreateCategoryState(stateObj, categoryKey) {
  if (!stateObj[categoryKey] || typeof stateObj[categoryKey] !== "object") stateObj[categoryKey] = {};
  return stateObj[categoryKey];
}



/** Creates a list element from plain text items */
function makeList(items) {
  const ul = el("ul", "rt-list");
  (items || []).forEach((text) => {
    const li = document.createElement("li");
    li.textContent = String(text);
    ul.appendChild(li);
  });
  return ul;
}



/** Applies strike styling based on enabled status */
function applyStrike(prosCell, consCell, status) {
  const isEnabled = status === "enabled";
  if (prosCell) prosCell.classList.toggle("rt-strike", !isEnabled);
  if (consCell) consCell.classList.toggle("rt-strike", isEnabled);
}


/** Builds tooltip text for a full risk factors cell */
function buildRiskFactorTooltip(row, definitionsData) {
  const labels = definitionsData?.labels || {};
  const definitions = definitionsData?.definitions || {};
  const likelihood = row.likelihood || {};
  const impact = row.impact || {};
  const groups = [
    { title: "Likelihood", values: likelihood },
    { title: "Impact", values: impact }
  ];
  return groups.map((group) => {
    const lines = Object.entries(group.values).map(([key, score]) => {
      const label = labels[key] || key;
      const description = definitions[key]?.[String(score)] || "No definition available";
      return `${label}: ${score} — ${description}`;
    });
    return `${group.title}\n${lines.join("\n")}`;
  }).join("\n\n");
}


/** Initializes the risk table pane node */
function initRiskTablePane(host, settings, api) {
  const riskKey = settings.riskKey || settings.category || "";
  const title = settings.title || TABLE_TITLE;
  const dataUrl = settings.dataUrl || TABLE_DATA_URL;
  const storageKey = settings.storageKey || TABLE_STORAGE_KEY;
  clearHost(host);
  renderHostTitle(host, title, "rt-title");
  if (!riskKey) {
    renderHostMessage(host, 'Missing data-risk-key (e.g. data-risk-key="security").', "rt-error", false);
    return { destroy() {} };
  }
  const state = loadState(storageKey, {});
  const catState = getOrCreateCategoryState(state, riskKey);
  let destroyFns = [];
  /** Renders table rows for the configured risk key */
  function renderTable(defRows, definitionsData) {
    const table = el("table", "rt-table");
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["Control", "Status", "Pros", "Cons", "Risk Score"].forEach((name) => {
      trh.appendChild(el("th", "", name));
    });
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    (defRows || []).forEach((row) => {
      let id = String(row.id || "").trim();
      const label = String(row.label || row.name || id || "Unnamed");
      if (!id) id = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const defaultStatus = normalizeStatus(row.default);
      const saved = catState[id];
      const status = normalizeStatus(saved != null ? saved : defaultStatus);
      const tr = document.createElement("tr");
      tr.appendChild(el("td", "rt-control", label));
      const tdStatus = el("td", "rt-status");
      const groupName = "rt_" + riskKey + "_" + id;
      let tdPros = null;
      let tdCons = null;
      let tdRisk = null;
      const baseRisk = getRiskScore(row);
      /** Builds one status radio control */
      function makeRadio(value, text) {
        const lbl = el("label", "rt-radio");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = groupName;
        input.value = value;
        input.checked = status === value;
        const span = document.createElement("span");
        span.textContent = text;
        lbl.appendChild(input);
        lbl.appendChild(span);
        const onChange = function () {
          if (!input.checked) return;
          const newStatus = normalizeStatus(input.value);
          catState[id] = newStatus;
          saveState(storageKey, state);
          applyStrike(tdPros, tdCons, newStatus);
          if (tdRisk) {
            const score = newStatus === "enabled" ? 0 : baseRisk;
            tdRisk.textContent = String(score);
          }
          if (api && api.events && api.events.emit) api.events.emit("risk:changed", { category: riskKey, id, value: newStatus });
        };
        input.addEventListener("change", onChange);
        destroyFns.push(() => input.removeEventListener("change", onChange));
        return lbl;
      }
      tdStatus.appendChild(makeRadio("enabled", "Enabled"));
      tdStatus.appendChild(makeRadio("disabled", "Disabled"));
      tr.appendChild(tdStatus);
      tdPros = document.createElement("td");
      tdPros.appendChild(makeList(row.pros || []));
      tr.appendChild(tdPros);
      tdCons = document.createElement("td");
      tdCons.appendChild(makeList(row.cons || []));
      tr.appendChild(tdCons);
      applyStrike(tdPros, tdCons, status);
      const actualRisk = status === "enabled" ? 0 : baseRisk;
      tdRisk = el("td", "rt-riskScore", String(actualRisk));
      tdRisk.title = buildRiskFactorTooltip(row, definitionsData);
      tr.appendChild(tdRisk);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    host.appendChild(table);
  }
  Promise.all([
    fetchJSON(dataUrl),
    fetchJSON(DEFINITIONS_DATA_URL)
  ]).then(([allTables, definitionsData]) => {
    const rows = allTables && allTables[riskKey] ? allTables[riskKey] : null;

    if (!rows || rows.length === 0) {
      renderHostMessage(host, 'No rows found for "' + riskKey + '" in ' + dataUrl + ".", "rt-error", false);
      return;
    }

    renderTable(rows, definitionsData || {});
  }).catch((err) => {
    renderHostMessage(host, String(err && (err.message || err)), "rt-error", false);
  });
  return {
    destroy() {
      destroyFns.forEach((fn) => {
        try {
          fn();
        } catch (_e) {}
      });
      destroyFns = [];
    }
  };
}



/** Builds the risk table pane */
export function buildRiskTablePane(options, api) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", TABLE_CLASS, "pane"]);
  const instance = initRiskTablePane(node, settings, api || {});
  return { node, destroy: instance.destroy };
}
