/*
  AI Civic Problem Predictor - Data Store & LocalStorage Manager
  Smart India Hackathon (SIH) Prototype
*/

const STORAGE_KEYS = {
  REPORTS: 'sih_civic_reports',
  PREDICTIONS: 'sih_civic_predictions',
  ALERTS: 'sih_civic_alerts',
  ZONES: 'sih_civic_zones',
  THEME: 'sih_civic_theme',
  LIVE_SIM: 'sih_civic_livesim'
};

// Initial Seed Datasets
const DEFAULT_ZONES = [
  { id: 'zone-1', name: 'Zone 1 - Indiranagar North', population: 85000, complaintCount: 24, serviceFreq: 'Bi-weekly', weatherRisk: 'Moderate' },
  { id: 'zone-2', name: 'Zone 2 - Riverside Boulevard', population: 110000, complaintCount: 52, serviceFreq: 'Weekly', weatherRisk: 'Heavy Rain' },
  { id: 'zone-3', name: 'Zone 3 - Central Market & Transit', population: 140000, complaintCount: 68, serviceFreq: 'Daily', weatherRisk: 'Normal' },
  { id: 'zone-4', name: 'Zone 4 - Industrial Corridor', population: 95000, complaintCount: 89, serviceFreq: 'Bi-monthly', weatherRisk: 'High Spill Risk' },
  { id: 'zone-5', name: 'Zone 5 - West Suburbs', population: 72000, complaintCount: 31, serviceFreq: 'Weekly', weatherRisk: 'Normal' },
  { id: 'zone-6', name: 'Zone 6 - Heritage Old City', population: 165000, complaintCount: 94, serviceFreq: 'Monthly', weatherRisk: 'Moderate Rain' }
];

const DEFAULT_REPORTS = [
  { id: 'REP-8491', name: 'Ananya Sharma', category: 'Garbage', zoneId: 'zone-4', location: 'Zone 4 - Industrial Corridor, Sector 12', description: 'Overflowing commercial dumpster blocking primary drain pathway near factory gate 3.', severity: 'High', date: '2026-08-27', status: 'In Progress', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8492', name: 'Rahul Verma', category: 'Flooding', zoneId: 'zone-2', location: 'Zone 2 - Riverside Boulevard, Underpass 4', description: 'Water accumulation of 1.5 feet following brief evening shower due to choked stormwater intake.', severity: 'Critical', date: '2026-08-27', status: 'Assigned', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8493', name: 'Priya Sundaram', category: 'Water Leakage', zoneId: 'zone-5', location: 'Zone 5 - West Suburbs, 4th Main Road', description: 'Major subterranean pipe fracture causing road surface erosion and water pressure drops.', severity: 'Medium', date: '2026-08-26', status: 'Predicted', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8494', name: 'Vikram Mehta', category: 'Drainage', zoneId: 'zone-6', location: 'Zone 6 - Heritage Old City, Chowk Market', description: 'Sewage backup reported in commercial alleyway during peak afternoon trading hours.', severity: 'Critical', date: '2026-08-26', status: 'Assigned', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8495', name: 'Siddharth Rao', category: 'Pothole', zoneId: 'zone-3', location: 'Zone 3 - Central Market, Station Flyover', description: 'Deep 3-foot asphalt crater creating severe morning traffic bottleneck.', severity: 'High', date: '2026-08-26', status: 'In Progress', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8496', name: 'Kavita Patel', category: 'Streetlight', zoneId: 'zone-1', location: 'Zone 1 - Indiranagar North, Park Street', description: 'Sequence of 6 consecutive solar streetlights non-operational for past 48 hours.', severity: 'Low', date: '2026-08-25', status: 'Resolved', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8497', name: 'Amitabh Joshi', category: 'Garbage', zoneId: 'zone-6', location: 'Zone 6 - Heritage Old City, Gali 9', description: 'Uncollected organic market waste accumulating near school pedestrian entrance.', severity: 'Critical', date: '2026-08-25', status: 'Prevented', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8498', name: 'Deepika Nair', category: 'Pothole', zoneId: 'zone-4', location: 'Zone 4 - Industrial Corridor, Container Road', description: 'Multiple potholes causing heavy vehicle alignment loss and safety hazard.', severity: 'Medium', date: '2026-08-24', status: 'In Progress', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8499', name: 'Rohan Gupta', category: 'Water Leakage', zoneId: 'zone-3', location: 'Zone 3 - Central Market, Metro Gate 2', description: 'Clean drinking water main leaking approximately 500 liters per hour onto sidewalk.', severity: 'High', date: '2026-08-24', status: 'Resolved', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8500', name: 'Sunita Reddy', category: 'Drainage', zoneId: 'zone-2', location: 'Zone 2 - Riverside Boulevard, Ghat Road', description: 'Silt accumulation in canal outflow reducing discharge capacity by 60%.', severity: 'High', date: '2026-08-24', status: 'Prevented', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8501', name: 'Mohammed Ali', category: 'Garbage', zoneId: 'zone-4', location: 'Zone 4 - Industrial Corridor, Mill Area', description: 'Hazardous plastic and textile scrap piled along drainage ditch.', severity: 'Critical', date: '2026-08-23', status: 'Assigned', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8502', name: 'Neha Deshmukh', category: 'Flooding', zoneId: 'zone-6', location: 'Zone 6 - Heritage Old City, Low-lying Lane 3', description: 'Rainwater ponding endangering old brick masonry foundation.', severity: 'High', date: '2026-08-23', status: 'In Progress', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8503', name: 'Arjun Singhania', category: 'Streetlight', zoneId: 'zone-5', location: 'Zone 5 - West Suburbs, Ring Road Junction', description: 'Traffic signal and high-mast light flickering intermittently during night hours.', severity: 'Medium', date: '2026-08-23', status: 'Resolved', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8504', name: 'Meera Kulkarni', category: 'Pothole', zoneId: 'zone-1', location: 'Zone 1 - Indiranagar North, 10th Cross', description: 'Road edge crumbling into storm gutter post recent utility trenching.', severity: 'Low', date: '2026-08-22', status: 'Resolved', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8505', name: 'Tariq Hussain', category: 'Garbage', zoneId: 'zone-3', location: 'Zone 3 - Central Market, Food Court Alley', description: 'Food vendor waste bags torn open by stray animals.', severity: 'Medium', date: '2026-08-22', status: 'Prevented', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8506', name: 'Shalini Iyer', category: 'Water Leakage', zoneId: 'zone-2', location: 'Zone 2 - Riverside Boulevard, Sector 4', description: 'Valves leaking at booster station pumping unit #2.', severity: 'Low', date: '2026-08-21', status: 'Resolved', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8507', name: 'Ganesh Shinde', category: 'Drainage', zoneId: 'zone-4', location: 'Zone 4 - Industrial Corridor, Truck Terminal', description: 'Concrete drain cover collapsed under heavy freight vehicle.', severity: 'Critical', date: '2026-08-21', status: 'Assigned', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8508', name: 'Pooja Agarwal', category: 'Flooding', zoneId: 'zone-2', location: 'Zone 2 - Riverside Boulevard, Island Colony', description: 'Storm sewer pump #1 tripped during automated start test.', severity: 'High', date: '2026-08-20', status: 'Prevented', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-8509', name: 'Karan Saxena', category: 'Pothole', zoneId: 'zone-6', location: 'Zone 6 - Heritage Old City, Fort Road', description: 'Cobblestone displacement creating hazard for two-wheelers.', severity: 'Medium', date: '2026-08-20', status: 'Resolved', image: 'assets/images/placeholder.jpg' },
  { id: 'REP-85010', name: 'Divya Menon', category: 'Streetlight', zoneId: 'zone-4', location: 'Zone 4 - Industrial Corridor, Outer Bypass', description: 'Dark corridor stretching 800m near freight yard.', severity: 'High', date: '2026-08-19', status: 'Assigned', image: 'assets/images/placeholder.jpg' }
];

const DEFAULT_PREDICTIONS = [
  {
    id: 'PRED-101',
    zoneId: 'zone-4',
    zoneName: 'Zone 4 - Industrial Corridor',
    category: 'Garbage Accumulation',
    riskScore: 87,
    riskLevel: 'Critical',
    confidence: 91,
    timeframe: 'Within 24–48 hours',
    recommendedAction: 'Schedule emergency heavy-duty waste collection & clear factory drainage gate.',
    status: 'Predicted',
    indicators: {
      historicalComplaints: 28, // /30
      recentSurge: 18,        // /20
      weatherFactor: 14,       // /15
      incidentHistory: 13,     // /15
      populationActivity: 8,   // /10
      serviceFrequency: 6      // /10
    }
  },
  {
    id: 'PRED-102',
    zoneId: 'zone-2',
    zoneName: 'Zone 2 - Riverside Boulevard',
    category: 'Flooding',
    riskScore: 76,
    riskLevel: 'High',
    confidence: 84,
    timeframe: 'Within 24–48 hours',
    recommendedAction: 'Inspect stormwater pumps, clear underpass intake grates, deploy hydro-vac truck.',
    status: 'Predicted',
    indicators: {
      historicalComplaints: 22,
      recentSurge: 16,
      weatherFactor: 15,
      incidentHistory: 11,
      populationActivity: 6,
      serviceFrequency: 6
    }
  },
  {
    id: 'PRED-103',
    zoneId: 'zone-5',
    zoneName: 'Zone 5 - West Suburbs',
    category: 'Water Leakage',
    riskScore: 69,
    riskLevel: 'Medium',
    confidence: 88,
    timeframe: 'Within 3–5 days',
    recommendedAction: 'Execute acoustic pipe telemetry check along 4th Main Road feeder line.',
    status: 'In Progress',
    indicators: {
      historicalComplaints: 18,
      recentSurge: 14,
      weatherFactor: 9,
      incidentHistory: 12,
      populationActivity: 8,
      serviceFrequency: 8
    }
  },
  {
    id: 'PRED-104',
    zoneId: 'zone-6',
    zoneName: 'Zone 6 - Heritage Old City',
    category: 'Drainage Overflow',
    riskScore: 92,
    riskLevel: 'Critical',
    confidence: 95,
    timeframe: 'Imminent (< 24 hours)',
    recommendedAction: 'Deploy high-pressure sewer jetting unit to Chowk Market central line.',
    status: 'Assigned',
    indicators: {
      historicalComplaints: 30,
      recentSurge: 19,
      weatherFactor: 13,
      incidentHistory: 14,
      populationActivity: 9,
      serviceFrequency: 7
    }
  },
  {
    id: 'PRED-105',
    zoneId: 'zone-3',
    zoneName: 'Zone 3 - Central Market',
    category: 'Pothole Erosion',
    riskScore: 58,
    riskLevel: 'Medium',
    confidence: 82,
    timeframe: 'Within 5–7 days',
    recommendedAction: 'Pre-patch asphalt fissures on Station Flyover ramp prior to monsoon pulse.',
    status: 'Predicted',
    indicators: {
      historicalComplaints: 16,
      recentSurge: 12,
      weatherFactor: 10,
      incidentHistory: 9,
      populationActivity: 7,
      serviceFrequency: 4
    }
  },
  {
    id: 'PRED-106',
    zoneId: 'zone-1',
    zoneName: 'Zone 1 - Indiranagar North',
    category: 'Streetlight Grid Failure',
    riskScore: 32,
    riskLevel: 'Low',
    confidence: 89,
    timeframe: 'Low Probability',
    recommendedAction: 'Routine inspection of Park Street solar charge controllers.',
    status: 'Resolved',
    indicators: {
      historicalComplaints: 8,
      recentSurge: 5,
      weatherFactor: 4,
      incidentHistory: 6,
      populationActivity: 5,
      serviceFrequency: 4
    }
  }
];

const DEFAULT_ALERTS = [
  { id: 'ALT-301', zone: 'Zone 4', level: 'Critical', title: 'Critical Risk Alert - Garbage Accumulation', message: 'Zone 4 risk index hit 87%. Industrial runoff drain obstruction predicted within 36 hours.', timestamp: '10 mins ago', isRead: false },
  { id: 'ALT-302', zone: 'Zone 2', level: 'High', title: 'Flooding Vulnerability Surge', message: 'Heavy rainfall warning active. Underpass drainage clearance recommended immediately.', timestamp: '45 mins ago', isRead: false },
  { id: 'ALT-303', zone: 'Zone 6', level: 'Critical', title: 'Drainage Overflow Imminent', message: 'Chowk Market sewer telemetry shows 92% risk score due to peak footfall and old infrastructure.', timestamp: '2 hours ago', isRead: true },
  { id: 'ALT-304', zone: 'Zone 3', level: 'Success', title: 'Preventive Action Verification', message: 'Preventive maintenance completed on Station Flyover pothole cluster. Incident prevented.', timestamp: '5 hours ago', isRead: true }
];

// Data Store Accessor & Mutator API
const DataStore = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PREDICTIONS)) {
      localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(DEFAULT_PREDICTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(DEFAULT_ALERTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ZONES)) {
      localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(DEFAULT_ZONES));
    }
  },

  getReports() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
  },

  addReport(report) {
    const reports = this.getReports();
    reports.unshift(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    
    // Add alert automatically
    this.addAlert({
      id: 'ALT-' + Math.floor(100 + Math.random() * 900),
      zone: report.zoneId ? report.zoneId.replace('zone-', 'Zone ') : 'City',
      level: report.severity === 'Critical' ? 'Critical' : (report.severity === 'High' ? 'High' : 'Medium'),
      title: `New Citizen Report: ${report.category}`,
      message: `Report ${report.id} filed for ${report.location}. Severity: ${report.severity}`,
      timestamp: 'Just now',
      isRead: false
    });
    
    return report;
  },

  updateReportStatus(id, newStatus) {
    const reports = this.getReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      reports[idx].status = newStatus;
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    }
  },

  getPredictions() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '[]');
  },

  updatePrediction(prediction) {
    const predictions = this.getPredictions();
    const idx = predictions.findIndex(p => p.id === prediction.id);
    if (idx !== -1) {
      predictions[idx] = prediction;
    } else {
      predictions.unshift(prediction);
    }
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions));
  },

  getAlerts() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
  },

  addAlert(alert) {
    const alerts = this.getAlerts();
    alerts.unshift(alert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  },

  markAlertRead(id) {
    const alerts = this.getAlerts();
    const idx = alerts.findIndex(a => a.id === id);
    if (idx !== -1) {
      alerts[idx].isRead = true;
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    }
  },

  clearAlerts() {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
  },

  getZones() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ZONES) || '[]');
  }
};

// Auto initialize on load
DataStore.init();
