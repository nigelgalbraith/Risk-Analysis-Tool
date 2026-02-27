// IMPORTS
import "../../data/intro.js";
import "../../data/introCards.js";
import { buildAppShell } from "../core/appShell.js";
import { createEventBus } from "../core/eventBus.js";
import { createPageLifecycle } from "../core/pageLifecycle.js";
import { createSharedState } from "../core/sharedState.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildIntroCardPane } from "../panes/IntroCardPane.js";
import { initThemeToggle } from "../themeToggle.js";

// STATE
const HOME_TITLE = "Risk Analysis Tool";
const HOME_INTRO_KEY = "home";
const HOME_STATE_ENTRIES = [["page", "home"]];

// BUILD
/** Initializes the home page orchestrator */
function initHomePage() {
  const lifecycle = createPageLifecycle();
  const shell = buildAppShell({ pageTitle: HOME_TITLE, activeNavKey: null });
  const events = createEventBus();
  const state = createSharedState(events, HOME_STATE_ENTRIES);
  const api = { events, state, lifecycle };
  const introSection = document.createElement("section");
  introSection.className = "intro-hero";
  const introPane = buildIntroPane({ introKey: HOME_INTRO_KEY, className: "intro-text" }, api);
  introSection.appendChild(introPane.node);
  lifecycle.add(introPane.destroy);
  const cardPane = buildIntroCardPane({ className: "risk-analysis-grid" }, api);
  introSection.appendChild(cardPane.node);
  lifecycle.add(cardPane.destroy);
  shell.contentHost.appendChild(introSection);
  const cleanupTheme = initThemeToggle(document);
  lifecycle.add(cleanupTheme);
  lifecycle.add(() => events.clear());
  const onPageHide = function () {
    lifecycle.destroy();
  };
  window.addEventListener("pagehide", onPageHide);
  lifecycle.add(() => window.removeEventListener("pagehide", onPageHide));
}


initHomePage();
