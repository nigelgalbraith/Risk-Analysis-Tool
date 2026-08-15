// IMPORTS
import {
  el,
  clearHost,
  addHostClasses,
  renderHostMessage,
  renderHostTitle
} from "../core/helpers.js";

// STATE
const REPORT_CLASS = "pane-host--risk-report";

// BUILD
/** Formats an ISO date string for display */
function formatReportDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}


/** Creates a report detail row */
function buildDetailRow(labelText, valueText) {
  const row = el("div", "rr-detail-row");
  const label = el("div", "rr-detail-label", labelText);
  const value = el("div", "rr-detail-value", valueText || "-");
  row.appendChild(label);
  row.appendChild(value);
  return row;
}


/** Creates a list for pros or cons values */
function buildTextList(items) {
  const list = el("ul", "rr-list");
  const safeItems = Array.isArray(items) ? items : [];
  for (let i = 0; i < safeItems.length; i += 1) {
    const item = document.createElement("li");
    item.textContent = String(safeItems[i] || "");
    list.appendChild(item);
  }
  return list;
}


/** Builds the report summary block */
function buildSummaryBlock(reportData) {
  const summary = el("div", "rr-summary");
  const levelRow = el("div", "rr-summary-row");
  const levelLabel = el("div", "rr-summary-label", "Risk Level");
  const levelValue = el("div", "rr-summary-value rr-summary-value--level", reportData.riskLevel || "-");
  if (reportData.riskColor) levelValue.style.color = reportData.riskColor;
  levelRow.appendChild(levelLabel);
  levelRow.appendChild(levelValue);
  const scoreRow = el("div", "rr-summary-row");
  const scoreLabel = el("div", "rr-summary-label", "Risk Score");
  const scoreValue = el("div", "rr-summary-value", String(reportData.totalScore) + " / " + String(reportData.maxScore));
  scoreRow.appendChild(scoreLabel);
  scoreRow.appendChild(scoreValue);
  const messageRow = el("div", "rr-summary-row rr-summary-row--message");
  const messageLabel = el("div", "rr-summary-label", "Summary");
  const messageValue = el("div", "rr-summary-value", reportData.summaryMessage || "-");
  messageRow.appendChild(messageLabel);
  messageRow.appendChild(messageValue);
  summary.appendChild(levelRow);
  summary.appendChild(scoreRow);
  summary.appendChild(messageRow);
  return summary;
}


/** Builds the report details block */
function buildDetailsBlock(reportData) {
  const block = el("div", "rr-details");
  block.appendChild(buildDetailRow("Client / Organisation", reportData.client));
  block.appendChild(buildDetailRow("System / Device", reportData.system));
  block.appendChild(buildDetailRow("Assessor", reportData.assessor));
  block.appendChild(buildDetailRow("Generated", formatReportDate(reportData.generatedAt)));
  return block;
}


/** Builds the controls table for the report */
function buildControlsTable(reportData) {
  const table = el("table", "rt-table rr-table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const headings = ["Control", "Status", "Impact"];
  for (let i = 0; i < headings.length; i += 1) {
    headRow.appendChild(el("th", "", headings[i]));
  }
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  const rows = (Array.isArray(reportData.rows) ? reportData.rows : []).slice().sort(function (a, b) {
  const aDisabled = a?.status !== "enabled";
  const bDisabled = b?.status !== "enabled";
  if (aDisabled === bDisabled) return 0;
    return aDisabled ? -1 : 1;
  });
  for (let i = 0; i < rows.length; i += 1) {
    const rowData = rows[i] || {};
    const row = document.createElement("tr");
    if (rowData.status !== "enabled") {
      row.classList.add("rr-row-disabled");
    }
    row.appendChild(el("td", "rr-control", rowData.label || "-"));
    const statusClass = rowData.status === "enabled" ? "rr-status rr-status-enabled" : "rr-status rr-status-disabled";
    const statusText = rowData.status ? rowData.status.charAt(0).toUpperCase() + rowData.status.slice(1) : "-";
    row.appendChild(el("td", statusClass, statusText));
    const impactItems = rowData.status === "enabled" ? rowData.pros : rowData.cons;
    const impactCell = document.createElement("td");
    const list = buildTextList(impactItems);
    if (rowData.status !== "enabled" && rowData.riskScore) {
        const scoreNote = document.createElement("div");
        scoreNote.className = "rr-risk-weight";
        scoreNote.textContent = "(+" + String(rowData.riskScore) + ")";
        impactCell.appendChild(scoreNote);
    }
    impactCell.appendChild(list);
    row.appendChild(impactCell);
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  return table;
}


/** Builds the notes block for the report */
function buildNotesBlock(reportData) {
  const wrap = el("div", "rr-notes");
  const heading = el("h3", "rr-section-title", "Notes");
  const body = el("p", "rr-notes-text", reportData.notes || "-");
  wrap.appendChild(heading);
  wrap.appendChild(body);
  return wrap;
}


/** Initializes the risk report pane */
function initRiskReportPane(host, settings) {
  const title = settings.title || "Review Report";
  const reportData = settings.reportData || null;
  clearHost(host);
  renderHostTitle(host, title, "rt-title");
  if (!reportData) {
    renderHostMessage(host, "Missing report data.", "rt-error", false);
    return { destroy() {} };
  }
  host.appendChild(buildDetailsBlock(reportData));
  host.appendChild(buildSummaryBlock(reportData));
  host.appendChild(buildControlsTable(reportData));
  host.appendChild(buildNotesBlock(reportData));
  return { destroy() {} };
}


/** Builds the risk report pane host */
export function buildRiskReportPane(options) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", REPORT_CLASS, "pane"]);
  const instance = initRiskReportPane(node, settings);
  return { node, destroy: instance.destroy };
}
