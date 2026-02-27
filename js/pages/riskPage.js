// IMPORTS
import "../../data/intro.js";
import { buildAppShell } from "../core/appShell.js";
import { createEventBus } from "../core/eventBus.js";
import { createPageLifecycle } from "../core/pageLifecycle.js";
import { createSharedState } from "../core/sharedState.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildRiskTablePane } from "../panes/RiskTablePane.js";
import { buildRiskSummaryPane } from "../panes/RiskSummaryPane.js";
import { initThemeToggle } from "../themeToggle.js";

// STATE
const BASE_TITLE = "Risk Analysis";
const BACK_NAV_KEY = "back";
const MISSING_PARAM_HTML = "<p>Missing required URL parameter: <code>?service=</code></p>";
const RISK_STATE_ENTRIES = [["page", "risk"]];

// BUILD
/** Reads the service key from the current URL */
function getServiceKey() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("service") || "").trim();
}



/** Converts a value to display title case */
function titleCase(value) {
  return (value || "").replace(/(^|\s|[-_])\w/g, function (match) {
    return match.toUpperCase();
  });
}



/** Initializes the risk page orchestrator */
function initRiskPage() {
  const lifecycle = createPageLifecycle();
  const shell = buildAppShell({ pageTitle: BASE_TITLE, activeNavKey: BACK_NAV_KEY });
  const events = createEventBus();
  const state = createSharedState(events, RISK_STATE_ENTRIES);
  const api = { events, state, lifecycle };
  const cleanupTheme = initThemeToggle(document);
  lifecycle.add(cleanupTheme);
  lifecycle.add(() => events.clear());
  const onPageHide = function () {
    lifecycle.destroy();
  };
  window.addEventListener("pagehide", onPageHide);
  lifecycle.add(() => window.removeEventListener("pagehide", onPageHide));
  const service = getServiceKey();
  const heading = shell.header.querySelector("#pageTitle");
  if (!service) {
    const introHost = document.createElement("div");
    introHost.className = "intro-text";
    introHost.id = "introHost";
    introHost.innerHTML = MISSING_PARAM_HTML;
    shell.contentHost.appendChild(introHost);
    const tableHost = document.createElement("div");
    tableHost.id = "tableHost";
    shell.contentHost.appendChild(tableHost);
    const summaryHost = document.createElement("div");
    summaryHost.id = "summaryHost";
    shell.contentHost.appendChild(summaryHost);
    if (heading) heading.textContent = BASE_TITLE;
    document.title = BASE_TITLE;
    return;
  }
  const displayName = titleCase(service);
  if (heading) heading.textContent = displayName + " Risk Analysis";
  document.title = displayName + " Risk Analysis";
  const introPane = buildIntroPane({ introKey: service, className: "intro-text", id: "introHost" }, api);
  shell.contentHost.appendChild(introPane.node);
  lifecycle.add(introPane.destroy);
  const tablePane = buildRiskTablePane({ id: "tableHost", riskKey: service, title: titleCase(service) + " Risk Table" }, api);
  shell.contentHost.appendChild(tablePane.node);
  lifecycle.add(tablePane.destroy);
  const summaryPane = buildRiskSummaryPane({ id: "summaryHost", riskKey: service }, api);
  shell.contentHost.appendChild(summaryPane.node);
  lifecycle.add(summaryPane.destroy);
}


initRiskPage();
