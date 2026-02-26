/*
  homePage.js

  Single entry point for index.html.

  Responsibilities:
    - Load shared helpers
    - Load pane framework
    - Load text data sources required by panes
    - Load pane implementations used on the home page
    - Load theme behaviour
    - Allow PanesCore to auto-bootstrap on DOMContentLoaded

  Notes:
    - No dynamic dataset configuration is required on this page.
    - PanesCore automatically instantiates panes marked with data-pane.
    - This file exists for architectural consistency with other pages.
*/

import "../core/helpers.js";
import "../core/PanesCore.js";

/*
  Data sources:
  These provide the content used by IntroPane and IntroCardPane.
*/
import "../../text/intro.js";
import "../../text/introCards.js";

/*
  Pane implementations:
  These register themselves with PanesCore when imported.
*/
import "../panes/IntroPane.js";
import "../panes/IntroCardPane.js";

/*
  Theme behaviour:
  Attaches click handler + persisted preference behaviour.
*/
import "../themeToggle.js";

/*
  No explicit initialization required.

  PanesCore:
    - Registers panes when modules are imported.
    - Bootstraps automatically on DOMContentLoaded.

  This file intentionally contains no runtime logic.
*/