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
  const controlLabel = makeInput("First Control");
  const controlId = makeInput("first-control");
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
  const pros = makeTextarea(linesText(defaultControlFromTitle("").pros));
  const cons = makeTextarea(linesText(defaultControlFromTitle("").cons));
  controlLabel.addEventListener("input", () => {
    if (controlId.dataset.touched === "true") return;
    controlId.value = defaultControlFromTitle(controlLabel.value).id;
  });
  controlId.addEventListener("input", () => {
    controlId.dataset.touched = "true";
  });
  const identityGroup = el("div", "editor-field-group");
  identityGroup.appendChild(el("h3", "rt-subtitle", "Risk Analysis"));
  identityGroup.appendChild(makeField("Risk Analysis ID", serviceId));
  identityGroup.appendChild(makeField("Title", title));
  identityGroup.appendChild(makeField("Description", description));
  pane.appendChild(identityGroup);

  const controlGroup = el("div", "editor-field-group");
  controlGroup.appendChild(el("h3", "rt-subtitle", "Initial Control"));
  controlGroup.appendChild(makeField("Control ID", controlId));
  controlGroup.appendChild(makeField("Control label", controlLabel));
  controlGroup.appendChild(makeField("Default", status));
  pane.appendChild(controlGroup);

  const likelihoodGroup = el("div", "editor-field-group");
  likelihoodGroup.appendChild(el("h3", "rt-subtitle", "Likelihood"));
  likelihoodGroup.appendChild(makeField("Exploitability", scores.exploitability));
  likelihoodGroup.appendChild(makeField("Exposure", scores.exposure));
  likelihoodGroup.appendChild(makeField("Prevalence", scores.prevalence));
  pane.appendChild(likelihoodGroup);

  const impactGroup = el("div", "editor-field-group");
  impactGroup.appendChild(el("h3", "rt-subtitle", "Impact"));
  impactGroup.appendChild(makeField("Confidentiality", scores.confidentiality));
  impactGroup.appendChild(makeField("Integrity", scores.integrity));
  impactGroup.appendChild(makeField("Availability", scores.availability));
  pane.appendChild(impactGroup);

  const notesGroup = el("div", "editor-field-group editor-field-group--wide");
  notesGroup.appendChild(el("h3", "rt-subtitle", "Pros and Cons"));
  notesGroup.appendChild(makeField("Pros", pros));
  notesGroup.appendChild(makeField("Cons", cons));
  pane.appendChild(notesGroup);
  const create = document.createElement("button");
  create.type = "button";
  create.className = "re-button";
  create.textContent = "Create Risk Analysis";
  create.addEventListener("click", () => {
    actions.createService({
      serviceId: serviceId.value.trim(),
      title: title.value.trim(),
      description: description.value,
      controls: [{
        id: controlId.value.trim(),
        label: controlLabel.value.trim(),
        default: status.value,
        likelihood: {
          exploitability: Number(scores.exploitability.value),
          exposure: Number(scores.exposure.value),
          prevalence: Number(scores.prevalence.value)
        },
        impact: {
          confidentiality: Number(scores.confidentiality.value),
          integrity: Number(scores.integrity.value),
          availability: Number(scores.availability.value)
        },
        pros: textLines(pros.value),
        cons: textLines(cons.value)
      }]
    });
  });
  pane.appendChild(create);
  host.appendChild(pane);
}
