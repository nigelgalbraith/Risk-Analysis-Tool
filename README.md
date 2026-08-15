# RiskAnalysisTool

RiskAnalysisTool is a static-facing risk analysis application backed by JSON data. The public site lets users review risk controls, toggle control status, and see calculated risk summaries in the browser. The editor runs through the Flask API in `app.py` so risk tables can be created and maintained from the same project.

## Running the Static Site

For viewing and testing the public-facing site only:

```bash
python3 -m http.server 8000 --directory public
```

Open:

```text
http://localhost:8000
```

This mode serves the static app and data files. It cannot perform editor writes because the Flask editor API is not running.

## Running with Docker

Build and run the Flask app, editor, and public site:

```bash
docker compose up --build
```

Open:

```text
http://localhost:5000
```

The Compose file exposes port `5000:5000`, uses the configured container name `risk-analysis-tool`, and mounts:

```text
./public/data:/app/public/data
./backups:/app/backups
```

Editor writes therefore persist back into the project data directory, and generated backups are written under `backups/`.

Stop the container:

```bash
docker compose down
```

For a clean rebuild:

```bash
docker compose build --no-cache
docker compose up
```

If the configured container name conflicts with an existing stopped container:

```bash
docker rm -f risk-analysis-tool
```

## Editor Workflow

The editor is available from the Flask app at:

```text
http://localhost:5000/editor
```

### Add New Risk Analysis

- Set the risk analysis ID, title, and description.
- Add one or more controls.
- Remove additional controls if needed.
- Create the risk analysis.

Each control uses the same JSON structure as existing risk table rows:

- `id`
- `label`
- `default`
- `likelihood`
- `impact`
- `pros`
- `cons`

### Edit Existing Risk Analysis

- Select an existing risk analysis.
- Select and edit controls.
- Add controls.
- Remove controls, except the final remaining control.
- Save the whole risk analysis.

There is no separate Apply button. `Save Risk Analysis` automatically applies the currently displayed control values to the in-memory risk table before writing the complete controls array through the existing API.

## Data Storage

Primary data lives in:

```text
public/data/riskTables.json
public/data/riskTables/
```

`public/data/riskTables.json` is the registry/index for the available risk analyses. It stores metadata such as ID, title, description, path, link, and intro HTML.

`public/data/riskTables/<id>.json` stores the individual control rows for one risk analysis.

Other data files include:

```text
public/data/riskDefinitions.json
public/data/riskSummaryMessages.json
```

These define factor descriptions and risk summary message ranges used by the public site.

## Backups

The backend writes JSON atomically and keeps local backups before replacing existing data files. Risk table backups are written under:

```text
backups/riskTables/
```

Registry backups are written under:

```text
backups/
```

Backups are generated runtime artifacts and are ignored by Git except for `backups/.gitkeep`.

## Project Structure

```text
public/
  index.html
  css/
  js/
    core/
    pages/
    panes/
  data/
    riskTables.json
    riskTables/
    riskDefinitions.json
    riskSummaryMessages.json
editor/
  index.html
  css/
  js/
    core/
    pages/
    panes/
backups/
  .gitkeep
app.py
Dockerfile
docker-compose.yml
requirements.txt
```

The JavaScript is organized around small `core`, `pages`, and `panes` modules. The public app reads JSON and stores user selections in browser localStorage. The editor uses the Flask API to validate and write the same JSON files.

## Static Public App Behavior

The public app:

- Lists available risk analyses from `riskTables.json`.
- Loads individual risk control files from `public/data/riskTables/`.
- Stores user control selections in localStorage.
- Calculates risk from likelihood and impact values.
- Maps total risk to messages from `riskSummaryMessages.json`.
- Supports light and dark themes.

## License

MIT License.
