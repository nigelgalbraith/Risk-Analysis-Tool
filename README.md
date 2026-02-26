# Risk Analysis Tool

Risk Analysis Tool is a lightweight, static web application for scoring IT and support-related risk scenarios using structured control checklists.

It is fully client-side, JSON-driven, and runs locally in the browser. No backend or database required.

Selections are stored in localStorage, allowing you to close the browser and return without losing state.

---

## What It Does

- Provides multiple structured “risk analysis” tools
- Each tool consists of configurable controls
- Disabling controls increases total danger %
- Automatically generates a Risk Summary (Low → Critical)
- Persists state per service using localStorage
- Includes light/dark theme toggle
- Runs entirely offline

---

## Core Concept

Each service (e.g. security, backups, wifi) defines:

- A set of controls
- A danger weight for each control
- Default state (enabled/disabled)
- Pros and cons per control

If a control is disabled, its danger value contributes to the total score.

Total danger is capped at 100%.

The final score maps to a summary message defined in configuration.

---

## Pages

### index.html

- Renders the home page
- Displays service cards
- Loads intro content
- Links to individual risk pages

### riskPage.html?service=<key>

Single reusable dynamic page.

Examples:

- riskPage.html?service=security
- riskPage.html?service=wifiInternet
- riskPage.html?service=backups

The page reads the `service` query parameter and loads the correct configuration from JSON.

---

## Data Sources

### data/riskTables.json

Defines all services and their controls.

Each control includes:

- `id`
- `label`
- `default` ("enabled" or "disabled")
- `danger` (integer weight)
- `pros` (array)
- `cons` (array)

Example structure:

```json
"security": [
  {
    "id": "antivirus",
    "label": "Antivirus Installed",
    "default": "enabled",
    "danger": 20,
    "pros": ["Prevents malware"],
    "cons": ["May slow system slightly"]
  }
]
```

---

### data/riskSummaryMessages.json

Defines score ranges and associated severity messages.

Example:

```json
{
  "min": 0,
  "max": 25,
  "label": "Low Risk",
  "message": "System is reasonably protected."
}
```

---

## Persistence

State is stored in:

```
localStorage key: riskAnalysisState.v1
```

Structure:

```
state[serviceKey][controlId] = "enabled" | "disabled"
```

Each service maintains its own independent saved state.

---

## Included Risk Tools

Currently defined services include:

- security
- backups
- emailAccounts
- setupTroubleshooting
- virusCleanup
- dataBackup
- computerRepair
- wifiInternet
- printerSetup

New tools can be added by updating the JSON and intro metadata.

---

## Project Structure

```
RiskAnalysis/
│
├── index.html
├── riskPage.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── core/
│   │   └── PanesCore.js
│   ├── panes/
│   │   ├── IntroPane.js
│   │   ├── CardsPane.js
│   │   ├── RiskTablePane.js
│   │   └── SummaryPane.js
│   ├── pages/
│   │   ├── indexPage.js
│   │   └── riskPage.js
│   └── themeToggle.js
│
├── data/
│   ├── riskTables.json
│   └── riskSummaryMessages.json
│
├── text/
│   ├── intro.js
│   └── introCards.js
│
├── images/
│   └── (icons + favicons)
│
└── PythonFiles/
    └── Image-Optimizer.py
```

---

## Run Locally

Because the project uses ES modules (`import` statements), serve it over HTTP.

### Option 1: Python

```bash
cd RiskAnalysis
python -m http.server 8000
```

Then open:

```
http://localhost:8000/index.html
```

---

### Option 2: Any Static Server

- VS Code Live Server
- Nginx
- Apache
- Any simple static file server

---

## Adding a New Risk Tool

1. Add a new key to `data/riskTables.json`.

2. Add a matching card in `text/introCards.js`.

3. (Optional) Add intro content in `text/intro.js`.

No changes to HTML or core JS are required.

The page automatically renders any valid service key.

---

## Asset Optimization (Optional)

`PythonFiles/Image-Optimizer.py` is included to:

- Generate optimized images
- Produce favicon sets
- Organize original vs optimized assets

The web application itself does not require Python.

---

## Design Goals

- Fully static
- No backend dependencies
- JSON-driven configuration
- Modular pane-based UI architecture
- Simple scoring logic
- Easy extensibility
- Clean, readable structure

---

## License

MIT License.
Anyone is free to use, modify, and improve this project.
