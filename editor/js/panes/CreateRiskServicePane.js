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


function makeInput(value = "") {
  const input = document.createElement("input");
  input.className = "rd-input";
  input.type = "text";
  input.value = value;
  return input;
}


function makeNumber(value) {
  const input = makeInput(String(value));
  input.type = "number";
  input.min = "1";
  input.max = "5";
  input.step = "1";
  return input;
}


function makeTextarea(value = "") {
  const textarea = document.createElement("textarea");
  textarea.className = "rd-textarea";
  textarea.rows = 4;
  textarea.value = value;
  return textarea;
}


function makeControlDraft(index) {
  const labelText = index === 1 ? "First Control" : "Control " + String(index);
  const controlLabel = makeInput(labelText);
  const controlId = makeInput(defaultControlFromTitle(labelText).id);
  const status = document.createElement("select");
  status.className = "rd-input";
  ["disabled", "enabled"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    status.appendChild(option);
  });
  const scores = {
    exploitability: makeNumber(3),
    exposure: makeNumber(3),
    prevalence: makeNumber(3),
    confidentiality: makeNumber(3),
    integrity: makeNumber(3),
    availability: makeNumber(3)
  };
  const defaults = defaultControlFromTitle(labelText);
  const pros = makeTextarea(linesText(defaults.pros));
  const cons = makeTextarea(linesText(defaults.cons));
  controlLabel.addEventListener("input", () => {
    if (controlId.dataset.touched === "true") return;
    controlId.value = defaultControlFromTitle(controlLabel.value).id;
  });
  controlId.addEventListener("input", () => {
    controlId.dataset.touched = "true";
  });
  return { controlId, controlLabel, status, scores, pros, cons };
}


function controlPayloadFromDraft(draft) {
  return {
    id: draft.controlId.value.trim(),
    label: draft.controlLabel.value.trim(),
    default: draft.status.value,
    likelihood: {
      exploitability: Number(draft.scores.exploitability.value),
      exposure: Number(draft.scores.exposure.value),
      prevalence: Number(draft.scores.prevalence.value)
    },
    impact: {
      confidentiality: Number(draft.scores.confidentiality.value),
      integrity: Number(draft.scores.integrity.value),
      availability: Number(draft.scores.availability.value)
    },
    pros: textLines(draft.pros.value),
    cons: textLines(draft.cons.value)
  };
}


function defaultControlFromTitle(title) {
  const id = String(title || "first-control")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "first-control";
  return {
    id,
    label: title || "First Control",
    default: "disabled",
    likelihood: { exploitability: 3, exposure: 3, prevalence: 3 },
    impact: { confidentiality: 3, integrity: 3, availability: 3 },
    pros: ["Describe the benefit of enabling this control"],
    cons: ["Describe the risk or tradeoff if this control is missing"]
  };
}


/** Renders the create-new Risk Analysis pane */
export function renderCreateRiskServicePane({ host, actions }) {
  const pane = el("section", "pane editor-pane");
  pane.appendChild(el("h2", "rt-title", "Add New Risk Analysis"));
  const serviceId = makeInput("");
  const title = makeInput("New Risk Analysis");
  const description = makeTextarea("Describe what this Risk Analysis helps review.");
  let nextControlNumber = 2;
  const controlDrafts = [makeControlDraft(1)];
  const controlsHost = el("div", "editor-controls");
  const identityGroup = el("div", "form-grid");
  identityGroup.appendChild(el("h3", "rt-subtitle", "Risk Analysis"));
  identityGroup.appendChild(makeField("Risk Analysis ID", serviceId));
  identityGroup.appendChild(makeField("Title", title));
  identityGroup.appendChild(makeField("Description", description, { wide: true }));
  pane.appendChild(identityGroup);

  function renderControlDrafts() {
    controlsHost.replaceChildren();
    controlDrafts.forEach((draft, index) => {
      const controlSection = el("section", "editor-control-group");
      controlSection.appendChild(el("h3", "rt-subtitle editor-control-title", "Control " + String(index + 1)));

      const controlGroup = el("div", "risk-value-grid");
      controlGroup.appendChild(el("h3", "rt-subtitle", "Control"));
      controlGroup.appendChild(makeField("ID", draft.controlId));
      controlGroup.appendChild(makeField("Label", draft.controlLabel));
      controlGroup.appendChild(makeField("Default", draft.status));
      controlSection.appendChild(controlGroup);

      const likelihoodGroup = el("div", "risk-value-grid");
      likelihoodGroup.appendChild(el("h3", "rt-subtitle", "Likelihood"));
      likelihoodGroup.appendChild(makeField("Exploitability", draft.scores.exploitability));
      likelihoodGroup.appendChild(makeField("Exposure", draft.scores.exposure));
      likelihoodGroup.appendChild(makeField("Prevalence", draft.scores.prevalence));
      controlSection.appendChild(likelihoodGroup);

      const impactGroup = el("div", "risk-value-grid");
      impactGroup.appendChild(el("h3", "rt-subtitle", "Impact"));
      impactGroup.appendChild(makeField("Confidentiality", draft.scores.confidentiality));
      impactGroup.appendChild(makeField("Integrity", draft.scores.integrity));
      impactGroup.appendChild(makeField("Availability", draft.scores.availability));
      controlSection.appendChild(impactGroup);

      const notesGroup = el("div", "form-grid form-grid--single");
      notesGroup.appendChild(el("h3", "rt-subtitle", "Pros and Cons"));
      notesGroup.appendChild(makeField("Pros", draft.pros, { wide: true }));
      notesGroup.appendChild(makeField("Cons", draft.cons, { wide: true }));
      controlSection.appendChild(notesGroup);

      controlsHost.appendChild(controlSection);
    });
  }

  renderControlDrafts();
  pane.appendChild(controlsHost);

  const actionsRow = el("div", "re-actions");
  const addControl = document.createElement("button");
  addControl.type = "button";
  addControl.className = "re-button re-button-add";
  addControl.textContent = "Add Control";
  addControl.addEventListener("click", () => {
    controlDrafts.push(makeControlDraft(nextControlNumber));
    nextControlNumber += 1;
    renderControlDrafts();
    removeControl.disabled = false;
  });
  actionsRow.appendChild(addControl);
  const removeControl = document.createElement("button");
  removeControl.type = "button";
  removeControl.className = "re-button re-button-remove";
  removeControl.textContent = "Remove Control";
  removeControl.disabled = controlDrafts.length <= 1;
  removeControl.addEventListener("click", () => {
    if (controlDrafts.length <= 1) return;
    controlDrafts.pop();
    renderControlDrafts();
    removeControl.disabled = controlDrafts.length <= 1;
  });
  actionsRow.appendChild(removeControl);
  const create = document.createElement("button");
  create.type = "button";
  create.className = "re-button re-button-save";
  create.textContent = "Save Risk Assessment";
  create.addEventListener("click", () => {
    actions.createService({
      serviceId: serviceId.value.trim(),
      title: title.value.trim(),
      description: description.value,
      controls: controlDrafts.map(controlPayloadFromDraft)
    });
  });
  actionsRow.appendChild(create);
  pane.appendChild(actionsRow);
  host.appendChild(pane);
}
