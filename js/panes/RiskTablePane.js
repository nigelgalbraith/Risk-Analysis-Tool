// site/js/RiskTablePane.js
// PanesCore pane: data-pane="risk-table"
// Loads risk control definitions from JSON and persists user selections in localStorage.

(function () {
  "use strict";

  if (!window.Panes || !window.Panes.register) {
    throw new Error("RiskTablePane requires PanesCore (Panes.register not found).");
  }

  /* Parses JSON safely with a fallback value. */
  function safeJSONParse(raw, fallback) {
    try { return JSON.parse(raw); } catch (_e) { return fallback; }
  }

  /* Loads persisted state from localStorage.*/
  function loadState(storageKey) {
    var raw = null;
    try { raw = window.localStorage.getItem(storageKey); } catch (_e) { raw = null; }
    return raw ? safeJSONParse(raw, {}) : {};
  }

  /* Saves state to localStorage. */
  function saveState(storageKey, stateObj) {
    try { window.localStorage.setItem(storageKey, JSON.stringify(stateObj)); } catch (_e) {}
  }

  /* Ensures category state exists and returns it. */
  function getOrCreateCategoryState(stateObj, categoryKey) {
    if (!stateObj[categoryKey] || typeof stateObj[categoryKey] !== "object") stateObj[categoryKey] = {};
    return stateObj[categoryKey];
  }

  /* Fetches JSON from a URL and returns a parsed object. */
  function fetchJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("Failed to load JSON: " + url + " (" + res.status + ")");
      return res.json();
    });
  }

  /* Creates a DOM element with optional class and text. */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* Renders a bullet list from an array of strings. */
  function makeList(items) {
    var ul = el("ul", "rt-list");
    (items || []).forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = String(t);
      ul.appendChild(li);
    });
    return ul;
  }

  /* Normalizes status values to the supported set.*/
  function normalizeStatus(value) {
    return value === "enabled" ? "enabled" : "disabled";
  }

  /**
   * Applies strike styling:
   *  - Pros struck when control is disabled
   *  - Cons struck when control is enabled
   */
  function applyStrike(prosCell, consCell, status) {
    var isEnabled = status === "enabled";
    if (prosCell) prosCell.classList.toggle("rt-strike", !isEnabled);
    if (consCell) consCell.classList.toggle("rt-strike", isEnabled);
  }

  /* Extracts a numeric danger percentage (0–100) from a row. */
  function getDangerPercent(row) {
    var n = Number(row && row.danger);
    if (!isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return Math.round(n);
  }

  /**
   * Initializes the risk table pane inside the given container.
   *
   * Data attributes supported:
   *  - data-risk-key   (required): key used to select a table from the JSON file
   *  - data-title      (optional): table title shown above the table
   *  - data-data-url   (optional): JSON source (default: data/riskTables.json)
   *  - data-storage-key(optional): localStorage key for persistence
   */
  function init(container, api) {
    var ds = container.dataset || {};
    var riskKey = ds.riskKey || ds.category || "";
    var title = ds.title || "Risk Table";
    var dataUrl = ds.dataUrl || "data/riskTables.json";
    var storageKey = ds.storageKey || "riskAnalysisState.v1";
    container.innerHTML = "";
    container.appendChild(el("h2", "rt-title", title));
    if (!riskKey) {
      var warn = el("div", "rt-error");
      warn.textContent = 'Missing data-risk-key (e.g. data-risk-key="security").';
      container.appendChild(warn);
      return { destroy: function () {} };
    }
    /* Persistent state structure:
        state[categoryKey][controlId] = "enabled" | "disabled" */
    var state = loadState(storageKey);
    var catState = getOrCreateCategoryState(state, riskKey);
    /* destroyFns stores cleanup handlers for all event listeners.*/
    var destroyFns = [];
    function renderTable(defRows) {
      var table = el("table", "rt-table");
      /* Table header. */
      var thead = document.createElement("thead");
      var trh = document.createElement("tr");
      ["Control", "Status", "Pros", "Cons", "Danger %"].forEach(function (name) {
        trh.appendChild(el("th", "", name));
      });
      thead.appendChild(trh);
      table.appendChild(thead);
      /* Table body. */
      var tbody = document.createElement("tbody");
      (defRows || []).forEach(function (row) {
        var id = String(row.id || "").trim();
        var label = String(row.label || row.name || id || "Unnamed");
        if (!id) {
          id = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        }
        var defaultStatus = normalizeStatus(row.default);
        var saved = catState[id];
        var status = normalizeStatus(saved != null ? saved : defaultStatus);
        var tr = document.createElement("tr");
        /* Control label. */
        tr.appendChild(el("td", "rt-control", label));
        /* Status radios. */
        var tdStatus = el("td", "rt-status");
        var groupName = "rt_" + riskKey + "_" + id;
        function makeRadio(value, text) {
          var lbl = el("label", "rt-radio");
          var input = document.createElement("input");
          input.type = "radio";
          input.name = groupName;
          input.value = value;
          input.checked = status === value;
          var span = document.createElement("span");
          span.textContent = text;
          lbl.appendChild(input);
          lbl.appendChild(span);
          var onChange = function () {
            if (!input.checked) return;
            var newStatus = normalizeStatus(input.value);
            catState[id] = newStatus;
            saveState(storageKey, state);
            applyStrike(tdPros, tdCons, newStatus);
            tdDanger.textContent = (newStatus === "enabled" ? 0 : baseDanger) + "%";
            /* Optional event hook for downstream panes (e.g., future risk matrix).*/
            if (api && api.events && api.events.emit) {
              api.events.emit("risk:changed", { category: riskKey, id: id, value: newStatus });
            }
          };
          input.addEventListener("change", onChange);
          destroyFns.push(function () { input.removeEventListener("change", onChange); });
          return lbl;
        }
        tdStatus.appendChild(makeRadio("enabled", "Enabled"));
        tdStatus.appendChild(makeRadio("disabled", "Disabled"));
        tr.appendChild(tdStatus);
        /* Pros / Cons cells. */
        var tdPros = document.createElement("td");
        tdPros.appendChild(makeList(row.pros || []));
        tr.appendChild(tdPros);
        var tdCons = document.createElement("td");
        tdCons.appendChild(makeList(row.cons || []));
        tr.appendChild(tdCons);
        applyStrike(tdPros, tdCons, status);
        /* Danger column (0 if enabled, JSON value if disabled). */
        var baseDanger = getDangerPercent(row);
        var actualDanger = status === "enabled" ? 0 : baseDanger;
        var tdDanger = el("td", "rt-danger", String(actualDanger) + "%");
        tr.appendChild(tdDanger);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
    }
    fetchJSON(dataUrl).then(function (allTables) {
      var rows = allTables && allTables[riskKey] ? allTables[riskKey] : null;
      if (!rows || rows.length === 0) {
        var empty = el("div", "rt-error");
        empty.textContent = 'No rows found for "' + riskKey + '" in ' + dataUrl + ".";
        container.appendChild(empty);
        return;
      }
      renderTable(rows);
    }).catch(function (err) {
      var box = el("div", "rt-error");
      box.textContent = String(err && (err.message || err));
      container.appendChild(box);
    });
    return {
      destroy: function () {
        destroyFns.forEach(function (fn) { try { fn(); } catch (_e) {} });
        destroyFns = [];
      }
    };
  }

  /* Pane registration entry point.*/
  window.Panes.register("risk-table", function (container, api) {
    container.classList.add("pane");
    container.classList.add("pane-host--risk-table");
    return init(container, api);
  });
})();