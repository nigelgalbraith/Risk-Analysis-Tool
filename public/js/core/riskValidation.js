// STATE
const STATUS_VALUES = new Set(["enabled", "disabled"]);
const SAFE_RISK_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const RISK_FACTORS = Object.freeze({
  likelihood: ["exploitability", "exposure", "prevalence"],
  impact: ["confidentiality", "integrity", "availability"]
});

// BUILD
/** Adds an error when a condition is false */
function requireCondition(errors, condition, message) {
  if (!condition) errors.push(message);
}


/** Returns true when a value is a plain object */
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}


/** Validates a score value against the current app data model */
function validateScore(errors, value, path) {
  const number = Number(value);
  requireCondition(errors, Number.isFinite(number), path + " must be a number.");
  requireCondition(errors, number >= 1 && number <= 5, path + " must be between 1 and 5.");
}


/** Validates a string list */
function validateTextList(errors, value, path) {
  requireCondition(errors, Array.isArray(value), path + " must be a list.");
  if (!Array.isArray(value)) return;
  value.forEach((item, index) => {
    requireCondition(errors, typeof item === "string", path + "[" + index + "] must be text.");
  });
}


/** Validates one risk control row */
function validateRiskControl(errors, row, serviceId, index) {
  const path = "riskTables." + serviceId + "[" + index + "]";
  requireCondition(errors, isObject(row), path + " must be an object.");
  if (!isObject(row)) return;
  requireCondition(errors, typeof row.id === "string" && row.id.trim(), path + ".id is required.");
  requireCondition(errors, typeof row.label === "string" && row.label.trim(), path + ".label is required.");
  requireCondition(errors, STATUS_VALUES.has(row.default), path + ".default must be enabled or disabled.");
  Object.entries(RISK_FACTORS).forEach(([groupKey, factorKeys]) => {
    requireCondition(errors, isObject(row[groupKey]), path + "." + groupKey + " must be an object.");
    if (!isObject(row[groupKey])) return;
    factorKeys.forEach((factorKey) => {
      validateScore(errors, row[groupKey][factorKey], path + "." + groupKey + "." + factorKey);
    });
  });
  validateTextList(errors, row.pros, path + ".pros");
  validateTextList(errors, row.cons, path + ".cons");
}


/** Validates the risk table registry */
export function validateRiskTableRegistry(data) {
  const errors = [];
  requireCondition(errors, isObject(data), "riskTables must be an object.");
  if (!isObject(data)) return errors;
  requireCondition(errors, isObject(data.home), "riskTables.home must be an object.");
  if (isObject(data.home)) {
    requireCondition(errors, typeof data.home.title === "string" && data.home.title.trim(), "riskTables.home.title is required.");
    requireCondition(errors, typeof data.home.introHtml === "string", "riskTables.home.introHtml must be text.");
  }
  requireCondition(errors, isObject(data.reference), "riskTables.reference must be an object.");
  if (isObject(data.reference)) {
    requireCondition(errors, typeof data.reference.title === "string" && data.reference.title.trim(), "riskTables.reference.title is required.");
    requireCondition(errors, typeof data.reference.introHtml === "string", "riskTables.reference.introHtml must be text.");
  }
  requireCondition(errors, Array.isArray(data.analyses), "riskTables.analyses must be a list.");
  if (!Array.isArray(data.analyses)) return errors;
  const ids = new Set();
  data.analyses.forEach((analysis, index) => {
    const path = "riskTables.analyses[" + index + "]";
    requireCondition(errors, isObject(analysis), path + " must be an object.");
    if (!isObject(analysis)) return;
    const serviceId = analysis.id;
    requireCondition(errors, typeof serviceId === "string" && serviceId.trim(), path + ".id is required.");
    if (typeof serviceId !== "string") return;
    requireCondition(errors, SAFE_RISK_ID_PATTERN.test(serviceId), path + " may contain only letters, numbers, underscores, or hyphens and must start with a letter.");
    if (ids.has(serviceId)) errors.push("riskTables.analyses contains duplicate id " + serviceId + ".");
    ids.add(serviceId);
    requireCondition(errors, typeof analysis.title === "string" && analysis.title.trim(), path + ".title is required.");
    requireCondition(errors, typeof analysis.description === "string", path + ".description must be text.");
    requireCondition(errors, analysis.path === "riskTables/" + serviceId + ".json", path + ".path must reference riskTables/" + serviceId + ".json.");
    requireCondition(errors, typeof analysis.link === "string" && analysis.link.trim(), path + ".link is required.");
    requireCondition(errors, typeof analysis.introHtml === "string", path + ".introHtml must be text.");
  });
  return errors;
}


/** Validates one Risk Analysis rows file */
export function validateRiskAnalysisRows(data, serviceId = "selected") {
  const errors = [];
  requireCondition(errors, Array.isArray(data), "riskTables." + serviceId + " must be a list.");
  if (!Array.isArray(data)) return errors;
  const ids = new Set();
  data.forEach((row, index) => {
    validateRiskControl(errors, row, serviceId, index);
    if (row && typeof row.id === "string") {
      const id = row.id.trim();
      if (ids.has(id)) errors.push("riskTables." + serviceId + " contains duplicate id " + id + ".");
      ids.add(id);
    }
  });
  return errors;
}


/** Backward-compatible validator name for the registry file */
export function validateRiskTables(data) {
  return validateRiskTableRegistry(data);
}


/** Validates risk definition data */
export function validateRiskDefinitions(data) {
  const errors = [];
  requireCondition(errors, isObject(data), "riskDefinitions must be an object.");
  requireCondition(errors, isObject(data?.groups), "riskDefinitions.groups must be an object.");
  Object.entries(data?.groups || {}).forEach(([groupKey, group]) => {
    requireCondition(errors, typeof group?.label === "string" && group.label.trim(), "riskDefinitions.groups." + groupKey + ".label is required.");
    requireCondition(errors, isObject(group?.factors), "riskDefinitions.groups." + groupKey + ".factors must be an object.");
    Object.entries(group?.factors || {}).forEach(([factorKey, factor]) => {
      const path = "riskDefinitions.groups." + groupKey + ".factors." + factorKey;
      requireCondition(errors, typeof factor?.label === "string" && factor.label.trim(), path + ".label is required.");
      requireCondition(errors, isObject(factor?.scores), path + ".scores must be an object.");
      ["1", "2", "3", "4", "5"].forEach((score) => {
        requireCondition(errors, typeof factor?.scores?.[score] === "string" && factor.scores[score].trim(), path + ".scores." + score + " is required.");
      });
    });
  });
  return errors;
}


/** Validates summary message range data */
export function validateRiskSummaryMessages(data) {
  const errors = [];
  requireCondition(errors, Array.isArray(data), "riskSummaryMessages must be a list.");
  if (!Array.isArray(data)) return errors;
  data.forEach((item, index) => {
    const path = "riskSummaryMessages[" + index + "]";
    requireCondition(errors, isObject(item), path + " must be an object.");
    if (!isObject(item)) return;
    requireCondition(errors, Number.isFinite(Number(item.minRatio)), path + ".minRatio must be a number.");
    requireCondition(errors, Number.isFinite(Number(item.maxRatio)), path + ".maxRatio must be a number.");
    requireCondition(errors, typeof item.title === "string" && item.title.trim(), path + ".title is required.");
    requireCondition(errors, typeof item.color === "string" && item.color.trim(), path + ".color is required.");
    requireCondition(errors, typeof item.message === "string" && item.message.trim(), path + ".message is required.");
  });
  return errors;
}


/** Validates one named editor-managed dataset */
export function validateRiskDataset(name, data) {
  if (name === "riskTables") return validateRiskTableRegistry(data);
  if (name === "riskDefinitions") return validateRiskDefinitions(data);
  if (name === "riskSummaryMessages") return validateRiskSummaryMessages(data);
  return ["Unknown dataset: " + name];
}
