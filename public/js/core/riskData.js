// STATE
const DATA_URLS = Object.freeze({
  riskTables: "data/riskTables.json",
  riskDefinitions: "data/riskDefinitions.json",
  riskSummaryMessages: "data/riskSummaryMessages.json"
});
const SAFE_RISK_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
let riskRegistryPromise = null;
const riskTablePromises = new Map();

// BUILD
/** Fetches JSON without using a cached response */
async function fetchJSON(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load " + url + " (" + response.status + ")");
  }
  return response.json();
}


/** Loads one editor-managed risk definition dataset */
export async function loadRiskDataset(name) {
  const url = DATA_URLS[name];
  if (!url) throw new Error("Unknown risk dataset: " + name);
  return fetchJSON(url);
}


/** Loads all risk control tables */
export function loadRiskTables() {
  return loadRiskDataset("riskTables");
}


/** Loads the registry of available Risk Analysis IDs */
export async function loadRiskTableRegistry() {
  if (!riskRegistryPromise) riskRegistryPromise = loadRiskDataset("riskTables");
  const registry = await riskRegistryPromise;
  return {
    home: registry?.home || {},
    reference: registry?.reference || {},
    analyses: Array.isArray(registry?.analyses) ? registry.analyses : []
  };
}


/** Finds one Risk Analysis registry entry by id */
export async function loadRiskAnalysisEntry(riskId) {
  const id = String(riskId || "").trim();
  if (!SAFE_RISK_ID_PATTERN.test(id)) {
    throw new Error("Invalid Risk Analysis ID: " + id);
  }
  const registry = await loadRiskTableRegistry();
  const entry = registry.analyses.find((item) => item?.id === id);
  if (!entry) {
    throw new Error("Unknown Risk Analysis ID: " + id);
  }
  return entry;
}


/** Validates the registry file reference for one Risk Analysis */
function getRiskTablePath(entry) {
  const id = String(entry?.id || "").trim();
  const path = String(entry?.path || "").trim();
  if (!SAFE_RISK_ID_PATTERN.test(id) || path !== "riskTables/" + id + ".json") {
    throw new Error("Invalid Risk Analysis path for " + (id || "unknown"));
  }
  return path;
}


/** Loads one Risk Analysis control table by id */
export async function loadRiskTable(riskId) {
  const id = String(riskId || "").trim();
  if (!SAFE_RISK_ID_PATTERN.test(id)) {
    throw new Error("Invalid Risk Analysis ID: " + id);
  }
  if (!riskTablePromises.has(id)) {
    riskTablePromises.set(id, loadRiskAnalysisEntry(id).then((entry) => fetchJSON("data/" + getRiskTablePath(entry))));
  }
  return riskTablePromises.get(id);
}


/** Loads risk scoring factor definitions */
export function loadRiskDefinitions() {
  return loadRiskDataset("riskDefinitions");
}


/** Loads risk summary message ranges */
export function loadRiskSummaryMessages() {
  return loadRiskDataset("riskSummaryMessages");
}


/** Loads all editor-managed definition data */
export async function loadAllRiskData() {
  const [riskTables, riskDefinitions, riskSummaryMessages] = await Promise.all([
    loadRiskTableRegistry(),
    loadRiskDefinitions(),
    loadRiskSummaryMessages()
  ]);
  return { riskTables, riskDefinitions, riskSummaryMessages };
}
