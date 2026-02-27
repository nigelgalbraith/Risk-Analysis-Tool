// IMPORTS
import { buildAppShell } from "./appShell.js";
import { createEventBus } from "./eventBus.js";
import { createPageLifecycle } from "./pageLifecycle.js";

// BUILD
/** Clones initial state for runtime storage */
function cloneInitialState(initialState) {
  return Object.assign({}, initialState || {});
}



/** Creates a state store with event emission */
function createStateStore(initialState, events) {
  const store = cloneInitialState(initialState);
  function get(key) {
    return store[String(key)];
  }
  function set(key, value) {
    const stateKey = String(key);
    store[stateKey] = value;
    if (events && events.emit) {
      events.emit("state:changed", { key: stateKey, value });
      events.emit("state:changed:" + stateKey, { key: stateKey, value });
    }
    return value;
  }
  function has(key) {
    return Object.prototype.hasOwnProperty.call(store, String(key));
  }
  function clear() {
    Object.keys(store).forEach((key) => {
      delete store[key];
    });
    if (events && events.emit) events.emit("state:cleared", {});
  }
  return { get, set, has, clear };
}



/** Creates a page runtime with shell, events, lifecycle, and state */
export function createPageRuntime({ pageTitle, activeNavKey, initialState }) {
  const lifecycle = createPageLifecycle();
  const shell = buildAppShell({ pageTitle, activeNavKey });
  const events = createEventBus();
  const state = createStateStore(initialState, events);
  const onPageHide = function () {
    lifecycle.destroy();
  };
  window.addEventListener("pagehide", onPageHide);
  lifecycle.add(() => window.removeEventListener("pagehide", onPageHide));
  lifecycle.add(() => events.clear());
  return { shell, events, lifecycle, state };
}
