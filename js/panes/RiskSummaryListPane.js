// IMPORTS
import {
  fetchJSON,
  el,
  clearHost,
  addHostClasses,
  renderHostTitle,
  renderHostMessage
} from "../core/helpers.js";

// STATE
const SUMMARY_LIST_CLASS = "pane-host--risk-summary";
const SUMMARY_URL = "data/riskSummaryMessages.json";

// BUILD
/** Builds the risk summary messages table */
function buildSummaryTable(messages) {
  const table = el("table", "rt-table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Level", "Min", "Max", "Message"].forEach((text) => {
    headRow.appendChild(el("th", "", text));
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  (messages || []).forEach((item) => {
    const row = document.createElement("tr");
    const levelCell = el("td", "", item.title || "");
    if (item.color) {
      levelCell.style.color = item.color;
      levelCell.style.fontWeight = "bold";
    }
    row.appendChild(levelCell);
    row.appendChild(el("td", "", String(item.minRatio ?? "")));
    row.appendChild(el("td", "", String(item.maxRatio ?? "")));
    row.appendChild(el("td", "", item.message || ""));
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
}


/** Initializes the risk summary list pane */
function initRiskSummaryListPane(host, settings) {
  const summaryUrl = settings.summaryUrl || SUMMARY_URL;
  fetchJSON(summaryUrl).then((messages) => {
    clearHost(host);
    renderHostTitle(host, "Risk Summary Messages", "rt-title");
    host.appendChild(buildSummaryTable(messages || []));
  }).catch((err) => {
    clearHost(host);
    renderHostMessage(host, String(err && (err.message || err)), "rt-error", true);
  });
  return { destroy() {} };
}


/** Builds the risk summary list pane */
export function buildRiskSummaryListPane(options) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", SUMMARY_LIST_CLASS, "pane"]);
  const instance = initRiskSummaryListPane(node, settings);
  return { node, destroy: instance.destroy };
}
