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
function buildDefinitionsTable(factor) {
  const table = el("table", "rt-table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Score", "Definition"].forEach((text) => {
    headRow.appendChild(el("th", "", text));
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  Object.entries(factor.scores || {}).forEach(([score, description]) => {
    const row = document.createElement("tr");
    row.appendChild(el("td", "", score));
    row.appendChild(el("td", "", description));
    tbody.appendChild(row);
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
    const groups = data?.groups || {};
    // --- Loop groups ---
    Object.values(groups).forEach((group) => {
      // Group title (Likelihood / Impact)
      host.appendChild(el("h4", "rt-group-title", group.label));
      Object.values(group.factors || {}).forEach((factor) => {
        // Factor title (Exploitability, etc)
        host.appendChild(el("h4", "rt-subtitle", factor.label));
        // Table
        host.appendChild(buildDefinitionsTable(factor));
      });
    });
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
