document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map-page')) RiskMap.init();
});

const RiskMap = {
  map: null,
  zoneLayers: {},
  complaintLayer: null,
  zoneLabelLayer: null,
  selectedZoneId: null,
  centers: {
    'zone-1': [78, 20],
    'zone-2': [78, 60],
    'zone-3': [78, 100],
    'zone-4': [34, 20],
    'zone-5': [34, 60],
    'zone-6': [34, 100]
  },
  shapes: {
    'zone-1': [[60, 5], [96, 7], [96, 35], [60, 33]],
    'zone-2': [[60, 37], [96, 39], [96, 81], [60, 79]],
    'zone-3': [[60, 84], [96, 86], [96, 116], [60, 114]],
    'zone-4': [[10, 5], [54, 7], [54, 34], [10, 33]],
    'zone-5': [[10, 37], [54, 39], [54, 81], [10, 79]],
    'zone-6': [[10, 84], [54, 86], [54, 116], [10, 114]]
  },

  init() {
    this.selectedZoneId = DataStore.getZones()[0]?.id || null;
    this.initMap();
    this.initFilters();
    this.render();
    window.addEventListener('civic-data-changed', () => this.render());
    window.onLiveSimUpdate = () => this.render();
  },

  initMap() {
    const container = document.getElementById('civic-risk-map');
    if (typeof L === 'undefined') {
      container.textContent = 'The map library did not load. Check your connection and reload this page.';
      App.showToast('Leaflet could not be loaded; map visualization is unavailable.', 'error');
      return;
    }
    this.map = L.map(container, { crs: L.CRS.Simple, minZoom: -1, maxZoom: 2, zoomControl: true });
    const bounds = [[0, 0], [100, 120]];
    this.map.fitBounds(bounds);
    this.map.setMaxBounds(bounds);
    this.complaintLayer = L.layerGroup().addTo(this.map);
    this.zoneLabelLayer = L.layerGroup().addTo(this.map);
  },

  initFilters() {
    const filter = document.getElementById('map-filter-category');
    [...new Set(DataStore.getReports().map(report => report.category).filter(Boolean))].sort().forEach(category => {
      filter.add(new Option(category, category));
    });
    filter.addEventListener('change', () => this.renderComplaintMarkers());
    document.getElementById('map-show-complaints').addEventListener('change', () => this.renderComplaintMarkers());
  },

  render() {
    this.renderMapZones();
    this.renderComplaintMarkers();
    if (this.selectedZoneId) this.selectZone(this.selectedZoneId);
  },

  renderMapZones() {
    if (!this.map) return;
    const predictions = DataStore.getPredictions();
    const reports = DataStore.getReports();
    const zones = DataStore.getZones();
    Object.values(this.zoneLayers).forEach(layer => this.map.removeLayer(layer));
    this.zoneLabelLayer.clearLayers();
    this.zoneLayers = {};

    zones.forEach(zone => {
      const prediction = predictions.find(item => item.zoneId === zone.id);
      const level = prediction?.riskLevel || 'Low';
      const color = this.riskColor(level);
      const zoneReports = reports.filter(report => report.zoneId === zone.id);
      const polygon = L.polygon(this.shapes[zone.id], {
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 2
      }).addTo(this.map);
      polygon.bindTooltip(`${zone.name}<br>Risk: ${prediction?.riskScore ?? 0}/100 (${level})<br>Complaints: ${zoneReports.length}`);
      polygon.on('click', () => this.selectZone(zone.id));
      const center = this.centers[zone.id];
      L.marker(center, {
        icon: L.divIcon({
          className: 'risk-map-label',
          html: `<span>${this.escapeHtml(zone.name.replace(/^Zone \d+ - /, ''))}<br>${prediction?.riskScore ?? 0} · ${level}</span>`,
          iconSize: [112, 42],
          iconAnchor: [56, 21]
        }),
        interactive: true
      }).addTo(this.zoneLabelLayer).on('click', () => this.selectZone(zone.id));
      this.zoneLayers[zone.id] = polygon;
    });
  },

  renderComplaintMarkers() {
    if (!this.complaintLayer) return;
    this.complaintLayer.clearLayers();
    if (!document.getElementById('map-show-complaints').checked) return;
    const category = document.getElementById('map-filter-category').value;
    DataStore.getReports().filter(report => !category || report.category === category).forEach((report, index) => {
      const center = this.centers[report.zoneId];
      if (!center) return;
      const angle = index * 2.399;
      const radius = 4 + (index % 4) * 1.5;
      const location = [center[0] + Math.sin(angle) * radius, center[1] + Math.cos(angle) * radius];
      const color = this.riskColor(report.priority || report.severity);
      const marker = L.circleMarker(location, {
        radius: 5,
        color: '#ffffff',
        weight: 1,
        fillColor: color,
        fillOpacity: 0.95
      }).addTo(this.complaintLayer);
      marker.bindPopup(`<strong>${this.escapeHtml(report.id)}</strong><br>${this.escapeHtml(report.title || report.category)}<br>${this.escapeHtml(report.status)}<br><em>Simulated position in ${this.escapeHtml(report.zoneName || 'zone')}; address is not geocoded.</em>`);
      marker.on('click', () => this.selectZone(report.zoneId));
    });
  },

  selectZone(zoneId) {
    const zones = DataStore.getZones();
    const predictions = DataStore.getPredictions();
    const reports = DataStore.getReports();
    const zone = zones.find(item => item.id === zoneId);
    if (!zone) return;
    this.selectedZoneId = zoneId;
    const prediction = predictions.find(item => item.zoneId === zoneId);
    const zoneReports = reports.filter(report => report.zoneId === zoneId);
    const target = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    target('drawer-zone-title', zone.name);
    target('drawer-pop', `${Number(zone.population || 0).toLocaleString()} (estimate)`);
    target('drawer-complaints', zoneReports.length);
    target('drawer-weather', `${zone.weatherRisk || 'Not configured'} (demo estimate)`);
    target('drawer-service', `${zone.serviceFreq || 'Not configured'} (demo estimate)`);
    target('drawer-risk-score', `${prediction?.riskScore ?? 0}/100`);
    target('drawer-risk-level', prediction?.riskLevel || 'Low');
    target('drawer-predicted-problem', prediction?.category || 'No predicted category');
    target('drawer-confidence', 'Not calculated');
    target('drawer-timeframe', prediction?.timeframe || 'Routine monitoring');
    target('drawer-recommended-action', prediction?.recommendedAction || 'Review incoming reports.');
    const badge = document.getElementById('drawer-risk-level');
    badge.className = `badge badge-risk-${(prediction?.riskLevel || 'Low').toLowerCase()}`;
    if (this.zoneLayers[zoneId]) {
      Object.entries(this.zoneLayers).forEach(([id, layer]) => layer.setStyle({ weight: id === zoneId ? 4 : 2 }));
    }
  },

  riskColor(level) {
    return ({ Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' })[level] || '#64748b';
  },

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }
};
