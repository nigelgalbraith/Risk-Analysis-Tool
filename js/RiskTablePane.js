// site/js/RiskTablePane.js
// PanesCore pane: data-pane="risk-table"
// Static site: loads definitions from JSON and persists selections in localStorage.

(function () {
  "use strict";
  if (!window.Panes || !window.Panes.register) throw new Error("RiskTablePane requires PanesCore (Panes.register not found).");


  function safeJSONParse(raw, fallback) {
    try { return JSON.parse(raw); } catch (_e) { return fallback; }
  }


  function loadState(storageKey) {
    var raw = null;
    try { raw = window.localStorage.getItem(storageKey); } catch (_e) { raw = null; }
    return raw ? safeJSONParse(raw, {}) : {};
  }


  function saveState(storageKey, stateObj) {
    try { window.localStorage.setItem(storageKey, JSON.stringify(stateObj)); } catch (_e) {}
  }


  function getOrCreateCategoryState(stateObj, categoryKey) {
    if (!stateObj[categoryKey] || typeof stateObj[categoryKey] !== "object") stateObj[categoryKey] = {};
    return stateObj[categoryKey];
  }


  function fetchJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("Failed to load JSON: " + url + " (" + res.status + ")");
      return res.json();
    });
  }


  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }


  function makeList(items) {
    var ul = el("ul", "rt-list");
    (items || []).forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = String(t);
      ul.appendChild(li);
    });
    return ul;
  }


  function normalizeStatus(value) {
    return value === "enabled" ? "enabled" : "disabled";
  }


  function applyStrike(prosCell, consCell, status) {
    var isEnabled = status === "enabled";
    if (prosCell) prosCell.classList.toggle("rt-strike", !isEnabled);
    if (consCell) consCell.classList.toggle("rt-strike", isEnabled);
  }


  function init(container, api) {
    var ds = container.dataset || {};
    var riskKey = ds.riskKey || ds.category || "";
    var title = ds.title || "Risk Table";
    var dataUrl = ds.dataUrl || "data/riskTables.json";
    var storageKey = ds.storageKey || "riskAnalysisState.v1";
    container.innerHTML = "";
    var h = el("h2", "rt-title", title);
    container.appendChild(h);
    if (!riskKey) {
      var warn = el("div", "rt-error");
      warn.textContent = 'Missing data-risk-key (e.g. data-risk-key="security").';
      container.appendChild(warn);
      return { destroy: function () {} };
    }
    var state = loadState(storageKey);
    var catState = getOrCreateCategoryState(state, riskKey);
    var destroyFns = [];
    function renderTable(defRows) {
      var table = el("table", "rt-table");
      var thead = document.createElement("thead");
      var trh = document.createElement("tr");
      ["Control", "Status", "Pros", "Cons"].forEach(function (name) { trh.appendChild(el("th", "", name)); });
      thead.appendChild(trh);
      table.appendChild(thead);
      var tbody = document.createElement("tbody");
      (defRows || []).forEach(function (row) {
        var id = String(row.id || "").trim();
        var label = String(row.label || row.name || id || "Unnamed");
        if (!id) id = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        var defaultStatus = normalizeStatus(row.default);
        var status = normalizeStatus(catState[id] || defaultStatus);
        var tr = document.createElement("tr");
        var tdControl = el("td", "rt-control", label);
        tr.appendChild(tdControl);
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
            if (api && api.events && api.events.emit) api.events.emit("risk:changed", { category: riskKey, id: id, value: newStatus });
          };
          input.addEventListener("change", onChange);
          destroyFns.push(function () { input.removeEventListener("change", onChange); });
          return lbl;
        }
        tdStatus.appendChild(makeRadio("enabled", "Enabled"));
        tdStatus.appendChild(makeRadio("disabled", "Disabled"));
        tr.appendChild(tdStatus);
        var tdPros = document.createElement("td");
        tdPros.appendChild(makeList(row.pros || []));
        tr.appendChild(tdPros);
        var tdCons = document.createElement("td");
        tdCons.appendChild(makeList(row.cons || []));
        tr.appendChild(tdCons);
        applyStrike(tdPros, tdCons, status);
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
    return { destroy: function () { destroyFns.forEach(function (fn) { try { fn(); } catch (_e) {} }); destroyFns = []; } };
  }


    window.Panes.register("risk-table", function (container, api) {
    container.classList.add("pane");
    container.classList.add("pane-host--risk-table");
    return init(container, api);
    });
})();