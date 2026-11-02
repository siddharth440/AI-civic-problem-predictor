document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map-page')) RiskMap.init();
});

const RiskMap = {
  map: null,
  complaintLayer: null,
  userLocationLayer: null,
  markersById: new Map(),
  currentLocation: null,
  selectedLocation: null,

  init() {
    this.initMap();
    this.initFilters();
    this.bindLocationControls();
    this.renderComplaints();
    window.addEventListener('civic-data-changed', () => this.renderComplaints());
    window.addEventListener('storage', event => {
      if (event.key === 'sih_civic_reports') this.renderComplaints();
    });
    window.onLiveSimUpdate = () => this.renderComplaints();
  },

  initMap() {
    const container = document.getElementById('civic-risk-map');
    if (typeof L === 'undefined') {
      container.textContent = 'The map library did not load. Check your connection and reload this page.';
      App.showToast('Leaflet could not be loaded; map visualization is unavailable.', 'error');
      return;
    }

    this.map = L.map(container, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(this.map);
    this.complaintLayer = L.layerGroup().addTo(this.map);
    this.userLocationLayer = L.layerGroup().addTo(this.map);
    this.map.on('click', event => this.selectManualLocation(event.latlng.lat, event.latlng.lng));
    window.setTimeout(() => this.map.invalidateSize(), 100);
  },

  initFilters() {
    const categorySelect = document.getElementById('nearby-filter-category');
    [...new Set(DataStore.getReports().map(report => report.category).filter(Boolean))]
      .sort()
      .forEach(category => categorySelect.add(new Option(category, category)));
    [
      'nearby-filter-category',
      'nearby-filter-priority',
      'nearby-filter-status',
      'nearby-filter-radius'
    ].forEach(id => document.getElementById(id).addEventListener('change', () => this.renderComplaints()));
  },

  bindLocationControls() {
    document.getElementById('use-current-location').addEventListener('click', () => this.detectLocation());
    document.getElementById('confirm-report-location').addEventListener('click', () => this.confirmReportLocation());
    document.getElementById('nearby-complaint-list').addEventListener('click', event => {
      const button = event.target.closest('[data-view-report]');
      if (button) this.viewComplaint(button.dataset.viewReport);
    });
  },

  detectLocation() {
    const button = document.getElementById('use-current-location');
    const loading = document.getElementById('location-loading');
    const message = document.getElementById('location-message');
    if (!navigator.geolocation) {
      message.textContent = 'This browser does not support location services. You can still select a point on the map.';
      return;
    }

    button.disabled = true;
    loading.hidden = false;
    this.selectedLocation = null;
    this.currentLocation = null;
    if (this.userLocationLayer) this.userLocationLayer.clearLayers();
    document.getElementById('current-latitude').textContent = '—';
    document.getElementById('current-longitude').textContent = '—';
    document.getElementById('current-accuracy').textContent = '—';
    document.getElementById('confirm-report-location').disabled = true;
    document.getElementById('nearby-filter-radius').disabled = true;
    document.getElementById('nearby-location-hint').textContent = 'Set your location to calculate distances and apply the radius filter.';
    message.textContent = 'Waiting for your device to determine your location…';
    try {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude, accuracy } = position.coords;
          if (!this.isValidCoordinate(latitude, longitude) || !Number.isFinite(accuracy)) {
            this.showLocationError({ code: 2 });
            button.disabled = false;
            loading.hidden = true;
            return;
          }
          this.currentLocation = { latitude, longitude, accuracy, method: 'gps' };
          this.selectedLocation = this.currentLocation;
          this.updateLocationDisplay(this.currentLocation);
          this.renderComplaints();
          if (this.map) this.map.setView([latitude, longitude], 16);
          button.disabled = false;
          loading.hidden = true;
        },
        error => {
          this.showLocationError(error);
          button.disabled = false;
          loading.hidden = true;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } catch (error) {
      console.error('Unable to request browser location.', error);
      this.showLocationError({ code: 0 });
      button.disabled = false;
      loading.hidden = true;
    }
  },

  showLocationError(error) {
    const message = document.getElementById('location-message');
    const descriptions = {
      1: 'Location permission was denied. Allow location access in your browser settings, or select a point on the map instead.',
      2: 'Your location is currently unavailable. Check your device location settings or select a point on the map.',
      3: 'Location detection timed out. Please retry, or select a point on the map.'
    };
    message.textContent = descriptions[error.code] || 'Unable to determine your location. Please retry or select a point on the map.';
  },

  selectManualLocation(latitude, longitude) {
    const location = { latitude, longitude, accuracy: null, method: 'manual' };
    this.selectedLocation = location;
    this.updateLocationDisplay(location);
    this.renderComplaints();
  },

  updateLocationDisplay(location) {
    document.getElementById('current-latitude').textContent = location.latitude.toFixed(6);
    document.getElementById('current-longitude').textContent = location.longitude.toFixed(6);
    document.getElementById('current-accuracy').textContent = location.accuracy === null
      ? 'Map-selected point'
      : `±${Math.round(location.accuracy)} m`;
    document.getElementById('location-message').textContent = location.method === 'gps'
      ? 'Location detected. Your device coordinates stay in this browser until you explicitly opt in to share them.'
      : 'Map point selected. Confirm below to use these coordinates in a complaint.';
    document.getElementById('confirm-report-location').disabled = false;
    document.getElementById('nearby-filter-radius').disabled = false;
    if (this.userLocationLayer && typeof L !== 'undefined') {
      this.userLocationLayer.clearLayers();
      if (location.accuracy !== null) {
        L.circle([location.latitude, location.longitude], {
          radius: location.accuracy,
          color: '#2563eb',
          weight: 1,
          fillColor: '#3b82f6',
          fillOpacity: 0.12
        }).addTo(this.userLocationLayer);
      }
      L.circleMarker([location.latitude, location.longitude], {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1
      }).bindPopup(`<strong>${location.method === 'gps' ? 'Your current location' : 'Selected report location'}</strong><br>${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}${location.accuracy === null ? '' : `<br>Accuracy: ±${Math.round(location.accuracy)} m`}`).addTo(this.userLocationLayer);
    }
    document.getElementById('nearby-location-hint').textContent = 'Distances are calculated from the selected point. Nearby complaint locations are visible only when saved with coordinates.';
  },

  confirmReportLocation() {
    if (!this.selectedLocation) return;
    try {
      sessionStorage.setItem('civic_report_location_selection', JSON.stringify(this.selectedLocation));
      window.location.href = 'citizen.html?location=selected';
    } catch (error) {
      console.error('Unable to pass the selected location to the complaint form.', error);
      document.getElementById('location-message').textContent = 'Could not open the complaint form with this point. Check browser storage settings and try again.';
    }
  },

  renderComplaints() {
    if (!this.complaintLayer) return;
    this.complaintLayer.clearLayers();
    this.markersById.clear();
    const reports = this.getNearbyComplaints(
      DataStore.getReports(),
      this.selectedLocation,
      Number(document.getElementById('nearby-filter-radius').value),
      document.getElementById('nearby-filter-category').value,
      document.getElementById('nearby-filter-priority').value,
      document.getElementById('nearby-filter-status').value
    );
    reports.forEach(report => {
      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: this.priorityColor(report.priority),
        fillOpacity: 0.95
      });
      marker.bindPopup(this.complaintPopup(report));
      marker.addTo(this.complaintLayer);
      this.markersById.set(report.id, marker);
    });
    this.renderComplaintList(reports);
  },

  getNearbyComplaints(reports, center, radius, category, priority, status) {
    return reports
      .filter(report => this.isValidCoordinate(report.latitude, report.longitude))
      .map(report => ({
        ...report,
        distanceMeters: center
          ? this.haversineDistance(center.latitude, center.longitude, report.latitude, report.longitude)
          : null
      }))
      .filter(report => !center || report.distanceMeters <= radius)
      .filter(report => !category || report.category === category)
      .filter(report => !priority || (report.priority || report.severity) === priority)
      .filter(report => !status || report.status === status)
      .sort((first, second) => {
        if (first.distanceMeters === null) return second.distanceMeters === null ? 0 : 1;
        if (second.distanceMeters === null) return -1;
        return first.distanceMeters - second.distanceMeters;
      });
  },

  haversineDistance(latitude1, longitude1, latitude2, longitude2) {
    const radians = degrees => degrees * Math.PI / 180;
    const latitudeDelta = radians(latitude2 - latitude1);
    const longitudeDelta = radians(longitude2 - longitude1);
    const rawA = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(radians(latitude1)) * Math.cos(radians(latitude2)) * Math.sin(longitudeDelta / 2) ** 2;
    const a = Math.min(1, Math.max(0, rawA));
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  isValidCoordinate(latitude, longitude) {
    if (latitude === null || latitude === '' || longitude === null || longitude === '') return false;
    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);
    return Number.isFinite(numericLatitude) && Number.isFinite(numericLongitude)
      && numericLatitude >= -90 && numericLatitude <= 90
      && numericLongitude >= -180 && numericLongitude <= 180;
  },

  renderComplaintList(reports) {
    const list = document.getElementById('nearby-complaint-list');
    const count = document.getElementById('nearby-count');
    count.textContent = String(reports.length);
    list.replaceChildren();
    if (!reports.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = DataStore.getReports().some(report => this.isValidCoordinate(report.latitude, report.longitude))
        ? 'No complaints with saved coordinates match these filters.'
        : 'No saved complaints have map coordinates yet. Reports without coordinates cannot be placed on the map.';
      list.appendChild(empty);
      return;
    }

    reports.forEach(report => {
      const card = document.createElement('article');
      card.className = 'nearby-complaint-card';
      const heading = document.createElement('div');
      heading.className = 'nearby-complaint-heading';
      const title = document.createElement('h4');
      title.textContent = report.title || report.category || report.id;
      const priority = document.createElement('span');
      priority.className = `priority-chip priority-${String(report.priority || report.severity || 'low').toLowerCase()}`;
      priority.textContent = report.priority || report.severity || 'Unspecified';
      heading.append(title, priority);
      const details = document.createElement('p');
      details.textContent = `${report.category || 'Uncategorized'} · ${this.formatDistance(report.distanceMeters)}`;
      const status = document.createElement('p');
      status.className = 'nearby-complaint-status';
      status.textContent = `${report.id} · ${report.status || 'Unknown status'} · ${report.date || 'Date not recorded'}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-outline btn-sm';
      button.dataset.viewReport = report.id;
      button.textContent = 'View on map';
      card.append(heading, details, status, button);
      list.appendChild(card);
    });
  },

  complaintPopup(report) {
    const priority = report.priority || report.severity || 'Unspecified';
    return `<strong>${this.escapeHtml(report.id)}</strong><br>`
      + `${this.escapeHtml(report.category || 'Uncategorized')}<br>`
      + `${this.escapeHtml(report.description || report.title || 'No description')}<br>`
      + `Distance: ${this.escapeHtml(this.formatDistance(report.distanceMeters))}<br>`
      + `Priority: ${this.escapeHtml(priority)}<br>`
      + `Status: ${this.escapeHtml(report.status || 'Unknown')}<br>`
      + `Reported: ${this.escapeHtml(report.date || 'Not recorded')}`;
  },

  viewComplaint(id) {
    const marker = this.markersById.get(id);
    if (!marker) return;
    this.map.setView(marker.getLatLng(), Math.max(this.map.getZoom(), 16));
    marker.openPopup();
  },

  formatDistance(distanceMeters) {
    if (distanceMeters === null || !Number.isFinite(distanceMeters)) return 'Set a location for distance';
    return distanceMeters < 1000
      ? `${Math.round(distanceMeters)} m`
      : `${(distanceMeters / 1000).toFixed(2)} km`;
  },

  priorityColor(priority) {
    return ({
      Low: '#16a34a',
      Medium: '#eab308',
      High: '#f97316',
      Critical: '#dc2626'
    })[priority] || '#64748b';
  },

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }
};
