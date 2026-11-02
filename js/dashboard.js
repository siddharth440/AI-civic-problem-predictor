document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('dashboard-page')) Dashboard.init();
});

const Dashboard = {
  selectedReportId: null,
  backendReportIds: new Set(),

  init() {
    this.initFilters();
    this.render();
    document.getElementById('connect-backend-btn')?.addEventListener('click', () => {
      this.connectBackend().catch(error => {
        DataStore.setAdminToken(null);
        document.getElementById('backend-admin-token').value = '';
        document.getElementById('backend-connection-status').textContent = `Backend connection failed: ${error.message}`;
        App.showToast(`Backend connection failed: ${error.message}`, 'error');
      });
    });
    window.addEventListener('civic-data-changed', () => this.render());
    window.addEventListener('storage', event => {
      if (event.key === 'sih_civic_reports') this.render();
    });
    window.onLiveSimUpdate = () => this.render();
    document.getElementById('priority-actions-tbody')?.addEventListener('change', event => {
      if (event.target.matches('[data-prediction-status]')) {
        this.handlePredictionStatusChange(event.target.dataset.predictionStatus, event.target.value);
      }
    });
    document.getElementById('recent-reports-tbody')?.addEventListener('click', event => {
      const button = event.target.closest('[data-report-details]');
      if (button) this.showComplaintDetails(button.dataset.reportDetails);
    });
    document.getElementById('complaint-detail-content')?.addEventListener('click', event => {
      if (event.target.id === 'dashboard-save-update') this.saveComplaintUpdate().catch(error => {
        console.error('Complaint update failed.', error);
        App.showToast(`Could not update complaint: ${error.message}`, 'error');
      });
    });
    document.querySelectorAll('[data-close-complaint-modal]').forEach(button => {
      button.addEventListener('click', () => document.getElementById('complaint-detail-modal').classList.remove('active'));
    });
  },

  render() {
    this.renderStats();
    this.renderRiskOverview();
    this.renderPriorityActions();
    this.renderRecentReports();
  },

  renderStats() {
    const reports = DataStore.getReports();
    const predictions = DataStore.getPredictions();
    const resolved = reports.filter(report => report.status === 'Resolved');
    const pending = reports.filter(report => ['Submitted', 'Under Review'].includes(report.status));
    const active = reports.filter(report => ['Assigned', 'In Progress'].includes(report.status));
    const critical = reports.filter(report => (report.priority || report.severity) === 'Critical');
    const completedDurations = resolved
      .filter(report => report.createdAt && report.resolvedAt)
      .map(report => (new Date(report.resolvedAt) - new Date(report.createdAt)) / 3600000)
      .filter(hours => Number.isFinite(hours) && hours >= 0);
    const averageHours = completedDurations.length
      ? `${(completedDurations.reduce((sum, hours) => sum + hours, 0) / completedDurations.length).toFixed(1)} hrs`
      : '—';
    const values = {
      'stat-total-reports': reports.length,
      'stat-pending': pending.length,
      'stat-resolved': resolved.length,
      'stat-critical': critical.length,
      'stat-active-problems': active.length,
      'stat-high-risk-zones': predictions.filter(item => ['Critical', 'High'].includes(item.riskLevel)).length,
      'stat-resolution-rate': reports.length ? `${Math.round(resolved.length / reports.length * 100)}%` : '0%',
      'stat-average-resolution': averageHours
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  },

  renderRiskOverview() {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    DataStore.getPredictions().forEach(prediction => {
      if (counts[prediction.riskLevel] !== undefined) counts[prediction.riskLevel]++;
    });
    Object.entries(counts).forEach(([level, count]) => {
      const element = document.getElementById(`count-${level.toLowerCase()}`);
      if (element) element.textContent = count;
    });
  },

  renderPriorityActions() {
    const tbody = document.getElementById('priority-actions-tbody');
    if (!tbody) return;
    tbody.replaceChildren();
    DataStore.getPredictions().forEach(prediction => {
      const row = document.createElement('tr');
      [
        prediction.zoneName,
        prediction.category,
        `${prediction.riskScore}%`,
        prediction.riskLevel,
        prediction.recommendedAction
      ].forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      const statusCell = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'status-select';
      select.dataset.predictionStatus = prediction.id;
      ['Predicted', 'Assigned', 'In Progress', 'Resolved', 'Prevented'].forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        option.selected = prediction.status === status;
        select.appendChild(option);
      });
      statusCell.appendChild(select);
      row.appendChild(statusCell);
      tbody.appendChild(row);
    });
  },

  initFilters() {
    const reports = DataStore.getReports();
    const categorySelect = document.getElementById('report-filter-category');
    const zoneSelect = document.getElementById('report-filter-zone');
    [...new Set(reports.map(report => report.category).filter(Boolean))].sort().forEach(category => {
      categorySelect.add(new Option(category, category));
    });
    DataStore.getZones().forEach(zone => zoneSelect.add(new Option(zone.name, zone.id)));
    ['report-search', 'report-filter-category', 'report-filter-zone', 'report-filter-priority', 'report-filter-status', 'report-sort']
      .forEach(id => document.getElementById(id)?.addEventListener('input', () => this.renderRecentReports()));
  },

  getFilteredReports() {
    const search = document.getElementById('report-search').value.trim().toLowerCase();
    const category = document.getElementById('report-filter-category').value;
    const zone = document.getElementById('report-filter-zone').value;
    const priority = document.getElementById('report-filter-priority').value;
    const status = document.getElementById('report-filter-status').value;
    const sort = document.getElementById('report-sort').value;
    const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return DataStore.getReports().filter(report => {
      const searchable = `${report.id} ${report.title || ''} ${report.location || ''} ${report.description || ''}`.toLowerCase();
      return (!search || searchable.includes(search))
        && (!category || report.category === category)
        && (!zone || report.zoneId === zone)
        && (!priority || (report.priority || report.severity) === priority)
        && (!status || report.status === status);
    }).sort((a, b) => {
      if (sort === 'priority') return (rank[b.priority || b.severity] || 0) - (rank[a.priority || a.severity] || 0);
      const dateA = new Date(a.createdAt || a.date).getTime() || 0;
      const dateB = new Date(b.createdAt || b.date).getTime() || 0;
      return sort === 'oldest' ? dateA - dateB : dateB - dateA;
    });
  },

  renderRecentReports() {
    const tbody = document.getElementById('recent-reports-tbody');
    if (!tbody) return;
    tbody.replaceChildren();
    this.getFilteredReports().forEach(report => {
      const row = document.createElement('tr');
      const values = [report.id, report.title || report.category, report.location, report.priority || report.severity, report.date, report.status];
      values.forEach((value, index) => {
        const cell = document.createElement('td');
        cell.textContent = value || '—';
        if (index === 0 && report.isDemo) {
          const demo = document.createElement('span');
          demo.className = 'badge badge-risk-medium';
          demo.textContent = 'Demo';
          cell.append(' ', demo);
        }
        row.appendChild(cell);
      });
      const actionCell = document.createElement('td');
      const detailsButton = document.createElement('button');
      detailsButton.type = 'button';
      detailsButton.className = 'btn btn-outline btn-sm';
      detailsButton.dataset.reportDetails = report.id;
      detailsButton.textContent = 'Details';
      actionCell.appendChild(detailsButton);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });
  },

  async showComplaintDetails(id) {
    const report = DataStore.getReports().find(item => item.id === id);
    if (!report) return;
    this.selectedReportId = id;
    const container = document.getElementById('complaint-detail-content');
    container.replaceChildren();
    const addDetail = (label, value) => {
      const paragraph = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      paragraph.append(strong, document.createTextNode(value || '—'));
      container.appendChild(paragraph);
    };
    addDetail('ID', report.id);
    addDetail('Title', report.title || report.category);
    addDetail('Description', report.description);
    addDetail('Location', `${report.zoneName || report.zoneId || ''} ${report.location || ''}`);
    addDetail('Priority', report.priority || report.severity);
    addDetail('Submitted', `${report.date || ''} ${report.time || ''}`);

    const controls = document.createElement('div');
    controls.className = 'dashboard-filters';
    const statusSelect = document.createElement('select');
    statusSelect.className = 'form-control';
    statusSelect.id = 'complaint-status-control';
    ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].forEach(status => {
      const option = new Option(status, status, false, status === report.status);
      statusSelect.add(option);
    });
    const departmentInput = document.createElement('input');
    departmentInput.className = 'form-control';
    departmentInput.id = 'complaint-department-control';
    departmentInput.value = report.department || '';
    departmentInput.placeholder = 'Assigned department';
    departmentInput.setAttribute('aria-label', 'Assigned department');
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn btn-primary';
    saveButton.id = 'dashboard-save-update';
    saveButton.textContent = 'Save status and assignment';
    controls.append(statusSelect, departmentInput, saveButton);
    container.appendChild(controls);

    const timelineTitle = document.createElement('h4');
    timelineTitle.textContent = 'Authority action history';
    container.appendChild(timelineTitle);
    const timeline = document.createElement('ol');
    (report.history || [{ status: report.status, at: report.createdAt || report.date, note: 'Imported or sample record.' }]).forEach(entry => {
      const item = document.createElement('li');
      item.textContent = `${new Date(entry.at).toLocaleString()} — ${entry.status}: ${entry.note}`;
      timeline.appendChild(item);
    });
    container.appendChild(timeline);

    if (report.imageId) {
      const image = await DataStore.getImage(report.imageId);
      if (image) {
        const preview = document.createElement('img');
        preview.alt = 'Complaint evidence';
        preview.className = 'complaint-evidence';
        preview.src = URL.createObjectURL(image);
        container.appendChild(preview);
      }
    }
    document.getElementById('complaint-detail-modal').classList.add('active');
  },

  async saveComplaintUpdate() {
    const report = DataStore.getReports().find(item => item.id === this.selectedReportId);
    if (!report) throw new Error('Complaint no longer exists.');
    const status = document.getElementById('complaint-status-control').value;
    const department = document.getElementById('complaint-department-control').value.trim();
    const remote = this.backendReportIds.has(report.id) || report.source === 'backend';
    const remoteUpdates = {};
    if (status !== report.status) remoteUpdates.status = status;
    if (department && department !== report.department) remoteUpdates.department = department;
    if (remote && Object.keys(remoteUpdates).length) {
      if (!DataStore.adminToken) throw new Error('Connect with the admin token before updating a backend complaint.');
      await DataStore.updateBackendComplaint(report.id, remoteUpdates);
    }
    if (status !== report.status) await DataStore.updateReportStatus(report.id, status);
    if (department && department !== report.department) await DataStore.updateReportAssignment(report.id, department);
    App.showToast('Complaint status and assignment updated.', 'success');
    document.getElementById('complaint-detail-modal').classList.remove('active');
    this.render();
  },

  async handlePredictionStatusChange(id, status) {
    const prediction = DataStore.getPredictions().find(item => item.id === id);
    if (!prediction) return;
    prediction.status = status;
    DataStore.updatePrediction(prediction);
    App.showToast(`Updated dispatch ${id} to ${status}.`, 'success');
    this.renderStats();
  },

  async connectBackend() {
    const status = document.getElementById('backend-connection-status');
    const token = document.getElementById('backend-admin-token').value;
    if (!DataStore.getApiBaseUrl()) {
      status.textContent = 'Configure API_BASE_URL in js/config.js first.';
      throw new Error('No API base URL has been configured.');
    }
    if (!token) throw new Error('Enter the admin API token.');
    status.textContent = 'Connecting...';
    DataStore.setAdminToken(token);
    const reports = await DataStore.syncBackendReports();
    this.backendReportIds = new Set(reports.map(report => report.id));
    document.getElementById('backend-admin-token').value = '';
    status.textContent = `Connected · ${reports.length} backend complaint(s) synchronized to this browser.`;
    App.showToast(`Connected to backend; ${reports.length} records synchronized.`, 'success');
    this.render();
  }
};
