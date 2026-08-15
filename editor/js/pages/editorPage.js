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
  hosts.mode.replaceChildren();
  hosts.side.replaceChildren();
  hosts.main.replaceChildren();
  renderEditorModePane({ state, host: hosts.mode, actions });
  if (state.mode === "add") {
    renderCreateRiskServicePane({ state, host: hosts.main, actions });
    return;
  }
  renderRiskServiceListPane({ state, host: hosts.side, actions });
  renderRiskControlEditorPane({ state, host: hosts.main, actions });
}


const actions = {
  createService,
  markDirty,
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
  hosts.mode = el("div", "editor-mode");
  hosts.side = el("aside", "editor-side");
  hosts.main = el("div", "editor-main");
  shell.contentHost.append(hosts.status, hosts.mode, hosts.side, hosts.main);
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
