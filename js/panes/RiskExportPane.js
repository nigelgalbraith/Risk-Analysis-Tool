// IMPORTS
import {
  el,
  clearHost,
  addHostClasses,
  renderHostTitle
} from "../core/helpers.js";

// STATE
const EXPORT_CLASS = "pane-host--risk-export";

// BUILD
/** Initializes the export pane */
function initRiskExportPane(host, settings) {
  const title = settings.title || "Export";
  const backUrl = settings.backUrl || "index.html";
  clearHost(host);
  renderHostTitle(host, title, "rt-title");

  const actions = el("div", "re-actions");

  const printButton = document.createElement("button");
  printButton.className = "re-button";
  printButton.textContent = "Print / Save PDF";
  printButton.addEventListener("click", function () {
    window.print();
  });

  const backButton = document.createElement("button");
  backButton.className = "re-button re-button-muted";
  backButton.textContent = "Back";
  backButton.addEventListener("click", function () {
    window.location.href = backUrl;
  });

  actions.appendChild(printButton);
  actions.appendChild(backButton);
  host.appendChild(actions);

  return { destroy() {} };
}


/** Builds the export pane host */
export function buildRiskExportPane(options) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", EXPORT_CLASS, "pane"]);
  const instance = initRiskExportPane(node, settings);
  return { node, destroy: instance.destroy };
}