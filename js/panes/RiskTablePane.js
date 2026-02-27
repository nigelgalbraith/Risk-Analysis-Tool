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
  getDangerPercent
} from "../core/helpers.js";

// STATE
const TABLE_CLASS = "pane-host--risk-table";
const TABLE_TITLE = "Risk Table";
const TABLE_DATA_URL = "data/riskTables.json";
const TABLE_STORAGE_KEY = "riskAnalysisState.v1";

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
  function renderTable(defRows) {
    const table = el("table", "rt-table");
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["Control", "Status", "Pros", "Cons", "Danger %"].forEach((name) => {
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
      let tdDanger = null;
      const baseDanger = getDangerPercent(row);
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
          if (tdDanger) tdDanger.textContent = (newStatus === "enabled" ? 0 : baseDanger) + "%";
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
      const actualDanger = status === "enabled" ? 0 : baseDanger;
      tdDanger = el("td", "rt-danger", String(actualDanger) + "%");
      tr.appendChild(tdDanger);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    host.appendChild(table);
  }
  fetchJSON(dataUrl).then((allTables) => {
    const rows = allTables && allTables[riskKey] ? allTables[riskKey] : null;
    if (!rows || rows.length === 0) {
      renderHostMessage(host, 'No rows found for "' + riskKey + '" in ' + dataUrl + ".", "rt-error", false);
      return;
    }
    renderTable(rows);
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
