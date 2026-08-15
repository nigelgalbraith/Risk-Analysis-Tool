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
