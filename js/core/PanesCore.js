// js/core/PanesCore.js
// -----------------------------------------------------------------------------
// Pane runtime used by all pages.
//
// Provides:
//   - Registry: panes register themselves by name (data-pane value)
//   - Bootstrap: single call instantiates all panes found in the DOM
//   - Lifecycle: factories may return { destroy() } for cleanup
//   - Events: small scoped event bus
//   - State: scoped key/value store (+ emits state change events)
//   - CSS isolation: adds pane-host--<name> to hosts
//
// Improvements:
//   - Auto-bootstraps on DOMContentLoaded (unless data-panes-no-auto on <html>)
//   - Prevents double-instantiation using data-pane-initialized="true"
//   - Safer host class naming
//   - Optional State.clear() helper
// -----------------------------------------------------------------------------

const registry = Object.create(null);
let instances = [];
let _state = Object.create(null);
const _listeners = Object.create(null);

function toSafeKebab(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hostClass(name) {
  return "pane-host--" + toSafeKebab(name);
}

const Events = {
  on(eventName, handler) {
    if (!eventName) throw new Error("Panes.events.on: missing eventName");
    if (typeof handler !== "function") throw new Error("Panes.events.on: handler must be a function");
    const name = String(eventName);
    (_listeners[name] || (_listeners[name] = [])).push(handler);
    return function off() {
      const list = _listeners[name];
      if (!list) return;
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    };
  },
  emit(eventName, detail) {
    if (!eventName) throw new Error("Panes.events.emit: missing eventName");
    const name = String(eventName);
    const list = _listeners[name];
    if (!list || list.length === 0) return;
    const snapshot = list.slice();
    const ev = { type: name, detail: detail || {} };
    snapshot.forEach((fn) => {
      try { fn(ev); } catch (_e) { /* ignore individual handler failures */ }
    });
  }
};

const State = {
  get(key) {
    return _state[String(key)];
  },
  set(key, value) {
    const k = String(key);
    _state[k] = value;
    Events.emit("state:changed", { key: k, value });
    Events.emit("state:changed:" + k, { key: k, value });
    return value;
  },
  has(key) {
    return Object.prototype.hasOwnProperty.call(_state, String(key));
  },
  clear() {
    _state = Object.create(null);
    Events.emit("state:cleared", {});
  }
};

function register(name, factory) {
  if (!name) throw new Error("Panes.register: missing name");
  if (typeof factory !== "function") throw new Error("Panes.register: factory must be a function");
  registry[String(name)] = factory;
}

function bootstrap(rootEl) {
  const root = rootEl || document;
  const nodes = root.querySelectorAll("[data-pane]");
  Array.prototype.forEach.call(nodes, (el) => {
    const name = el.dataset && el.dataset.pane;
    if (!name) return;
    if (el.dataset.paneInitialized === "true") return;
    el.dataset.paneInitialized = "true";
    el.classList.add("pane-host", hostClass(name));
    const factory = registry[name];
    if (!factory) return;
    try {
      const api = { events: Events, state: State, name };
      const inst = factory(el, api) || null;
      instances.push({ el, name, inst });
    } catch (e) {
      el.innerHTML = "";
      const box = document.createElement("section");
      box.className = "pane pane--error";
      const h = document.createElement("h2");
      h.className = "pane-title";
      h.textContent = "Pane error: " + name;
      const pre = document.createElement("pre");
      pre.textContent = String((e && (e.stack || e.message)) || e);
      box.appendChild(h);
      box.appendChild(pre);
      el.appendChild(box);
    }
  });
}

function destroyAll() {
  instances.forEach((rec) => {
    if (rec && rec.inst && typeof rec.inst.destroy === "function") {
      try { rec.inst.destroy(); } catch (_e) { /* ignore */ }
    }
    if (rec && rec.el && rec.el.dataset) {
      try { rec.el.dataset.paneInitialized = "false"; } catch (_e) {}
    }
  });
  instances = [];
}

export const Panes = {
  register,
  bootstrap,
  destroyAll,
  events: Events,
  state: State
};

// Optional global for any legacy code you still have.
if (!window.Panes) window.Panes = Panes;

// Auto-bootstrap unless explicitly disabled
document.addEventListener("DOMContentLoaded", function () {
  const html = document.documentElement;
  if (html && html.hasAttribute("data-panes-no-auto")) return;
  bootstrap(document);
});