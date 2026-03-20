// IMPORTS
import {
  fetchJSON,
  el,
  clearHost,
  addHostClasses,
  renderHostTitle,
  renderHostMessage,
  titleCase
} from "../core/helpers.js";

// STATE
const DEFINITIONS_CLASS = "pane-host--risk-definitions";
const DEFINITIONS_URL = "data/riskDefinitions.json";

// BUILD
/** Builds the risk definitions table */
function buildDefinitionsTable(data) {
  const labels = data?.labels || {};
  const definitions = data?.definitions || {};
  const table = el("table", "rt-table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Factor", "Score", "Definition"].forEach((text) => {
    headRow.appendChild(el("th", "", text));
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  Object.entries(definitions).forEach(([factorKey, scoreMap]) => {
    Object.entries(scoreMap || {}).forEach(([score, description]) => {
      const row = document.createElement("tr");
      row.appendChild(el("td", "", labels[factorKey] || titleCase(factorKey)));
      row.appendChild(el("td", "", score));
      row.appendChild(el("td", "", description));
      tbody.appendChild(row);
    });
  });
  table.appendChild(tbody);
  return table;
}


/** Initializes the risk definitions pane */
function initRiskDefinitionsPane(host, settings) {
  const definitionsUrl = settings.definitionsUrl || DEFINITIONS_URL;
  fetchJSON(definitionsUrl).then((data) => {
    clearHost(host);
    renderHostTitle(host, "Risk Definitions", "rt-title");
    host.appendChild(buildDefinitionsTable(data || {}));
  }).catch((err) => {
    clearHost(host);
    renderHostMessage(host, String(err && (err.message || err)), "rt-error", true);
  });
  return { destroy() {} };
}


/** Builds the risk definitions pane */
export function buildRiskDefinitionsPane(options) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", DEFINITIONS_CLASS, "pane"]);
  const instance = initRiskDefinitionsPane(node, settings);
  return { node, destroy: instance.destroy };
}
