const APP_CLASS = "app";
const HEADER_CLASS = "header-centered";
const MAIN_CLASS = "split";
const MAIN_ID = "root";
const PAGE_TITLE_ID = "pageTitle";
const THEME_TOGGLE_WRAPPER_CLASS = "theme-toggle-wrapper";
const THEME_TOGGLE_CLASS = "theme-toggle";
const THEME_TOGGLE_ICON_CLASS = "theme-toggle-icon";
const THEME_TOGGLE_TEXT_CLASS = "theme-toggle-text";
const NAV_CLASS = "nav";
const NAV_LINKS_CLASS = "nav-links";
const NAV_LINK_KEY = "home";
const NAV_LINK_LABEL = "Back to Main Menu";
const NAV_LINK_HREF = "index.html";


function createThemeToggle() {
  const wrapper = document.createElement("div");
  wrapper.className = THEME_TOGGLE_WRAPPER_CLASS;
  const button = document.createElement("button");
  button.className = THEME_TOGGLE_CLASS;
  button.type = "button";
  button.setAttribute("aria-label", "Toggle light/dark mode");
  button.setAttribute("aria-pressed", "false");
  button.title = "Toggle light/dark mode";
  const icon = document.createElement("span");
  icon.className = THEME_TOGGLE_ICON_CLASS;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "☾";
  const text = document.createElement("span");
  text.className = THEME_TOGGLE_TEXT_CLASS;
  text.textContent = "Theme";
  button.appendChild(icon);
  button.appendChild(text);
  wrapper.appendChild(button);
  return wrapper;
}


function createNav(activeNavKey) {
  if (!activeNavKey) return null;
  const nav = document.createElement("nav");
  nav.className = NAV_CLASS;
  const links = document.createElement("div");
  links.className = NAV_LINKS_CLASS;
  const link = document.createElement("a");
  link.href = NAV_LINK_HREF;
  link.textContent = NAV_LINK_LABEL;
  if (activeNavKey === NAV_LINK_KEY) link.setAttribute("aria-current", "page");
  links.appendChild(link);
  nav.appendChild(links);
  return nav;
}


export function buildAppShell({ pageTitle, activeNavKey }) {
  const appRoot = document.createElement("div");
  appRoot.className = APP_CLASS;
  const header = document.createElement("header");
  header.className = HEADER_CLASS;
  const heading = document.createElement("h1");
  heading.id = PAGE_TITLE_ID;
  heading.textContent = pageTitle || "Risk Analysis";
  const themeHost = createThemeToggle();
  const nav = createNav(activeNavKey);
  header.appendChild(heading);
  header.appendChild(themeHost);
  if (nav) header.appendChild(nav);
  const main = document.createElement("main");
  main.className = MAIN_CLASS;
  main.id = MAIN_ID;
  appRoot.appendChild(header);
  appRoot.appendChild(main);
  const root = document.getElementById("app");
  if (!root) throw new Error("Missing #app root");
  root.replaceChildren(appRoot);
  return { appRoot, header, main, nav, themeHost, contentHost: main };
}
