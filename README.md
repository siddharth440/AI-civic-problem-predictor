# AI Civic Problem Predictor

> **Predict civic problems before they become emergencies.**

An innovative, 100% static, SIH-level civic-management prototype designed to predict potential civic infrastructure failures before they escalate into emergencies.
 
---

## 🏆 Smart India Hackathon (SIH) Concept

### Problem Statement
Traditional municipal civic management systems are **reactive**. Municipalities wait for infrastructure failures (e.g. pipe bursts, drainage overflows, massive pothole clusters, garbage accumulation) to occur, after which citizens file complaints, leading to delayed emergency repairs, elevated municipal costs, and severe public inconvenience.
  
### Proposed Solution    
**AI Civic Problem Predictor** shifts municipal management from **reactive repair** to **proactive prediction**. By aggregating multi-indicator telemetry—such as historical complaints, complaint surge frequency, weather/rainfall forecasts, service delays, and population activity—the system calculates a **Civic Risk Score (0–100%)** across city zones and alerts authorities to deploy preventive maintenance *before* problems occur.

```text
Traditional System:
Problem Occurs → Citizen Complains → Verification → Delayed Response → Problem Worsens

Our Proactive System:
Historical Data → AI Analysis → Risk Prediction → Authority Alert → Preventive Action → Problem Avoided
```

---

## 🚀 Key Features

1. **Explainable AI Risk Engine (`js/prediction.js`)**:
   Calculates a multi-indicator weighted score matrix:
   - Historical Complaints (30%)
   - Recent Complaint Surge (20%)
   - Weather / Rainfall Risk (15%)
   - Previous Incident Record (15%)
   - Population & Footfall Activity (10%)
   - Service / Maintenance Delay (10%)

2. **Municipal Authority Dashboard (`dashboard.html`)**:
   - Executive metric overview (Total Reports, Active Tasks, Predicted Problems, High-Risk Zones, Prevented Incidents).
   - Priority Action dispatch table with status toggles (`Predicted`, `Assigned`, `In Progress`, `Resolved`, `Prevented`) persisted in `localStorage`.

3. **Citizen Reporting Portal (`citizen.html`)**:
   - Form with validation, severity classification, landmark tagging, and photo evidence attachment.
   - Auto-generates unique Report IDs (e.g., `REP-8491`) and automatically recalculates zone AI risk scores upon submission.

4. **AI Prediction Dashboard (`predictions.html`)**:
   - Filterable prediction cards by category (`Garbage`, `Potholes`, `Water Leakage`, `Drainage`, `Flooding`, `Streetlights`).
   - Sorting options by risk score, confidence, and date.
   - Interactive **"Why this prediction?"** explainable AI breakdown modal showing exact point contributions.

5. **Interactive Civic Risk Map (`map.html`)**:
   - Vector SVG city map featuring 6 dynamic zones (Zone 1 to Zone 6).
   - Dynamic color-coded risk levels (`Low`, `Medium`, `High`, `Critical`).
   - Clickable zones opening an inspector drawer with demographic and risk breakdown metrics.

6. **Analytics & Performance Insights (`analytics.html`)**:
   - Interactive Chart.js visualizers comparing reactive complaints vs proactive AI predictions, issue category breakdowns, and zone risk distribution.

7. **Alert & Notification Center (`alerts.html`)**:
   - High-priority system dispatches with filter and mark-as-read capabilities.

8. **Live Simulation Telemetry Mode**:
   - Real-time simulated sensor pulses every 6 seconds, updating risk metrics and firing live toast notifications.

---

## 🛠️ Technology Stack

- **HTML5 & CSS3**: Modern Gov-Tech UI design system, glassmorphism header, dark/light theme switching, responsive grid system.
- **Vanilla JavaScript (ES6+)**: Zero backend, zero npm build step, pure static execution.
- **Web Storage API (`localStorage`)**: Persists citizen reports, prediction states, authority action updates, alerts, and theme preferences across browser refreshes.
- **Chart.js CDN**: High-performance interactive analytics charts.

---

## 📁 File & Folder Architecture

```text
AI-Civic-Problem-Predictor/
├── index.html              # Landing Page
├── dashboard.html          # Authority Dashboard
├── citizen.html            # Citizen Reporting Portal
├── predictions.html        # AI Prediction Dashboard
├── map.html                # Interactive Risk Map
├── analytics.html          # Analytics & Insights
├── alerts.html             # Notification Center
├── about.html              # Project Info & Innovation
├── css/
│   └── style.css           # Design System & Theme Stylesheet
├── js/
│   ├── data.js             # Data Store & LocalStorage Seed Engine
│   ├── prediction.js       # Explainable Risk Engine
│   ├── app.js              # Global Theme, Live Sim & Toast Engine
│   ├── dashboard.js        # Dashboard Controller
│   ├── citizen.js          # Citizen Form & Validation Controller
│   ├── predictions.js      # Prediction Filter & Modal Controller
│   ├── map.js              # Interactive SVG Map Controller
│   ├── analytics.js        # Chart.js Visualizer Controller
│   └── alerts.js           # Alerts Manager
└── README.md               # Presentation Documentation
```

---

## 🌐 How to Run Locally & Deploy to GitHub Pages

### Running Locally
1. Clone or download this project folder.
2. Simply double-click `index.html` or open it in any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
3. No server (`npm`, `python`, `node`) required!

### GitHub Pages Deployment
1. Create a new public repository on GitHub named `AI-Civic-Problem-Predictor`.
2. Push all project files to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial SIH Prototype Commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/AI-Civic-Problem-Predictor.git
   git push -u origin main
   ```
3. Navigate to **Repository Settings** → **Pages**.
4. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then click **Save**.
6. Your live site will be available at: `https://YOUR_USERNAME.github.io/AI-Civic-Problem-Predictor/`

---

## ⚠️ Prototype Disclaimer

> *The current prototype uses a JavaScript-based explainable prediction engine and simulated data. A production implementation could integrate trained ML models (such as XGBoost, Prophet, or LSTM time-series models) and verified municipal sensor datasets.*

---

## 👥 SIH Team

- **Project Lead & Developer**: Expert Full-Stack AI Engineer
- **Event**: Smart India Hackathon (SIH) 2026
