// IMPORTS
import { validateRiskAnalysisRows } from "../../../js/core/riskValidation.js";

// BUILD
/** Clones JSON-compatible values */
export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}


/** Requests JSON from the editor API */
export async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const messages = data.errors || [data.error || "Request failed (" + response.status + ")."];
    throw new Error(messages.join("\n"));
  }
  return data;
}


/** Loads the editable Risk Analysis registry */
export function loadEditorRiskData() {
  return requestJson("../api/editor/risk-tables").then((riskTables) => ({ riskTables }));
}


/** Loads one Risk Analysis rows file */
export function loadEditorRiskTable(serviceId) {
  return requestJson("../api/editor/risk-tables/" + encodeURIComponent(serviceId));
}


/** Saves one Risk Analysis rows file */
export async function saveEditorRiskTable(serviceId, rows) {
  const errors = validateRiskAnalysisRows(rows, serviceId);
  if (errors.length) throw new Error(errors.join("\n"));
  return requestJson("../api/editor/risk-tables/" + encodeURIComponent(serviceId), {
    method: "POST",
    body: JSON.stringify({ data: rows })
  });
}


/** Creates a new Risk Analysis through the editor API */
export function createEditorService(payload) {
  return requestJson("../api/editor/risk-tables", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}


/** Converts textarea content to trimmed non-empty lines */
export function textLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}


/** Converts a list to textarea text */
export function linesText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}
