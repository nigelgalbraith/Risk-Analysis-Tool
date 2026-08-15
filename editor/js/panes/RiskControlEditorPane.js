// IMPORTS
import { el } from "../../../js/core/helpers.js";
import { linesText, textLines } from "../core/editorData.js";

// BUILD
function makeField(labelText, inputNode) {
  const wrap = el("div", "rd-field");
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
  const identityGroup = el("div", "editor-field-group");
  identityGroup.appendChild(el("h3", "rt-subtitle", "Control"));
  identityGroup.appendChild(makeField("ID", id));
  identityGroup.appendChild(makeField("Label", label));
  identityGroup.appendChild(makeField("Default", status));
  pane.appendChild(identityGroup);

  const likelihoodGroup = el("div", "editor-field-group");
  likelihoodGroup.appendChild(el("h3", "rt-subtitle", "Likelihood"));
  likelihoodGroup.appendChild(makeField("Exploitability", fields.exploitability));
  likelihoodGroup.appendChild(makeField("Exposure", fields.exposure));
  likelihoodGroup.appendChild(makeField("Prevalence", fields.prevalence));
  pane.appendChild(likelihoodGroup);

  const impactGroup = el("div", "editor-field-group");
  impactGroup.appendChild(el("h3", "rt-subtitle", "Impact"));
  impactGroup.appendChild(makeField("Confidentiality", fields.confidentiality));
  impactGroup.appendChild(makeField("Integrity", fields.integrity));
  impactGroup.appendChild(makeField("Availability", fields.availability));
  pane.appendChild(impactGroup);

  const notesGroup = el("div", "editor-field-group editor-field-group--wide");
  notesGroup.appendChild(el("h3", "rt-subtitle", "Pros and Cons"));
  notesGroup.appendChild(makeField("Pros", fields.pros));
  notesGroup.appendChild(makeField("Cons", fields.cons));
  pane.appendChild(notesGroup);
  const actionsRow = el("div", "re-actions");
  const apply = document.createElement("button");
  apply.type = "button";
  apply.className = "re-button";
  apply.textContent = "Apply Control Changes";
  apply.addEventListener("click", () => {
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
    actions.markDirty();
    actions.selectControl(row.id);
  });
  const save = document.createElement("button");
  save.type = "button";
  save.className = "re-button";
  save.textContent = "Save Risk Analysis";
  save.addEventListener("click", () => actions.saveSelectedRiskAnalysis());
  actionsRow.append(apply, save);
  pane.appendChild(actionsRow);
  host.appendChild(pane);
}
