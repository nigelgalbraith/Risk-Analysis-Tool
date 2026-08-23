// IMPORTS
import "../../data/intro.js";
import { createPageRuntime } from "../core/pageRuntime.js";
import { getServiceKey, titleCase } from "../core/helpers.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildRiskDetailsPane } from "../panes/RiskDetailsPane.js";
import { buildRiskTablePane } from "../panes/RiskTablePane.js";
import { buildRiskSummaryPane } from "../panes/RiskSummaryPane.js";
import { buildRiskReviewActionPane } from "../panes/RiskReviewActionPane.js";

// STATE
const BASE_TITLE = "Risk Analysis";
const BACK_NAV_KEY = "home";
const MISSING_PARAM_HTML = "<p>Missing required URL parameter: <code>?service=</code></p>";
const RISK_STATE_ENTRIES = [["page", "risk"]];

// BUILD
/** Initializes the risk page orchestrator */
export function initRiskPage() {
  const { lifecycle, shell, events, state } = createPageRuntime({
    pageTitle: BASE_TITLE,
    activeNavKey: BACK_NAV_KEY,
    initialState: RISK_STATE_ENTRIES
  });
  const api = { events, state, lifecycle };
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
  const introPane = buildIntroPane({
    introKey: service,
    className: "intro-text",
    id: "introHost"
  }, api);
  const detailsPane = buildRiskDetailsPane({
    id: "detailsHost",
    riskKey: service,
    title: "Assessment Details"
  }, api);
  const tablePane = buildRiskTablePane({
    id: "tableHost",
    riskKey: service,
    title: titleCase(service) + " Risk Table"
  }, api);
  const summaryPane = buildRiskSummaryPane({
    id: "summaryHost",
    riskKey: service
  }, api);
  const reviewPane = buildRiskReviewActionPane({
    id: "reviewHost",
    riskKey: service,
    title: "Review"
  }, api);
  shell.contentHost.appendChild(introPane.node);
  shell.contentHost.appendChild(detailsPane.node);
  shell.contentHost.appendChild(tablePane.node);
  shell.contentHost.appendChild(summaryPane.node);
  shell.contentHost.appendChild(reviewPane.node);
  lifecycle.add(introPane.destroy);
  lifecycle.add(detailsPane.destroy);
  lifecycle.add(tablePane.destroy);
  lifecycle.add(summaryPane.destroy);
  lifecycle.add(reviewPane.destroy);
}
