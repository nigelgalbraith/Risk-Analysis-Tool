(function () {
  "use strict";

  /**
   * Extracts the service key from the URL query string.
   *
   * Expected format:
   *   riskPage.html?service=<key>
   *
   * Returns:
   *   - Lowercased service key string
   *   - Empty string if parameter is missing
   *
   * Note:
   *   The returned key must match keys defined in:
   *     - text/intro.js
   *     - risk table data source used by RiskTablePane
   */
  function get_service_key() {
    var params = new URLSearchParams(window.location.search);
    var raw = (params.get("service") || "").trim();
    return raw;
  }

  /**
   * Converts a string to display-friendly title case.
   *
   * Used for:
   *   - Page heading
   *   - Document title
   *   - Risk table display title
   */
  function title_case(s) {
    return (s || "").replace(/(^|\s|[-_])\w/g, function (m) {
      return m.toUpperCase();
    });
  }

  /**
   * Initializes the dynamic page configuration.
   *
   * Responsibilities:
   *   1. Read service key from URL
   *   2. Assign service key to pane host data attributes
   *   3. Update page heading and document title
   *
   * Execution order requirement:
   *   This script must load BEFORE PanesCore.js,
   *   so that panes receive correct dataset values during bootstrap.
   */
  function main() {
    var service = get_service_key();

    var intro_host = document.getElementById("introHost");
    var table_host = document.getElementById("tableHost");
    var summary_host = document.getElementById("summaryHost");
    var page_title = document.getElementById("pageTitle");

    /*
      If no service parameter is provided,
      render a minimal error state and prevent pane initialization
      from running with undefined keys.
    */
    if (!service) {
      if (page_title) page_title.textContent = "Risk Analysis";
      document.title = "Risk Analysis";

      if (intro_host) {
        intro_host.innerHTML =
          "<p>Missing required URL parameter: <code>?service=</code></p>";
      }

      return;
    }

    /*
      Configure Intro Pane:
      Sets data-intro-key which IntroPane reads
      during PanesCore bootstrap.
    */
    if (intro_host && intro_host.dataset) {
      intro_host.dataset.introKey = service;
    }

    /*
      Configure Risk Table Pane:
      Sets:
        - data-risk-key (data source key)
        - data-title (display title)
    */
    if (table_host && table_host.dataset) {
      table_host.dataset.riskKey = service;
      table_host.dataset.title =
        title_case(service) + " Risk Table";
    }

    /*
      Configure Risk Summary Pane:
      Sets data-risk-key which RiskSummaryPane reads
      during PanesCore bootstrap.
    */
    if (summary_host && summary_host.dataset) {
      summary_host.dataset.riskKey = service;
    }

    /*
      Update visible page heading and browser tab title.
    */
    if (page_title) {
      page_title.textContent =
        title_case(service) + " Risk Analysis";
    }

    document.title =
      title_case(service) + " Risk Analysis";
  }

  /*
    Execute immediately.
    No DOMContentLoaded listener required because:
      - Script is loaded before PanesCore
      - Only sets dataset values
      - PanesCore handles DOMContentLoaded bootstrap
  */
  main();
})();