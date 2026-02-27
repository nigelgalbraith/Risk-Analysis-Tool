// IMPORTS
import { NOOP_PANE, addHostClasses, renderHostMessage } from "../core/helpers.js";

// STATE
const CARDS_CLASS = "risk-analysis-grid";

// BUILD
/** Builds the intro card list HTML */
function buildCardsHTML(cards) {
  return Object.keys(cards).map(function (key) {
    const card = cards[key];
    if (!card) return "";
    const title = card.title || key;
    const desc = card.description || "";
    const link = card.link || "#";
    return '<div class="risk-card"><a href="' + link + '"><h2>' + title + "</h2><p>" + desc + "</p></a></div>";
  }).join("");
}



/** Initializes the intro cards pane node */
function initIntroCardsPane(host, api) {
  const cards = window.introCards;
  if (!cards) {
    renderHostMessage(host, "introCards data not loaded.", "", true, "p");
    return NOOP_PANE;
  }
  const keys = Object.keys(cards);
  if (!keys.length) {
    renderHostMessage(host, "No cards configured.", "", true, "p");
    return NOOP_PANE;
  }
  host.innerHTML = buildCardsHTML(cards);
  return NOOP_PANE;
}



/** Builds the intro cards pane */
export function buildIntroCardPane(options, api) {
  const settings = options || {};
  const node = document.createElement("div");
  node.className = settings.className || CARDS_CLASS;
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", "pane-host--intro-cards"]);
  const instance = initIntroCardsPane(node, api || {});
  return { node, destroy: instance.destroy };
}
