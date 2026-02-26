// site/js/RiskSummaryPane.js
// PanesCore pane: data-pane="risk-summary"
// Shows total danger (sum of disabled control danger values) + message based on configured ranges.

(function () {
  "use strict";

  if (!window.Panes || !window.Panes.register) {
    throw new Error("RiskSummaryPane requires PanesCore (Panes.register not found).");
  }

  function safeJSONParse(raw, fallback) {
    try { return JSON.parse(raw); } catch (_e) { return fallback; }
  }

  function loadState(storageKey) {
    var raw = null;
    try { raw = window.localStorage.getItem(storageKey); } catch (_e) { raw = null; }
    return raw ? safeJSONParse(raw, {}) : {};
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

  function normalizeStatus(v) {
    return v === "enabled" ? "enabled" : "disabled";
  }

  function getDangerPercent(row) {
    var n = Number(row && row.danger);
    if (!isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return Math.round(n);
  }

  function findMessage(ranges, total) {
    var i = 0;
    for (i = 0; i < (ranges || []).length; i++) {
      var r = ranges[i] || {};
      var min = Number(r.min);
      var max = Number(r.max);
      if (!isFinite(min)) min = 0;
      if (!isFinite(max)) max = 100;
      if (total >= min && total <= max) return r;
    }
    return null;
  }

  function computeTotalDisabledDanger(rows, catState) {
    var total = 0;

    (rows || []).forEach(function (row) {
      var id = String(row.id || "").trim();
      var defaultStatus = normalizeStatus(row.default);
      var saved = catState ? catState[id] : null;
      var status = normalizeStatus(saved != null ? saved : defaultStatus);

      /*
        Only disabled controls contribute danger.
        Enabled controls contribute 0%.
      */
      if (status !== "enabled") total += getDangerPercent(row);
    });

    if (total > 100) total = 100;
    return total;
  }

    function render(container, riskKey, total, msgObj) {
        container.innerHTML = "";

        container.appendChild(el("h2", "rt-title", "Risk Summary"));

        var table = el("table", "rt-table");

        var thead = document.createElement("thead");
        var headRow = document.createElement("tr");

        [ "Message", "Risk Level", "Total Danger"].forEach(function (text) {
            headRow.appendChild(el("th", "", text));
        });

        thead.appendChild(headRow);
        table.appendChild(thead);

        var tbody = document.createElement("tbody");
        var bodyRow = document.createElement("tr");

        bodyRow.appendChild(el("td", "rs-message", msgObj && msgObj.message ? msgObj.message : ""));
        bodyRow.appendChild(el("td", "rs-level", msgObj && msgObj.title ? msgObj.title : ""));
        bodyRow.appendChild(el("td", "rs-total", String(total) + "%"));

        tbody.appendChild(bodyRow);
        table.appendChild(tbody);

        container.appendChild(table);
    }

  function init(container, api) {
    var ds = container.dataset || {};
    var riskKey = ds.riskKey || "";
    var dataUrl = ds.dataUrl || "data/riskTables.json";
    var messagesUrl = ds.messagesUrl || "data/riskSummaryMessages.json";
    var storageKey = ds.storageKey || "riskAnalysisState.v1";

    if (!riskKey) {
      container.innerHTML = '<div class="rs-error">Missing data-risk-key.</div>';
      return { destroy: function () {} };
    }

    var rowsCache = null;
    var rangesCache = null;

    function rebuild() {
      var state = loadState(storageKey);
      var catState = (state && state[riskKey]) ? state[riskKey] : {};
      var total = computeTotalDisabledDanger(rowsCache || [], catState);
      var msgObj = findMessage(rangesCache || [], total);
      render(container, riskKey, total, msgObj);
    }

    function loadAll() {
      return Promise.all([fetchJSON(dataUrl), fetchJSON(messagesUrl)]).then(function (res) {
        var allTables = res[0] || {};
        rangesCache = res[1] || [];
        rowsCache = allTables[riskKey] || [];
        rebuild();
      }).catch(function (err) {
        container.innerHTML = '<div class="rs-error">' + String(err && (err.message || err)) + "</div>";
      });
    }

    /*
      Live update: RiskTablePane emits "risk:changed" whenever a control is toggled.
      Rebuild from persisted state to stay consistent and simple.
    */
    var onChanged = function (ev) {
        if (!ev || !ev.detail || ev.detail.category !== riskKey) return;
        rebuild();
    };

    if (api && api.events && api.events.on) api.events.on("risk:changed", onChanged);

    loadAll();

    return {
      destroy: function () {
        if (api && api.events && api.events.off) api.events.off("risk:changed", onChanged);
      }
    };
  }

  window.Panes.register("risk-summary", function (container, api) {
    container.classList.add("pane");
    container.classList.add("pane-host--risk-summary");
    return init(container, api);
  });
})();