# AI Civic Problem Predictor

An interactive civic operations prototype for reporting and tracking complaints, reviewing transparent zone risk scores, and exploring local complaint analytics.

An innovative, 100% static, SIH-level civic-management prototype designed to predict potential civic infrastructure failures before they escalate into emergencies.

> **Prototype notice:** The weighted risk score is an explainable heuristic, not a trained machine-learning model. Seed records, population figures, infrastructure estimates, map shapes, and map marker positions are illustrative demo data. The project is not connected to verified municipal boundaries, sensors, weather services, or live authority systems.

## 🏆 Smart India Hackathon (SIH) Concept

### Problem Statement
Traditional municipal civic management systems are **reactive**. Municipalities wait for infrastructure failures (for example pipe bursts, drainage overflows, pothole clusters, and garbage accumulation) to occur, after which citizens file complaints, leading to delayed emergency repairs, elevated municipal costs, and severe public inconvenience.

### Proposed Solution
**AI Civic Problem Predictor** shifts municipal management from **reactive repair** to **proactive prediction**. By aggregating multi-indicator telemetry—such as historical complaints, complaint surge frequency, weather or rainfall patterns, service delays, and population activity—the system calculates a **Civic Risk Score (0–100%)** across city zones and alerts authorities to deploy preventive maintenance before problems escalate.

## Features

- Complaint form with category, title, description, zone, location, date/time, priority, validation, and optional photo.
- Unique complaint IDs, status history, department assignment, and complaint-ID tracking.
- IndexedDB for browser complaint records and photo blobs, with localStorage cache and preferences.
- Authority dashboard with actual stored-record counts, filters, sorting, complaint details, status and department controls, local backup/restore, and optional backend connection.
- Explainable risk scores (0–100) using complaint frequency, severity, historical estimates, population estimates, infrastructure vulnerability, recent trends, and unresolved reports.
- Leaflet schematic risk map; every shape and complaint marker is simulated and is not geocoded.
- Chart.js analytics from stored complaints, daily/weekly trends, filters, CSV export, and PDF report.
- Event-based notification history, read state, and an explicitly simulated demo mode.
- Static HTML/CSS/Vanilla JavaScript frontend remains compatible with GitHub Pages.
- Optional Node.js/Express API with JSON persistence, validation, CORS allowlisting, admin bearer-token protection, and private image storage.

## Run the frontend

The site has no frontend build step. Open `index.html` or serve the project root with a local static-file server such as the VS Code Live Server extension. The initial seeded dataset is marked as demo data; new reports are marked as user records. Browser-only records do not synchronize across browsers or devices.

The frontend is deployed at:

<https://siddharth440.github.io/AI-civic-problem-predictor/>

GitHub Pages can serve the static frontend but cannot run the Express API.

## Optional Express backend

Requires Node.js 20.6 or newer.

```powershell
npm install
Copy-Item .env.example .env
```

Replace `ADMIN_API_TOKEN` in the local `.env` with a random secret of at least 32 characters. Keep `.env` private; it is ignored by Git. Set `FRONTEND_ORIGINS` to the exact allowed browser origins, comma-separated. The example includes the GitHub Pages origin and localhost development origins.

Start the service:

```powershell
npm start
```

Health check: `http://localhost:3000/api/health`

For Render or another Node host:

1. Deploy this repository as a Node web service using `npm install` and `npm start`.
2. Set `FRONTEND_ORIGINS`, `ADMIN_API_TOKEN`, and `DATA_FILE` in the host's environment settings.
3. Configure persistent disk storage and point `DATA_FILE` to that disk (for example, `/var/data/complaints.json`). The default filesystem on many free hosting plans is ephemeral.
4. In `js/config.js`, set `API_BASE_URL` to the deployed HTTPS API origin, then publish the static frontend to GitHub Pages.
5. On the dashboard, enter the admin token to sync backend records and enable protected status/assignment updates. The token is held in page memory only and is not stored in source code or localStorage.

The public API accepts complaint submission and ID-based public status tracking; citizen names are excluded from public responses. Authority listing, edits, and deletion require the bearer token. Uploads accept JPEG, PNG, and WebP up to 5 MB, validate the declared type against the file signature, and are stored outside the public web root. Browser-only photos remain in IndexedDB and are not included in JSON backups.

API endpoints:

- `GET /api/health`
- `POST /api/complaints`
- `GET /api/complaints/:id`
- `POST /api/complaints/:id/image`
- `GET /api/admin/complaints` (bearer token)
- `PATCH /api/admin/complaints/:id` (bearer token)
- `DELETE /api/admin/complaints/:id` (bearer token)

## Storage, backups, and limitations

- Without `API_BASE_URL`, complaints and images are stored only in the current browser. Clearing browser data can remove them.
- The dashboard's JSON backup covers complaint, prediction, alert, and zone records; photos are not embedded.
- Zone population and infrastructure values are configurable demo estimates in `js/data.js`.
- The optional JSON backend requires persistent storage supplied by the hosting provider; it is a lightweight prototype, not a horizontally scaled database.
- Map zones and complaint positions are deliberately schematic. No real municipal geography or incident coordinates are claimed.
- Demo simulation events are generated locally and must not be interpreted as live sensor events.

## Tests

```powershell
npm test
```
