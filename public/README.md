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

Defines home-page metadata and the list of available Risk Analyses.

Each Risk Analysis entry includes:

- `id`
- `title`
- `description`
- `path`
- `link`
- `introHtml`

Example structure:

```json
{
  "home": {
    "title": "Risk Analysis Tool",
    "introHtml": "<p>Pick a risk analysis tool to get started.</p>"
  },
  "analyses": [
    {
      "id": "security",
      "title": "Security Risk Analysis",
      "description": "Review core security protections.",
      "path": "riskTables/security.json",
      "link": "index.html?page=risk&service=security",
      "introHtml": "<p>This tool helps you review core security protections.</p>"
    }
  ]
}
```

Each individual Risk Analysis control file lives under `data/riskTables/`.

Example control structure:

```json
[
  {
    "id": "mfa",
    "label": "Enable MFA",
    "default": "disabled",
    "likelihood": {
      "exploitability": 5,
      "exposure": 5,
      "prevalence": 5
    },
    "impact": {
      "confidentiality": 5,
      "integrity": 4,
      "availability": 3
    },
    "pros": ["Stops most credential-stuffing attacks"],
    "cons": ["Adds friction for users"]
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

New tools can be added by creating a new individual Risk Analysis JSON file and adding a registry entry.

---

## Project Structure

```
RiskAnalysis/
│
├── index.html
├── app.py
├── public/
├── editor/
├── backups/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
│
├── public/index.html
│
├── public/css/
│   └── style.css
│
├── public/js/
│   ├── core/
│   │   ├── appShell.js
│   │   ├── eventBus.js
│   │   ├── pageLifecycle.js
│   │   ├── pageRuntime.js
│   │   ├── riskData.js
│   │   ├── riskValidation.js
│   │   └── sharedState.js
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
├── public/data/
│   ├── riskDefinitions.json
│   ├── riskTables.json
│   ├── riskTables/
│   │   └── <risk-id>.json
│   └── riskSummaryMessages.json
│
├── public/images/
│   └── (icons + favicons)
│
└── public/PythonFiles/
    └── Image-Optimizer.py
```

---

## Run Locally

Because the project uses ES modules (`import` statements), serve it over HTTP.

### Option 1: Python

```bash
cd RiskAnalysisTool-2/public
python -m http.server 8000
```

Then open:

```
http://localhost:8000/
```

---

### Option 2: Any Static Server

- VS Code Live Server
- Nginx
- Apache
- Any simple static file server

---

## Adding a New Risk Tool

1. Create `public/data/riskTables/<risk-id>.json`.

2. Add a matching entry to `public/data/riskTables.json`.

3. Put home-card metadata and intro content on that registry entry.

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
