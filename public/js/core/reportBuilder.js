// IMPORTS
import {
  loadState,
  normalizeStatus,
  getRiskScore,
  computeMaxRiskScore,
  titleCase
} from "./helpers.js";
import { loadRiskSummaryMessages, loadRiskTable } from "./riskData.js";

// STATE
const STORAGE_KEY = "riskAnalysisState.v1";
const DETAILS_ROOT_KEY = "reportDetailsByService";

// BUILD
/** Finds the matching summary range for a ratio value */
function findSummaryRange(ranges, ratio) {
  for (let i = 0; i < (ranges || []).length; i += 1) {
    const range = ranges[i] || {};
    const min = Number(range.minRatio ?? 0);
    const max = Number(range.maxRatio ?? 1);
    if (ratio >= min && ratio <= max) return range;
  }
  return null;
}


/** Returns saved report details for the selected service */
function getServiceDetails(savedState, serviceKey) {
  const detailsRoot = savedState?.[DETAILS_ROOT_KEY];
  const serviceDetails = detailsRoot?.[serviceKey];
  return {
    client: String(serviceDetails?.client || "").trim(),
    system: String(serviceDetails?.system || "").trim(),
    assessor: String(serviceDetails?.assessor || "").trim(),
    notes: String(serviceDetails?.notes || "").trim()
  };
}


/** Builds rendered report rows from table data and saved state */
function buildReportRows(rows, serviceState) {
  return (rows || []).map((row) => {
    const id = String(row?.id || "").trim();
    const defaultStatus = normalizeStatus(row?.default);
    const savedStatus = serviceState?.[id];
    const status = normalizeStatus(savedStatus != null ? savedStatus : defaultStatus);
    const rowRiskScore = status === "enabled" ? 0 : getRiskScore(row);
    return {
      id,
      label: String(row?.label || id),
      status,
      riskScore: rowRiskScore,
      pros: Array.isArray(row?.pros) ? row.pros : [],
      cons: Array.isArray(row?.cons) ? row.cons : []
    };
  });
}


/** Computes the total selected risk score from report rows */
function computeTotalRiskScore(reportRows) {
  let total = 0;
  for (let i = 0; i < reportRows.length; i += 1) {
    total += Number(reportRows[i]?.riskScore || 0);
  }
  return total;
}


/** Formats an ISO date string for display */
export function formatReportDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}


/** Returns report rows in the same order used by the review display */
export function getDisplayReportRows(reportData) {
  return (Array.isArray(reportData?.rows) ? reportData.rows : []).slice().sort(function (a, b) {
    const aDisabled = a?.status !== "enabled";
    const bDisabled = b?.status !== "enabled";
    if (aDisabled === bDisabled) return 0;
    return aDisabled ? -1 : 1;
  });
}


/** Formats the existing report model as readable plain text */
export function buildRiskReportText(reportData) {
  const lines = [];
  const title = reportData?.title || "Review Report";
  const rows = getDisplayReportRows(reportData);

  function addField(label, value) {
    lines.push(label);
    lines.push(value || "-");
    lines.push("");
  }

  lines.push(String(title).toUpperCase());
  lines.push("");
  addField("Client / Organisation", reportData?.client);
  addField("System / Device", reportData?.system);
  addField("Assessor", reportData?.assessor);
  addField("Generated", formatReportDate(reportData?.generatedAt));
  addField("Risk Level", reportData?.riskLevel);
  addField("Risk Score", String(reportData?.totalScore ?? 0) + " / " + String(reportData?.maxScore ?? 0));
  addField("Summary", reportData?.summaryMessage);
  lines.push("CONTROLS");
  lines.push("");

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || {};
    const statusText = row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "-";
    const impactItems = row.status === "enabled" ? row.pros : row.cons;
    lines.push(row.label || "-");
    lines.push("Status: " + statusText);
    if (row.status !== "enabled" && row.riskScore) {
      lines.push("Impact: +" + String(row.riskScore));
    }
    lines.push("");
    for (let j = 0; j < (impactItems || []).length; j += 1) {
      lines.push("- " + String(impactItems[j] || ""));
    }
    lines.push("");
  }

  lines.push("NOTES");
  lines.push(reportData?.notes || "-");
  return lines.join("\n").trim();
}


/** Builds a complete report model for the selected service */
export async function buildRiskReportData(serviceKey) {
  const [serviceRows, summaryRanges] = await Promise.all([
    loadRiskTable(serviceKey),
    loadRiskSummaryMessages()
  ]);
  const savedState = loadState(STORAGE_KEY, {});
  const serviceState = savedState?.[serviceKey] || {};
  const details = getServiceDetails(savedState, serviceKey);
  const rows = buildReportRows(serviceRows, serviceState);
  const totalScore = computeTotalRiskScore(rows);
  const maxScore = computeMaxRiskScore(serviceRows);
  const ratio = maxScore > 0 ? totalScore / maxScore : 0;
  const summaryRange = findSummaryRange(summaryRanges || [], ratio);
  const displayName = titleCase(serviceKey);
  return {
    service: serviceKey,
    displayName,
    title: displayName + " Review Report",
    generatedAt: new Date().toISOString(),
    client: details.client,
    system: details.system,
    assessor: details.assessor,
    notes: details.notes,
    totalScore,
    maxScore,
    ratio,
    riskLevel: String(summaryRange?.title || ""),
    riskColor: String(summaryRange?.color || ""),
    summaryMessage: String(summaryRange?.message || ""),
    rows
  };
}
