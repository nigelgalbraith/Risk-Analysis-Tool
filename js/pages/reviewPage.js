// IMPORTS
import "../../data/intro.js";
import { buildAppShell } from "../core/appShell.js";
import { createEventBus } from "../core/eventBus.js";
import { createPageLifecycle } from "../core/pageLifecycle.js";
import { createSharedState } from "../core/sharedState.js";
import { initThemeToggle } from "../themeToggle.js";
import { buildRiskReportPane } from "../panes/RiskReportPane.js";
import { buildRiskReportData } from "../core/reportBuilder.js";
import { buildRiskExportPane } from "../panes/RiskExportPane.js";

// STATE
const BASE_TITLE = "Risk Review";
const BACK_NAV_KEY = "back";
const REVIEW_STATE_ENTRIES = [["page", "review"]];

// BUILD
/** Reads the service key from the current URL */
function getServiceKey() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("service") || "").trim();
}


/** Converts a value to display title case */
function titleCase(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, function (match) {
      return match.toUpperCase();
    })
    .trim();
}


/** Initializes the review page orchestrator */
async function initReviewPage() {
  // Core lifecycle and shell setup
  const lifecycle = createPageLifecycle();
  const shell = buildAppShell({ pageTitle: BASE_TITLE, activeNavKey: BACK_NAV_KEY });
  const events = createEventBus();
  const state = createSharedState(events, REVIEW_STATE_ENTRIES);
  const api = { events, state, lifecycle };
  // Initialize theme toggle and ensure cleanup on page lifecycle end
  const cleanupTheme = initThemeToggle(document);
  lifecycle.add(cleanupTheme);
  lifecycle.add(() => events.clear());
  // Ensure lifecycle is destroyed when page is unloaded or hidden
  const onPageHide = function () {
    lifecycle.destroy();
  };
  window.addEventListener("pagehide", onPageHide);
  lifecycle.add(() => window.removeEventListener("pagehide", onPageHide));
  // Resolve requested service key from URL and find page title element
  const service = getServiceKey();
  const heading = shell.header.querySelector("#pageTitle");
  if (!service) {
    const msg = document.createElement("div");
    msg.className = "intro-text";
    msg.textContent = "Missing required URL parameter: ?service=";
    shell.contentHost.appendChild(msg);
    if (heading) heading.textContent = BASE_TITLE;
    document.title = BASE_TITLE;
    return;
  }
  // Format service display name and update page title
  const displayName = titleCase(service);
  if (heading) heading.textContent = displayName + " Review";
  document.title = displayName + " Review";
  // Placeholder host for the report panes
  const reportHost = document.createElement("div");
  reportHost.id = "reportHost";
  shell.contentHost.appendChild(reportHost);
  // Build and append the risk report pane
  const reportData = await buildRiskReportData(service);
  const reportPane = buildRiskReportPane({ id: "riskReportPane", reportData });
  reportHost.appendChild(reportPane.node);
  // Build and append the export pane
  const exportPane = buildRiskExportPane({
  id: "exportHost",
  backUrl: "riskPage.html?service=" + service
  });
  shell.contentHost.appendChild(exportPane.node);
  lifecycle.add(exportPane.destroy);    
}

initReviewPage();