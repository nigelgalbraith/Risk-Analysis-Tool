// IMPORTS
import { initHomePage } from "./pages/homePage.js";
import { initRiskPage } from "./pages/riskPage.js";
import { initReviewPage } from "./pages/reviewPage.js";
import { initRiskReferencePage } from "./pages/riskReferencePage.js";

// BUILD
/** Reads the current page key from the URL */
function getPageKey() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("page") || "home").trim();
}


/** Initializes the application router */
async function initApp() {
  const page = getPageKey();
  if (page === "risk") {
    initRiskPage();
    return;
  }
  if (page === "review") {
    await initReviewPage();
    return;
  }
  if (page === "reference") {
    initRiskReferencePage();
    return;
  }
  initHomePage();
}

initApp();
