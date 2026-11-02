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
  LIVE_SIM: 'sih_civic_livesim',
  API_BASE_URL: 'sih_civic_api_base_url'
};

const CIVIC_DB_NAME = 'civic-predictor';
const CIVIC_DB_VERSION = 1;
window.CIVIC_CONFIG = window.CIVIC_CONFIG || { API_BASE_URL: '' };

// Initial Seed Datasets
const DEFAULT_ZONES = [
  { id: 'zone-1', name: 'Zone 1 - Indiranagar North', population: 85000, populationIsEstimate: true, complaintCount: 24, infrastructureVulnerability: 40, serviceFreq: 'Bi-weekly', weatherRisk: 'Moderate' },
  { id: 'zone-2', name: 'Zone 2 - Riverside Boulevard', population: 110000, populationIsEstimate: true, complaintCount: 52, infrastructureVulnerability: 70, serviceFreq: 'Weekly', weatherRisk: 'Heavy Rain' },
  { id: 'zone-3', name: 'Zone 3 - Central Market & Transit', population: 140000, populationIsEstimate: true, complaintCount: 68, infrastructureVulnerability: 62, serviceFreq: 'Daily', weatherRisk: 'Normal' },
  { id: 'zone-4', name: 'Zone 4 - Industrial Corridor', population: 95000, populationIsEstimate: true, complaintCount: 89, infrastructureVulnerability: 82, serviceFreq: 'Bi-monthly', weatherRisk: 'High Spill Risk' },
  { id: 'zone-5', name: 'Zone 5 - West Suburbs', population: 72000, populationIsEstimate: true, complaintCount: 31, infrastructureVulnerability: 48, serviceFreq: 'Weekly', weatherRisk: 'Normal' },
  { id: 'zone-6', name: 'Zone 6 - Heritage Old City', population: 165000, populationIsEstimate: true, complaintCount: 94, infrastructureVulnerability: 88, serviceFreq: 'Monthly', weatherRisk: 'Moderate Rain' }
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
  dbPromise: null,
  dbError: null,
  adminToken: null,

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
    if (!this.dbPromise && typeof indexedDB !== 'undefined') {
      this.dbPromise = this.openDatabase().then(async db => {
        await this.hydrateFromDatabase(db);
        return db;
      }).catch(error => {
        this.dbError = error;
        console.error('IndexedDB is unavailable; complaint records will remain in local storage.', error);
        return null;
      });
    }
  },

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CIVIC_DB_NAME, CIVIC_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('records')) db.createObjectStore('records');
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to open local civic storage.'));
    });
  },

  async hydrateFromDatabase(db) {
    const storedReports = await this.readFromDatabase(db, 'records', 'reports');
    if (Array.isArray(storedReports)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(storedReports));
      window.dispatchEvent(new CustomEvent('civic-data-changed', { detail: { type: 'reports' } }));
      return;
    }
    await this.writeToDatabase(db, 'records', 'reports', this.getReports());
  },

  readFromDatabase(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to read local civic storage.'));
    });
  },

  writeToDatabase(db, storeName, key, value) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Unable to save local civic storage.'));
      transaction.onabort = () => reject(transaction.error || new Error('Local civic storage write was cancelled.'));
    });
  },

  async persistReports(reports) {
    this.init();
    if (this.dbPromise) {
      const db = await this.dbPromise;
      if (!db) throw this.dbError || new Error('IndexedDB is unavailable.');
      await this.writeToDatabase(db, 'records', 'reports', reports);
    }
    window.dispatchEvent(new CustomEvent('civic-data-changed', { detail: { type: 'reports' } }));
  },

  async storeImage(imageId, file) {
    this.init();
    if (!this.dbPromise) throw new Error('This browser does not support local image storage.');
    const db = await this.dbPromise;
    if (!db) throw this.dbError || new Error('IndexedDB is unavailable.');
    await this.writeToDatabase(db, 'images', imageId, file);
    return imageId;
  },

  async getImage(imageId) {
    if (!imageId) return null;
    this.init();
    if (!this.dbPromise) return null;
    const db = await this.dbPromise;
    if (!db) return null;
    return this.readFromDatabase(db, 'images', imageId);
  },

  createId(prefix) {
    const token = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
    return `${prefix}-${token}`;
  },

  createComplaintId() {
    const existingIds = new Set(this.getReports().map(report => String(report.id).toUpperCase()));
    for (let attempt = 0; attempt < 100; attempt++) {
      const bytes = new Uint8Array(3);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
      } else {
        for (let index = 0; index < bytes.length; index++) {
          bytes[index] = Math.floor(Math.random() * 256);
        }
      }
      const token = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
      const id = `REP-${token}`;
      if (!existingIds.has(id)) return id;
    }
    throw new Error('Unable to generate a unique complaint ID. Please try again.');
  },

  getApiBaseUrl() {
    return String(window.CIVIC_CONFIG.API_BASE_URL || '').trim().replace(/\/+$/, '');
  },

  async apiRequest(path, options = {}) {
    const baseUrl = this.getApiBaseUrl();
    if (!baseUrl) return null;
    const { admin = false, allowNotFound = false, ...fetchOptions } = options;
    if (admin && !this.adminToken) throw new Error('Enter the admin API token to use protected authority features.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const headers = { 'Content-Type': 'application/json', ...(fetchOptions.headers || {}) };
      if (admin) headers.Authorization = `Bearer ${this.adminToken}`;
      const response = await fetch(`${baseUrl}${path}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers
      });
      if (response.status === 404 && allowNotFound) return null;
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Backend request failed (${response.status}).`);
      return body;
    } finally {
      clearTimeout(timeout);
    }
  },

  submitToBackend(report) {
    if (!this.getApiBaseUrl()) return Promise.resolve(null);
    return this.apiRequest('/api/complaints', { method: 'POST', body: JSON.stringify(report) });
  },

  async uploadImageToBackend(complaintId, file) {
    if (!this.getApiBaseUrl()) return null;
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Unable to read the selected image.'));
      reader.readAsDataURL(file);
    });
    return this.apiRequest(`/api/complaints/${encodeURIComponent(complaintId)}/image`, {
      method: 'POST',
      body: JSON.stringify({ mimeType: file.type, data })
    });
  },

  async fetchBackendComplaint(id) {
    if (!this.getApiBaseUrl()) return null;
    const response = await this.apiRequest(`/api/complaints/${encodeURIComponent(id)}`, { allowNotFound: true });
    return response?.complaint ? { ...response.complaint, source: 'backend' } : null;
  },

  setAdminToken(token) {
    this.adminToken = token || null;
  },

  async syncBackendReports() {
    const response = await this.apiRequest('/api/admin/complaints', { admin: true });
    const localReports = this.getReports();
    const backendReports = response.complaints.map(report => ({ ...report, source: 'backend' }));
    const ids = new Set(backendReports.map(report => report.id));
    const merged = [
      ...backendReports,
      ...localReports.filter(report => !ids.has(report.id))
    ];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(merged));
    await this.persistReports(merged);
    return backendReports;
  },

  updateBackendComplaint(id, updates) {
    return this.apiRequest(`/api/admin/complaints/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      admin: true,
      body: JSON.stringify(updates)
    });
  },

  notifyChange(type) {
    window.dispatchEvent(new CustomEvent('civic-data-changed', { detail: { type } }));
  },

  getReports() {
    this.init();
    const demoIds = new Set(DEFAULT_REPORTS.map(report => report.id));
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]')
      .map(report => {
        const isDemo = report.isDemo ?? demoIds.has(report.id);
        const categoryAliases = {
          Garbage: 'Garbage Overflow',
          Pothole: 'Road Damage',
          Drainage: 'Drainage Problems',
          Flooding: 'Flood Risk',
          Streetlight: 'Street Light Failure',
          Other: 'Other Civic Issues'
        };
        const statusAliases = { Predicted: 'Submitted', Prevented: 'Resolved' };
        return {
          ...report,
          title: report.title || report.category,
          category: isDemo ? (categoryAliases[report.category] || report.category) : report.category,
          status: statusAliases[report.status] || report.status,
          priority: report.priority || report.severity,
          isDemo
        };
      });
  },

  async addReport(report) {
    const reports = this.getReports();
    if (reports.some(existing => existing.id === report.id)) {
      throw new Error(`Complaint ID ${report.id} already exists.`);
    }
    reports.unshift(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    let persistenceError = null;
    try {
      await this.persistReports(reports);
    } catch (error) {
      persistenceError = error;
    }
    
    // Add alert automatically
    this.addAlert({
      id: this.createId('ALT'),
      zone: report.zoneId ? report.zoneId.replace('zone-', 'Zone ') : 'City',
      level: report.severity === 'Critical' ? 'Critical' : (report.severity === 'High' ? 'High' : 'Medium'),
      title: `New Citizen Report: ${report.category}`,
      message: `Report ${report.id} filed for ${report.location}. Severity: ${report.severity}`,
      timestamp: new Date().toISOString(),
      isRead: false
    });
    if (persistenceError) throw persistenceError;
    return report;
  },

  async updateReportStatus(id, newStatus) {
    const reports = this.getReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      const report = reports[idx];
      report.status = newStatus;
      report.updatedAt = new Date().toISOString();
      if (newStatus === 'Resolved') report.resolvedAt = report.updatedAt;
      report.history = report.history || [];
      report.history.push({ status: newStatus, at: report.updatedAt, note: `Status changed to ${newStatus}.` });
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      let persistenceError = null;
      try {
        await this.persistReports(reports);
      } catch (error) {
        persistenceError = error;
      }
      this.addAlert({
        id: this.createId('ALT'),
        zone: report.zoneName || report.zoneId || 'City',
        level: newStatus === 'Resolved' ? 'Success' : 'Medium',
        title: `Complaint ${newStatus}`,
        message: `Complaint ${report.id} status changed to ${newStatus}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        complaintId: report.id
      });
      if (persistenceError) throw persistenceError;
    }
  },

  async updateReportAssignment(id, department) {
    const reports = this.getReports();
    const report = reports.find(item => item.id === id);
    if (!report) throw new Error(`Complaint ${id} was not found.`);
    report.department = department;
    report.updatedAt = new Date().toISOString();
    report.history = report.history || [];
    report.history.push({ status: report.status, at: report.updatedAt, note: `Assigned to ${department}.` });
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    let persistenceError = null;
    try {
      await this.persistReports(reports);
    } catch (error) {
      persistenceError = error;
    }
    this.addAlert({
      id: this.createId('ALT'),
      zone: report.zoneName || report.zoneId || 'City',
      level: 'Medium',
      title: 'Complaint assignment updated',
      message: `Complaint ${report.id} assigned to ${department}.`,
      timestamp: report.updatedAt,
      isRead: false,
      complaintId: report.id
    });
    if (persistenceError) throw persistenceError;
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
    this.notifyChange('predictions');
  },

  getAlerts() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
  },

  addAlert(alert) {
    const alerts = this.getAlerts();
    alerts.unshift(alert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    this.notifyChange('alerts');
  },

  markAlertRead(id) {
    const alerts = this.getAlerts();
    const idx = alerts.findIndex(a => a.id === id);
    if (idx !== -1) {
      alerts[idx].isRead = true;
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      this.notifyChange('alerts');
    }
  },

  clearAlerts() {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    this.notifyChange('alerts');
  },

  getZones() {
    this.init();
    const storedZones = JSON.parse(localStorage.getItem(STORAGE_KEYS.ZONES) || '[]');
    return storedZones.map(zone => ({
      ...(DEFAULT_ZONES.find(defaultZone => defaultZone.id === zone.id) || {}),
      ...zone
    }));
  },

  exportData() {
    return {
      exportedAt: new Date().toISOString(),
      reports: this.getReports(),
      predictions: this.getPredictions(),
      alerts: this.getAlerts(),
      zones: this.getZones()
    };
  },

  importData(data) {
    if (!data || !Array.isArray(data.reports) || !Array.isArray(data.zones)) {
      throw new Error('Backup file is missing required complaint or zone data.');
    }
    if (data.reports.some(report => !report || typeof report !== 'object' || typeof report.id !== 'string')
        || new Set(data.reports.map(report => report.id)).size !== data.reports.length
        || data.zones.some(zone => !zone || typeof zone !== 'object' || typeof zone.id !== 'string')) {
      throw new Error('Backup contains malformed or duplicate complaint/zone records.');
    }
    const record = JSON.stringify(data.reports);
    localStorage.setItem(STORAGE_KEYS.REPORTS, record);
    if (Array.isArray(data.predictions)) localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(data.predictions));
    if (Array.isArray(data.alerts)) localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(data.alerts));
    localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(data.zones));
    this.persistReports(data.reports).catch(error => {
      console.error('Unable to persist restored complaints to IndexedDB.', error);
    });
    this.notifyChange('all');
  }
};

// Auto initialize on load
DataStore.init();
