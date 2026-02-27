// IMPORTS
import { NOOP_PANE, addHostClasses } from "../core/helpers.js";

// STATE
const INTRO_CLASS = "intro-text";
const INTRO_KEY = "main";

// BUILD
/** Returns intro HTML for a given key */
function getIntroHTML(key) {
  const map = (window && window.INTRO_TEXT) ? window.INTRO_TEXT : null;
  if (!map) return "";
  if (!key) return map.main || "";
  return map[key] || "";
}



/** Initializes the intro pane node */
function initIntroPane(host, settings, api) {
  const key = settings.introKey || INTRO_KEY;
  host.innerHTML = getIntroHTML(key) || "";
  return NOOP_PANE;
}



/** Builds the intro pane */
export function buildIntroPane(options, api) {
  const settings = options || {};
  const node = document.createElement("div");
  node.className = settings.className || INTRO_CLASS;
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", "pane-host--intro-text", "pane", "pane-intro-text"]);
  const instance = initIntroPane(node, settings, api || {});
  return { node, destroy: instance.destroy };
}
