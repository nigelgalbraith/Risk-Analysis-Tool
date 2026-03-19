// IMPORTS
import "../../data/intro.js";
import { buildAppShell } from "../core/appShell.js";
import { createEventBus } from "../core/eventBus.js";
import { createPageLifecycle } from "../core/pageLifecycle.js";
import { createSharedState } from "../core/sharedState.js";
import { initThemeToggle } from "../themeToggle.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildRiskDefinitionsPane } from "../panes/RiskDefinitionsPane.js";
import { buildRiskSummaryListPane } from "../panes/RiskSummaryListPane.js";


// STATE
const BASE_TITLE = "Risk Reference";
const BACK_NAV_KEY = "back";
const REFERENCE_STATE_ENTRIES = [["page", "riskReference"]];

// BUILD
/** Reads the service key from the current URL */
function getServiceKey(){
const params=new URLSearchParams(window.location.search);
return(params.get("service")||"").trim();
}


/** Initializes the risk reference page */
function initRiskReferencePage(){
const lifecycle=createPageLifecycle();
const shell=buildAppShell({pageTitle:BASE_TITLE,activeNavKey:BACK_NAV_KEY});
const events=createEventBus();
const state=createSharedState(events,REFERENCE_STATE_ENTRIES);
const api={events,state,lifecycle};
const cleanupTheme=initThemeToggle(document);
lifecycle.add(cleanupTheme);
lifecycle.add(()=>events.clear());
const definitionsPane=buildRiskDefinitionsPane({id:"riskDefinitionsHost"},api);
const summaryPane=buildRiskSummaryListPane({id:"riskSummaryHost"},api);
document.title=BASE_TITLE;
// Resolve requested service key from URL and find page title element
const service=getServiceKey();
const heading=shell.header.querySelector("#pageTitle");
if(!service){
const msg=document.createElement("div");
msg.className="intro-text";
msg.textContent="Missing required URL parameter: ?service=";
shell.contentHost.appendChild(msg);
if(heading)heading.textContent=BASE_TITLE;
document.title=BASE_TITLE;
return;
}
// Intro pane 
const introPane=buildIntroPane({introKey:service,className:"intro-text",id:"introHost"},api);
shell.contentHost.appendChild(introPane.node);
lifecycle.add(introPane.destroy);
shell.contentHost.appendChild(definitionsPane.node);
shell.contentHost.appendChild(summaryPane.node);
lifecycle.add(definitionsPane.destroy);
lifecycle.add(summaryPane.destroy);
const onPageHide=function(){
lifecycle.destroy();
};
window.addEventListener("pagehide",onPageHide);
lifecycle.add(()=>window.removeEventListener("pagehide",onPageHide));
}


initRiskReferencePage();