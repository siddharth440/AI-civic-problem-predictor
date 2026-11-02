/*
  Transparent, explainable civic risk scoring prototype.
  This weighted heuristic is not a trained machine-learning model.
*/

const PredictionEngine = {
  ENGINE_NAME: 'AI-assisted civic risk scoring prototype',
  METHODOLOGY: 'Weighted rules using complaint volume, severity, history, density, vulnerability, trends, and unresolved reports',

  classifyRisk(score) {
    if (score >= 75) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 25) return 'Medium';
    return 'Low';
  },

  calculateRiskScore(factors) {
    const weights = [
      { key: 'complaintFrequency', name: 'Complaint frequency', weight: 0.25, max: 25 },
      { key: 'severity', name: 'Complaint severity', weight: 0.20, max: 20 },
      { key: 'historicalIncidents', name: 'Historical incident estimate', weight: 0.15, max: 15 },
      { key: 'populationDensity', name: 'Estimated population density', weight: 0.10, max: 10 },
      { key: 'infrastructureVulnerability', name: 'Estimated infrastructure vulnerability', weight: 0.15, max: 15 },
      { key: 'recentTrend', name: 'Recent complaint trend', weight: 0.10, max: 10 },
      { key: 'unresolvedComplaints', name: 'Unresolved complaints', weight: 0.05, max: 5 }
    ];
    const breakdown = weights.map(item => {
      const input = Number(factors[item.key]);
      const normalized = Number.isFinite(input) ? Math.min(100, Math.max(0, input)) : 0;
      const points = Math.round(normalized * item.weight);
      return { name: item.name, points, max: item.max, value: normalized };
    });
    const riskScore = Math.min(100, breakdown.reduce((sum, item) => sum + item.points, 0));
    return {
      riskScore,
      riskLevel: this.classifyRisk(riskScore),
      factorBreakdown: breakdown
    };
  },

  recalculateAllZonePredictions() {
    const zones = DataStore.getZones();
    const reports = DataStore.getReports();
    const now = Date.now();
    const openStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress'];

    return zones.map(zone => {
      const zoneReports = reports.filter(report => report.zoneId === zone.id);
      const recentReports = zoneReports.filter(report => {
        const submitted = new Date(report.createdAt || report.date).getTime();
        return Number.isFinite(submitted) && now - submitted <= 30 * 24 * 60 * 60 * 1000;
      });
      const unresolved = zoneReports.filter(report => openStatuses.includes(report.status));
      const repeatedCategories = zoneReports.reduce((counts, report) => {
        const category = report.category || 'Other';
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {});
      const dominantCategory = Object.entries(repeatedCategories)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      const severityValues = { Low: 20, Medium: 45, High: 75, Critical: 100 };
      const averageSeverity = zoneReports.length
        ? zoneReports.reduce((total, report) => total + (severityValues[report.severity || report.priority] || 35), 0) / zoneReports.length
        : 0;
      const historicalEstimate = Math.min(100, Number(zone.complaintCount || 0) * 1.1);
      const recentTrend = Math.min(100, recentReports.length * 20);
      const input = {
        complaintFrequency: Math.min(100, zoneReports.length * 12 + recentReports.length * 8),
        severity: averageSeverity,
        historicalIncidents: historicalEstimate,
        populationDensity: Math.min(100, Math.round((Number(zone.population) || 0) / 1750)),
        infrastructureVulnerability: Number(zone.infrastructureVulnerability) || (zone.serviceFreq === 'Monthly' ? 85 : zone.serviceFreq === 'Bi-monthly' ? 75 : 45),
        recentTrend,
        unresolvedComplaints: Math.min(100, unresolved.length * 20)
      };
      const result = this.calculateRiskScore(input);
      const recommendations = {
        'Water Leakage': 'Inspect the local water main and check for pressure loss.',
        'Drainage Problems': 'Inspect nearby storm drains and remove obstructions.',
        'Flood Risk': 'Check drainage capacity and prepare a localized flood response.',
        'Road Damage': 'Inspect the affected road surface and prioritize a safety repair.',
        'Garbage Overflow': 'Schedule collection and inspect the nearest waste container.',
        'Street Light Failure': 'Inspect the street-light circuit and replace failed fixtures.',
        'Traffic Congestion': 'Review signal timing and monitor the affected intersection.',
        'Public Safety': 'Escalate the report to the appropriate public-safety team.',
        Other: 'Review recent reports and schedule a field inspection.'
      };
      const category = dominantCategory || this.inferCategory(zone);
      const reasons = result.factorBreakdown
        .filter(factor => factor.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 3)
        .map(factor => `${factor.name}: ${factor.points}/${factor.max} points`);

      return {
        id: `PRED-${zone.id.replace('zone-', '')}`,
        zoneId: zone.id,
        zoneName: zone.name,
        category,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        confidence: null,
        timeframe: result.riskLevel === 'Critical' ? 'Immediate review' : result.riskLevel === 'High' ? 'Review within 24 hours' : 'Routine monitoring',
        recommendedAction: recommendations[category] || recommendations.Other,
        status: DataStore.getPredictions().find(prediction => prediction.zoneId === zone.id)?.status || 'Predicted',
        indicators: Object.fromEntries(result.factorBreakdown.map(factor => [factor.name, factor.points])),
        factorBreakdown: result.factorBreakdown,
        reasons,
        complaintCount: zoneReports.length,
        unresolvedCount: unresolved.length
      };
    });
  },

  inferCategory(zone) {
    if (/rain|flood/i.test(zone.weatherRisk || '')) return 'Flood Risk';
    if (/industrial|spill/i.test(zone.name || '')) return 'Water Leakage';
    return 'Other';
  }
};

window.addEventListener('civic-data-changed', event => {
  if (event.detail?.type === 'predictions') return;
  const predictions = PredictionEngine.recalculateAllZonePredictions();
  localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions));
  window.dispatchEvent(new CustomEvent('civic-data-changed', { detail: { type: 'predictions' } }));
});

const initialPredictions = PredictionEngine.recalculateAllZonePredictions();
localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(initialPredictions));
