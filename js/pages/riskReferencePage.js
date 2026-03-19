// IMPORTS
import { buildAppShell } from "../core/appShell.js";
import { createEventBus } from "../core/eventBus.js";
import { createPageLifecycle } from "../core/pageLifecycle.js";
import { createSharedState } from "../core/sharedState.js";
import { initThemeToggle } from "../themeToggle.js";
import { buildRiskDefinitionsPane } from "../panes/RiskDefinitionsPane.js";
import { buildRiskSummaryListPane } from "../panes/RiskSummaryListPane.js";

// STATE
const BASE_TITLE = "Risk Reference";
const BACK_NAV_KEY = "back";
const REFERENCE_STATE_ENTRIES = [["page", "riskReference"]];

// BUILD
/** Initializes the risk reference page */
function initRiskReferencePage() {
  const lifecycle = createPageLifecycle();
  const shell = buildAppShell({ pageTitle: BASE_TITLE, activeNavKey: BACK_NAV_KEY });
  const events = createEventBus();
  const state = createSharedState(events, REFERENCE_STATE_ENTRIES);
  const api = { events, state, lifecycle };
  const cleanupTheme = initThemeToggle(document);
  lifecycle.add(cleanupTheme);
  lifecycle.add(() => events.clear());
  const definitionsPane = buildRiskDefinitionsPane({
    id: "riskDefinitionsHost"
  }, api);
  const summaryPane = buildRiskSummaryListPane({
    id: "riskSummaryHost"
  }, api);
  shell.contentHost.appendChild(definitionsPane.node);
  shell.contentHost.appendChild(summaryPane.node);
  lifecycle.add(definitionsPane.destroy);
  lifecycle.add(summaryPane.destroy);
  document.title = BASE_TITLE;
  const onPageHide = function () {
    lifecycle.destroy();
  };
  window.addEventListener("pagehide", onPageHide);
  lifecycle.add(() => window.removeEventListener("pagehide", onPageHide));
}


initRiskReferencePage();