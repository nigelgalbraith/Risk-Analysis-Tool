// site/js/RiskTablePane.js
// PanesCore pane: data-pane="risk-table"
// Loads risk control definitions from JSON and persists user selections in localStorage.

import { Panes } from "../core/PanesCore.js";
import {
  loadState,
  saveState,
  fetchJSON,
  el,
  normalizeStatus,
  getDangerPercent
} from "../core/helpers.js";

/* Ensures category state exists and returns it. */
function getOrCreateCategoryState(stateObj, categoryKey) {
  if (!stateObj[categoryKey] || typeof stateObj[categoryKey] !== "object") stateObj[categoryKey] = {};
  return stateObj[categoryKey];
}

/* Renders a bullet list from an array of strings. */
function makeList(items) {
  const ul = el("ul", "rt-list");
  (items || []).forEach((t) => {
    const li = document.createElement("li");
    li.textContent = String(t);
    ul.appendChild(li);
  });
  return ul;
}

/**
 * Applies strike styling:
 *  - Pros struck when control is disabled
 *  - Cons struck when control is enabled
 */
function applyStrike(prosCell, consCell, status) {
  const isEnabled = status === "enabled";
  if (prosCell) prosCell.classList.toggle("rt-strike", !isEnabled);
  if (consCell) consCell.classList.toggle("rt-strike", isEnabled);
}

/**
 * Initializes the risk table pane inside the given container.
 *
 * Data attributes supported:
 *  - data-risk-key   (required): key used to select a table from the JSON file
 *  - data-title      (optional): table title shown above the table
 *  - data-data-url   (optional): JSON source (default: data/riskTables.json)
 *  - data-storage-key(optional): localStorage key for persistence
 */
function init(container, api) {
  const ds = container.dataset || {};
  const riskKey = ds.riskKey || ds.category || "";
  const title = ds.title || "Risk Table";
  const dataUrl = ds.dataUrl || "data/riskTables.json";
  const storageKey = ds.storageKey || "riskAnalysisState.v1";

  container.innerHTML = "";
  container.appendChild(el("h2", "rt-title", title));

  if (!riskKey) {
    const warn = el("div", "rt-error");
    warn.textContent = 'Missing data-risk-key (e.g. data-risk-key="security").';
    container.appendChild(warn);
    return { destroy() {} };
  }

  /* Persistent state structure:
      state[categoryKey][controlId] = "enabled" | "disabled" */
  const state = loadState(storageKey, {});
  const catState = getOrCreateCategoryState(state, riskKey);

  /* destroyFns stores cleanup handlers for all event listeners.*/
  let destroyFns = [];

  function renderTable(defRows) {
    const table = el("table", "rt-table");

    /* Table header. */
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["Control", "Status", "Pros", "Cons", "Danger %"].forEach((name) => {
      trh.appendChild(el("th", "", name));
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    /* Table body. */
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

      /* Status radios. */
      const tdStatus = el("td", "rt-status");
      const groupName = "rt_" + riskKey + "_" + id;

      let tdPros = null;
      let tdCons = null;
      let tdDanger = null;
      const baseDanger = getDangerPercent(row);

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
          /* Optional event hook for downstream panes (e.g., future risk matrix).*/
          if (api && api.events && api.events.emit) {
            api.events.emit("risk:changed", { category: riskKey, id, value: newStatus });
          }
        };

        input.addEventListener("change", onChange);
        destroyFns.push(() => input.removeEventListener("change", onChange));
        return lbl;
      }

      tdStatus.appendChild(makeRadio("enabled", "Enabled"));
      tdStatus.appendChild(makeRadio("disabled", "Disabled"));
      tr.appendChild(tdStatus);

      /* Pros / Cons cells. */
      tdPros = document.createElement("td");
      tdPros.appendChild(makeList(row.pros || []));
      tr.appendChild(tdPros);

      tdCons = document.createElement("td");
      tdCons.appendChild(makeList(row.cons || []));
      tr.appendChild(tdCons);

      applyStrike(tdPros, tdCons, status);

      /* Danger column (0 if enabled, JSON value if disabled). */
      const actualDanger = status === "enabled" ? 0 : baseDanger;
      tdDanger = el("td", "rt-danger", String(actualDanger) + "%");
      tr.appendChild(tdDanger);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }

  fetchJSON(dataUrl).then((allTables) => {
    const rows = allTables && allTables[riskKey] ? allTables[riskKey] : null;
    if (!rows || rows.length === 0) {
      const empty = el("div", "rt-error");
      empty.textContent = 'No rows found for "' + riskKey + '" in ' + dataUrl + ".";
      container.appendChild(empty);
      return;
    }
    renderTable(rows);
  }).catch((err) => {
    const box = el("div", "rt-error");
    box.textContent = String(err && (err.message || err));
    container.appendChild(box);
  });

  return {
    destroy() {
      destroyFns.forEach((fn) => { try { fn(); } catch (_e) {} });
      destroyFns = [];
    }
  };
}

/* Pane registration entry point. */
Panes.register("risk-table", function (container, api) {
  container.classList.add("pane");
  container.classList.add("pane-host--risk-table");
  return init(container, api);
});