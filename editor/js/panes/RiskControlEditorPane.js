// IMPORTS
import { el } from "../../../js/core/helpers.js";
import { linesText, textLines } from "../core/editorData.js";

// BUILD
function makeField(labelText, inputNode, options = {}) {
  const wrap = el("div", "rd-field" + (options.wide ? " form-field--wide" : ""));
  wrap.appendChild(el("label", "rd-label", labelText));
  wrap.appendChild(inputNode);
  return wrap;
}


function makeInput(value) {
  const input = document.createElement("input");
  input.className = "rd-input";
  input.type = "text";
  input.value = value ?? "";
  return input;
}


function makeNumber(value) {
  const input = makeInput(value);
  input.type = "number";
  input.min = "1";
  input.max = "5";
  input.step = "1";
  return input;
}


function makeTextarea(value) {
  const textarea = document.createElement("textarea");
  textarea.className = "rd-textarea";
  textarea.rows = 4;
  textarea.value = value || "";
  return textarea;
}


/** Renders the selected risk control editor */
export function renderRiskControlEditorPane({ state, host, actions }) {
  const rows = state.currentRiskRows || [];
  const row = rows.find((item) => item.id === state.selectedControlId);
  const pane = el("section", "pane editor-pane");
  pane.appendChild(el("h2", "rt-title", "Selected Control"));
  if (!row) {
    pane.appendChild(el("p", "", "Select a control to edit."));
    host.appendChild(pane);
    return;
  }
  const id = makeInput(row.id);
  const label = makeInput(row.label);
  const status = document.createElement("select");
  status.className = "rd-input";
  ["enabled", "disabled"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = row.default === value;
    status.appendChild(option);
  });
  const fields = {
    exploitability: makeNumber(row.likelihood?.exploitability),
    exposure: makeNumber(row.likelihood?.exposure),
    prevalence: makeNumber(row.likelihood?.prevalence),
    confidentiality: makeNumber(row.impact?.confidentiality),
    integrity: makeNumber(row.impact?.integrity),
    availability: makeNumber(row.impact?.availability),
    pros: makeTextarea(linesText(row.pros)),
    cons: makeTextarea(linesText(row.cons))
  };
  function applyControlChanges() {
    row.id = id.value.trim();
    row.label = label.value.trim();
    row.default = status.value;
    row.likelihood = {
      ...(row.likelihood || {}),
      exploitability: Number(fields.exploitability.value),
      exposure: Number(fields.exposure.value),
      prevalence: Number(fields.prevalence.value)
    };
    row.impact = {
      ...(row.impact || {}),
      confidentiality: Number(fields.confidentiality.value),
      integrity: Number(fields.integrity.value),
      availability: Number(fields.availability.value)
    };
    row.pros = textLines(fields.pros.value);
    row.cons = textLines(fields.cons.value);
    state.selectedControlId = row.id;
  }

  const identityGroup = el("div", "risk-value-grid");
  identityGroup.appendChild(el("h3", "rt-subtitle", "Control"));
  identityGroup.appendChild(makeField("ID", id));
  identityGroup.appendChild(makeField("Label", label));
  identityGroup.appendChild(makeField("Default", status));
  pane.appendChild(identityGroup);

  const likelihoodGroup = el("div", "risk-value-grid");
  likelihoodGroup.appendChild(el("h3", "rt-subtitle", "Likelihood"));
  likelihoodGroup.appendChild(makeField("Exploitability", fields.exploitability));
  likelihoodGroup.appendChild(makeField("Exposure", fields.exposure));
  likelihoodGroup.appendChild(makeField("Prevalence", fields.prevalence));
  pane.appendChild(likelihoodGroup);

  const impactGroup = el("div", "risk-value-grid");
  impactGroup.appendChild(el("h3", "rt-subtitle", "Impact"));
  impactGroup.appendChild(makeField("Confidentiality", fields.confidentiality));
  impactGroup.appendChild(makeField("Integrity", fields.integrity));
  impactGroup.appendChild(makeField("Availability", fields.availability));
  pane.appendChild(impactGroup);

  const notesGroup = el("div", "form-grid form-grid--single");
  notesGroup.appendChild(el("h3", "rt-subtitle", "Pros and Cons"));
  notesGroup.appendChild(makeField("Pros", fields.pros, { wide: true }));
  notesGroup.appendChild(makeField("Cons", fields.cons, { wide: true }));
  pane.appendChild(notesGroup);
  const actionsRow = el("div", "re-actions");
  const add = document.createElement("button");
  add.type = "button";
  add.className = "re-button";
  add.textContent = "Add Control";
  add.addEventListener("click", () => {
    applyControlChanges();
    actions.addControl();
  });
  actionsRow.appendChild(add);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "re-button re-button-muted";
  remove.textContent = "Remove Control";
  remove.disabled = rows.length <= 1;
  remove.addEventListener("click", () => actions.removeControl(row.id));
  actionsRow.appendChild(remove);
  const save = document.createElement("button");
  save.type = "button";
  save.className = "re-button";
  save.textContent = "Save Risk Assessment";
  save.addEventListener("click", () => {
    applyControlChanges();
    actions.markDirty();
    actions.saveSelectedRiskAnalysis();
  });
  actionsRow.appendChild(save);
  pane.appendChild(actionsRow);
  host.appendChild(pane);
}
