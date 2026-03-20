// IMPORTS
import "../../data/intro.js";
import { createPageRuntime } from "../core/pageRuntime.js";
import { getServiceKey } from "../core/helpers.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildRiskDefinitionsPane } from "../panes/RiskDefinitionsPane.js";
import { buildRiskSummaryListPane } from "../panes/RiskSummaryListPane.js";

// STATE
const BASE_TITLE = "Risk Reference";
const BACK_NAV_KEY = "reference";
const REFERENCE_STATE_ENTRIES = [["page", "riskReference"]];

// BUILD
/** Initializes the risk reference page */
export function initRiskReferencePage() {
  const { lifecycle, shell, events, state } = createPageRuntime({
    pageTitle: BASE_TITLE,
    activeNavKey: BACK_NAV_KEY,
    initialState: REFERENCE_STATE_ENTRIES
  });
  const api = { events, state, lifecycle };
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
  document.title = BASE_TITLE;
  const introPane = buildIntroPane({ introKey: service, className: "intro-text", id: "introHost" }, api);
  const definitionsPane = buildRiskDefinitionsPane({ id: "riskDefinitionsHost" }, api);
  const summaryPane = buildRiskSummaryListPane({ id: "riskSummaryHost" }, api);
  shell.contentHost.appendChild(introPane.node);
  shell.contentHost.appendChild(definitionsPane.node);
  shell.contentHost.appendChild(summaryPane.node);
  lifecycle.add(introPane.destroy);
  lifecycle.add(definitionsPane.destroy);
  lifecycle.add(summaryPane.destroy);
}
