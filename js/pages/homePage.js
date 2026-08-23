// IMPORTS
import "../../data/intro.js";
import "../../data/introCards.js";
import { createPageRuntime } from "../core/pageRuntime.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildIntroCardPane } from "../panes/IntroCardPane.js";

// STATE
const HOME_TITLE = "Risk Analysis Tool";
const HOME_INTRO_KEY = "home";
const HOME_STATE_ENTRIES = [["page", "home"]];

// BUILD
/** Initializes the home page orchestrator */
export function initHomePage() {
  const { lifecycle, shell, events, state } = createPageRuntime({
    pageTitle: HOME_TITLE,
    activeNavKey: "home",
    initialState: HOME_STATE_ENTRIES
  });
  const api = { events, state, lifecycle };
  const introSection = document.createElement("section");
  introSection.className = "intro-hero";
  const introPane = buildIntroPane({ introKey: HOME_INTRO_KEY, className: "intro-text" }, api);
  const cardPane = buildIntroCardPane({ className: "risk-analysis-grid" }, api);
  introSection.appendChild(introPane.node);
  introSection.appendChild(cardPane.node);
  shell.contentHost.appendChild(introSection);
  lifecycle.add(introPane.destroy);
  lifecycle.add(cardPane.destroy);
}
