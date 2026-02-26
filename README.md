# Risk Analysis Tool

Risk Analysis Tool is a lightweight, static web app for quickly scoring IT/support risk scenarios using simple control checklists.

It’s JSON-driven, runs locally in a browser, and stores selections in `localStorage` so you can return later without losing state.

---

## What It Does

- Provides multiple “risk analysis” tools (security, backups, email accounts, etc.)
- Each tool is a checklist of controls/options
- Disabling a control increases the overall **danger %**
- Generates a **Risk Summary** (Low → Critical) based on total danger
- Persists your selections per service in the browser (localStorage)
- Includes a light/dark theme toggle

---

## How It Works

### Pages

- `index.html`
  - Main menu
  - Renders intro text + service cards

- `riskPage.html?service=<key>`
  - Single reusable risk page
  - Example:
    - `riskPage.html?service=security`
    - `riskPage.html?service=wifiInternet`

### Data Sources

- `data/riskTables.json`
  - Contains the risk controls for each service key
  - Each control has:
    - `id`
    - `label`
    - `default` (`enabled` / `disabled`)
    - `danger` (adds to total if disabled)
    - `pros` / `cons` lists

- `data/riskSummaryMessages.json`
  - Defines score ranges and messages (Low/Moderate/High/Critical)

### Scoring Rules (current behaviour)

- **Only disabled controls contribute danger**
- Total danger is summed and capped at **100%**
- Summary message is selected by matching the total to a configured range

### Persistence

Selections are saved to:

- `localStorage` key: `riskAnalysisState.v1`

Structure:

- `state[serviceKey][controlId] = "enabled" | "disabled"`

---

## Included Risk Tools (Services)

Defined in `data/riskTables.json` and linked from the home page cards:

- `security`
- `backups`
- `emailAccounts`
- `setupTroubleshooting`
- `virusCleanup`
- `dataBackup`
- `computerRepair`
- `wifiInternet`
- `printerSetup`

---

## Run Locally

Because this repo uses ES module imports (`import ... from "./js/..."`), you should serve it over HTTP (opening the HTML file directly may break imports in some browsers).

### Option 1: Python (recommended)

```bash
cd RiskAnalysis
python -m http.server 8000
