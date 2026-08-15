// IMPORTS
import { el } from "../../../js/core/helpers.js";

// BUILD
/** Renders Risk Analysis and control selection */
export function renderRiskServiceListPane({ state, host, actions }) {
  host.replaceChildren();
  const pane = el("section", "pane editor-pane");
  pane.appendChild(el("h2", "rt-title", "Edit Existing Risk Analysis"));
  pane.appendChild(el("label", "rd-label", "Select Risk Analysis"));
  const analyses = state.data?.riskTables?.analyses || [];
  const serviceSelect = document.createElement("select");
  serviceSelect.className = "rd-input";
  analyses.forEach((analysis) => {
    const serviceId = analysis?.id || "";
    const option = document.createElement("option");
    option.value = serviceId;
    option.textContent = analysis?.title || serviceId;
    option.selected = serviceId === state.selectedService;
    serviceSelect.appendChild(option);
  });
  serviceSelect.addEventListener("change", () => actions.selectService(serviceSelect.value));
  pane.appendChild(serviceSelect);
  pane.appendChild(el("h3", "rt-subtitle", "Controls"));
  const list = el("div", "editor-list");
  const rows = state.currentRiskRows || [];
  rows.forEach((row) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "re-button" + (row.id === state.selectedControlId ? " editor-selected" : "");
    button.textContent = row.label || row.id;
    button.addEventListener("click", () => actions.selectControl(row.id));
    list.appendChild(button);
  });
  pane.appendChild(list);
  host.appendChild(pane);
}
