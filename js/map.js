/*
  AI Civic Problem Predictor - Interactive Risk Map Controller
  Smart India Hackathon (SIH) Prototype
*/

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map-page')) {
    RiskMap.init();
  }
});

const RiskMap = {
  init() {
    this.renderMapZones();
    window.onLiveSimUpdate = () => {
      this.renderMapZones();
    };
  },

  renderMapZones() {
    const predictions = DataStore.getPredictions();
    const zones = DataStore.getZones();

    zones.forEach(zone => {
      const pred = predictions.find(p => p.zoneId === zone.id) || { riskScore: 40, riskLevel: 'Medium' };
      const svgPath = document.getElementById(`map-poly-${zone.id}`);
      const textScore = document.getElementById(`map-score-${zone.id}`);

      if (svgPath) {
        let fillColor = '#10b981'; // Low
        if (pred.riskLevel === 'Critical') fillColor = '#ef4444';
        else if (pred.riskLevel === 'High') fillColor = '#f97316';
        else if (pred.riskLevel === 'Medium') fillColor = '#f59e0b';

        svgPath.setAttribute('fill', fillColor);
        svgPath.setAttribute('fill-opacity', '0.75');
      }

      if (textScore) {
        textScore.textContent = `${pred.riskScore}%`;
      }
    });

    // Default select Zone 4 or first zone for side drawer
    this.selectZone('zone-4');
  },

  selectZone(zoneId) {
    const zones = DataStore.getZones();
    const predictions = DataStore.getPredictions();
    const reports = DataStore.getReports();

    const targetZone = zones.find(z => z.id === zoneId) || zones[0];
    const targetPred = predictions.find(p => p.zoneId === zoneId) || predictions[0];
    const zoneReports = reports.filter(r => r.zoneId === zoneId);

    // Update active highlight on map paths
    document.querySelectorAll('.map-zone').forEach(p => {
      p.setAttribute('stroke', '#e2e8f0');
      p.setAttribute('stroke-width', '2');
    });

    const activePoly = document.getElementById(`map-poly-${zoneId}`);
    if (activePoly) {
      activePoly.setAttribute('stroke', '#ffffff');
      activePoly.setAttribute('stroke-width', '4');
    }

    // Populate Side Drawer / Details Panel
    document.getElementById('drawer-zone-title').textContent = targetZone.name;
    document.getElementById('drawer-pop').textContent = targetZone.population.toLocaleString();
    document.getElementById('drawer-complaints').textContent = zoneReports.length + 15; // Total including historical
    document.getElementById('drawer-weather').textContent = targetZone.weatherRisk;
    document.getElementById('drawer-service').textContent = targetZone.serviceFreq;

    document.getElementById('drawer-risk-score').textContent = `${targetPred.riskScore}%`;
    document.getElementById('drawer-risk-level').textContent = targetPred.riskLevel;
    
    const levelBadge = document.getElementById('drawer-risk-level');
    levelBadge.className = `badge ${targetPred.riskLevel === 'Critical' ? 'badge-risk-critical' : (targetPred.riskLevel === 'High' ? 'badge-risk-high' : 'badge-risk-medium')}`;

    document.getElementById('drawer-predicted-problem').textContent = targetPred.category;
    document.getElementById('drawer-confidence').textContent = `${targetPred.confidence}%`;
    document.getElementById('drawer-timeframe').textContent = targetPred.timeframe;
    document.getElementById('drawer-recommended-action').textContent = targetPred.recommendedAction;
  }
};
