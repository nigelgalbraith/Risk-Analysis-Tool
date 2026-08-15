// IMPORTS
import { el } from "../../../js/core/helpers.js";
import { createEditorPageRuntime } from "../core/pageRuntime.js";
import {
  clone,
  createEditorService,
  loadEditorRiskData,
  loadEditorRiskTable,
  saveEditorRiskTable
} from "../core/editorData.js";
import { hosts, state } from "../core/editorState.js";
import { renderCreateRiskServicePane } from "../panes/CreateRiskServicePane.js";
import { renderEditorModePane } from "../panes/EditorModePane.js";
import { renderRiskControlEditorPane } from "../panes/RiskControlEditorPane.js";
import { renderRiskServiceListPane } from "../panes/RiskServiceListPane.js";

// STATE
const PAGE_TITLE = "Risk Analysis Editor";

// BUILD
function defaultControlFromTitle(title) {
  const id = String(title || "new-control")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "new-control";
  return {
    id,
    label: title || "New Control",
    default: "disabled",
    likelihood: { exploitability: 3, exposure: 3, prevalence: 3 },
    impact: { confidentiality: 3, integrity: 3, availability: 3 },
    pros: ["Describe the benefit of enabling this control"],
    cons: ["Describe the risk or tradeoff if this control is missing"]
  };
}


function uniqueControlId(rows) {
  const ids = new Set((rows || []).map((row) => row?.id).filter(Boolean));
  let index = rows.length + 1;
  let control = defaultControlFromTitle("Control " + String(index));
  while (ids.has(control.id)) {
    index += 1;
    control = defaultControlFromTitle("Control " + String(index));
  }
  return control;
}


/** Shows editor status output */
function showStatus(message, type = "") {
  hosts.status.replaceChildren();
  if (!message) return;
  const box = el("div", "status-message" + (type ? " status-message--" + type : ""));
  String(message).split("\n").forEach((line) => box.appendChild(el("div", "", line)));
  hosts.status.appendChild(box);
}


/** Marks editor data as dirty */
function markDirty() {
  state.dirty = true;
  showStatus("Unsaved changes.");
}


/** Switches between editor workflows */
function setMode(mode) {
  state.mode = mode === "add" ? "add" : "edit";
  showStatus("");
  renderAll();
}


/** Loads the selected Risk Analysis rows */
async function loadSelectedRiskAnalysis() {
  if (!state.selectedService) {
    state.currentRiskRows = [];
    state.selectedControlId = "";
    return;
  }
  const rows = await loadEditorRiskTable(state.selectedService);
  state.currentRiskRows = clone(rows);
  state.selectedControlId = state.currentRiskRows[0]?.id || "";
}


/** Selects a Risk Analysis */
async function selectService(serviceId) {
  state.selectedService = serviceId;
  showStatus("Loading " + serviceId + "...");
  try {
    await loadSelectedRiskAnalysis();
    state.dirty = false;
    renderAll();
    showStatus("");
  } catch (error) {
    showStatus(error.message, "error");
  }
}


/** Selects a risk control */
function selectControl(controlId) {
  state.selectedControlId = controlId;
  renderAll();
}


/** Adds a new control to the current Risk Analysis in memory */
function addControl() {
  const rows = state.currentRiskRows || [];
  const control = uniqueControlId(rows);
  rows.push(control);
  state.currentRiskRows = rows;
  state.selectedControlId = control.id;
  markDirty();
  renderAll();
}


/** Removes a control from the current Risk Analysis in memory */
function removeControl(controlId) {
  const rows = state.currentRiskRows || [];
  if (rows.length <= 1) {
    showStatus("At least one risk control is required.", "error");
    return;
  }
  const index = rows.findIndex((row) => row.id === controlId);
  if (index < 0) return;
  rows.splice(index, 1);
  state.currentRiskRows = rows;
  state.selectedControlId = rows[Math.min(index, rows.length - 1)]?.id || "";
  markDirty();
  renderAll();
}


/** Saves only the selected Risk Analysis rows file */
async function saveSelectedRiskAnalysis() {
  if (!state.selectedService) return;
  showStatus("Saving " + state.selectedService + "...");
  try {
    await saveEditorRiskTable(state.selectedService, state.currentRiskRows || []);
    state.dirty = false;
    showStatus(state.selectedService + " saved. A backup was retained.", "success");
  } catch (error) {
    showStatus(error.message, "error");
  }
}


/** Reloads editor data after a successful API mutation */
async function reloadData() {
  const loaded = await loadEditorRiskData();
  state.data = clone(loaded);
}


/** Creates a new Risk Analysis and selects it for editing */
async function createService(payload) {
  showStatus("Creating Risk Analysis...");
  try {
    const result = await createEditorService(payload);
    await reloadData();
    state.lastCreatedServiceId = result.serviceId;
    state.mode = "edit";
    state.selectedService = result.serviceId;
    await loadSelectedRiskAnalysis();
    state.dirty = false;
    renderAll();
    showStatus("Risk Analysis created.", "success");
  } catch (error) {
    showStatus(error.message, "error");
  }
}


/** Renders all editor panes */
function renderAll() {
  hosts.main.replaceChildren();
  renderEditorModePane({ state, host: hosts.main, actions });
  if (state.mode === "add") {
    renderCreateRiskServicePane({ state, host: hosts.main, actions });
    return;
  }
  renderRiskServiceListPane({ state, host: hosts.main, actions });
  renderRiskControlEditorPane({ state, host: hosts.main, actions });
}


const actions = {
  addControl,
  createService,
  markDirty,
  removeControl,
  renderAll,
  saveSelectedRiskAnalysis,
  selectControl,
  selectService,
  setMode
};


/** Warns before discarding unsaved editor changes */
window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});


/** Initializes the editor page */
export async function initEditorPage() {
  const { shell } = createEditorPageRuntime({
    pageTitle: PAGE_TITLE,
    activeNavKey: "editor"
  });
  hosts.status = el("div", "editor-status");
  hosts.main = shell.contentHost;
  shell.header.after(hosts.status);
  showStatus("Loading editor data...");
  try {
    const loaded = await loadEditorRiskData();
    state.data = clone(loaded);
    state.selectedService = state.data.riskTables?.analyses?.[0]?.id || "";
    await loadSelectedRiskAnalysis();
    state.dirty = false;
    renderAll();
    showStatus("");
  } catch (error) {
    showStatus(error.message, "error");
  }
}
