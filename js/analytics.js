document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('analytics-page')) Analytics.init();
});

const Analytics = {
  charts: {},

  init() {
    this.populateFilters();
    this.setDefaultDates();
    ['analytics-from', 'analytics-to', 'analytics-category', 'analytics-zone', 'analytics-interval']
      .forEach(id => document.getElementById(id).addEventListener('change', () => this.update()));
    document.getElementById('analytics-export-csv').addEventListener('click', () => this.exportCsv());
    document.getElementById('analytics-export-pdf').addEventListener('click', () => this.exportPdf());
    window.addEventListener('civic-data-changed', () => this.update());
    window.onLiveSimUpdate = () => this.update();
    this.update();
  },

  populateFilters() {
    [...new Set(DataStore.getReports().map(report => report.category).filter(Boolean))].sort().forEach(category => {
      document.getElementById('analytics-category').add(new Option(category, category));
    });
    DataStore.getZones().forEach(zone => document.getElementById('analytics-zone').add(new Option(zone.name, zone.id)));
  },

  setDefaultDates() {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 90);
    document.getElementById('analytics-to').value = this.dateKey(to);
    document.getElementById('analytics-from').value = this.dateKey(from);
  },

  dateKey(date) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  },

  getFilteredReports() {
    const from = document.getElementById('analytics-from').value;
    const to = document.getElementById('analytics-to').value;
    const category = document.getElementById('analytics-category').value;
    const zone = document.getElementById('analytics-zone').value;
    return DataStore.getReports().filter(report => {
      const reportDate = report.date || (report.createdAt && report.createdAt.slice(0, 10));
      return (!from || reportDate >= from)
        && (!to || reportDate <= to)
        && (!category || report.category === category)
        && (!zone || report.zoneId === zone);
    });
  },

  update() {
    const reports = this.getFilteredReports();
    this.renderSummaryStats(reports);
    if (typeof Chart === 'undefined') {
      App.showToast('Chart.js is unavailable. Analytics summaries and CSV export remain available.', 'warning');
      return;
    }
    this.updateCharts(reports);
  },

  renderSummaryStats(reports) {
    const resolved = reports.filter(report => report.status === 'Resolved');
    const durations = resolved
      .filter(report => report.createdAt && report.resolvedAt)
      .map(report => (new Date(report.resolvedAt) - new Date(report.createdAt)) / 3600000)
      .filter(hours => Number.isFinite(hours) && hours >= 0);
    const average = durations.length
      ? `${(durations.reduce((sum, hours) => sum + hours, 0) / durations.length).toFixed(1)} hrs`
      : '—';
    document.getElementById('analytics-prevented-count').textContent = reports.filter(report => report.status === 'Prevented').length;
    document.getElementById('analytics-avg-response').textContent = average;
    document.getElementById('analytics-accuracy').textContent = reports.length ? `${Math.round(resolved.length / reports.length * 100)}%` : '0%';
  },

  updateCharts(reports) {
    const predictions = DataStore.getPredictions();
    const zones = DataStore.getZones();
    const interval = document.getElementById('analytics-interval').value;
    const trend = this.buildTrend(reports, interval);
    const categoryCounts = this.countBy(reports, report => report.category || 'Uncategorized');
    const statusCounts = {
      Resolved: reports.filter(report => report.status === 'Resolved').length,
      Open: reports.filter(report => !['Resolved', 'Rejected'].includes(report.status)).length,
      Rejected: reports.filter(report => report.status === 'Rejected').length
    };
    const priorityCounts = this.countBy(reports, report => report.priority || report.severity || 'Unknown');
    const selectedZone = document.getElementById('analytics-zone').value;
    const zoneRows = zones.filter(zone => !selectedZone || zone.id === selectedZone).map(zone => ({
      name: zone.name,
      score: predictions.find(prediction => prediction.zoneId === zone.id)?.riskScore || 0,
      level: predictions.find(prediction => prediction.zoneId === zone.id)?.riskLevel || 'Low'
    }));

    this.setChart('time', 'line', document.getElementById('chart-time-trend'), trend.labels, [
      { label: 'Complaints', data: trend.complaints, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, .12)', tension: .3, fill: true },
      { label: 'Resolved', data: trend.resolved, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, .1)', tension: .3, fill: true }
    ], { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } });
    this.setChart('category', 'doughnut', document.getElementById('chart-category-breakdown'), Object.keys(categoryCounts), [
      { data: Object.values(categoryCounts), backgroundColor: this.palette }
    ], { plugins: { legend: { position: 'bottom' } } });
    this.setChart('zone', 'bar', document.getElementById('chart-zone-risk'), zoneRows.map(row => row.name), [
      { label: 'Risk score (prototype)', data: zoneRows.map(row => row.score), backgroundColor: zoneRows.map(row => this.riskColor(row.level)) }
    ], { scales: { y: { max: 100, beginAtZero: true } } });
    this.setChart('status', 'doughnut', document.getElementById('chart-status-breakdown'), Object.keys(statusCounts), [
      { data: Object.values(statusCounts), backgroundColor: ['#10b981', '#f59e0b', '#94a3b8'] }
    ], { plugins: { legend: { position: 'bottom' } } });
    this.setChart('priority', 'bar', document.getElementById('chart-priority-breakdown'), Object.keys(priorityCounts), [
      { label: 'Complaints', data: Object.values(priorityCounts), backgroundColor: this.palette }
    ], { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } });
  },

  palette: ['#2563eb', '#f97316', '#10b981', '#7c3aed', '#ef4444', '#f59e0b', '#0ea5e9', '#64748b'],

  countBy(items, selector) {
    return items.reduce((counts, item) => {
      const key = selector(item);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  },

  buildTrend(reports, interval) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const periods = interval === 'week' ? 12 : 30;
    const starts = [];
    for (let offset = periods - 1; offset >= 0; offset--) {
      const date = new Date(end);
      date.setDate(date.getDate() - (interval === 'week' ? date.getDay() + offset * 7 : offset));
      starts.push(date);
    }
    const labels = starts.map(date => this.dateKey(date));
    const complaints = starts.map((start, index) => {
      const next = new Date(start);
      next.setDate(next.getDate() + (interval === 'week' ? 7 : 1));
      return reports.filter(report => {
        const date = new Date(report.date || report.createdAt);
        return date >= start && date < next;
      }).length;
    });
    const resolved = starts.map((start, index) => {
      const next = new Date(start);
      next.setDate(next.getDate() + (interval === 'week' ? 7 : 1));
      return reports.filter(report => {
        const date = new Date(report.resolvedAt || report.updatedAt || report.createdAt || report.date);
        return report.status === 'Resolved' && date >= start && date < next;
      }).length;
    });
    return { labels, complaints, resolved };
  },

  setChart(key, type, canvas, labels, datasets, extraOptions) {
    if (!canvas) return;
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      ...extraOptions
    };
    if (this.charts[key]) {
      this.charts[key].data.labels = labels;
      this.charts[key].data.datasets = datasets;
      this.charts[key].options = options;
      this.charts[key].update();
      return;
    }
    this.charts[key] = new Chart(canvas, { type, data: { labels, datasets }, options });
  },

  riskColor(level) {
    return ({ Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' })[level] || '#64748b';
  },

  escapeCsv(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  },

  exportCsv() {
    const reports = this.getFilteredReports();
    const fields = ['id', 'title', 'category', 'description', 'zoneName', 'location', 'date', 'time', 'priority', 'status', 'department'];
    const rows = [fields.map(field => this.escapeCsv(field)).join(',')];
    reports.forEach(report => rows.push(fields.map(field => this.escapeCsv(report[field])).join(',')));
    const csv = `\uFEFF${rows.join('\r\n')}`;
    App.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'civic-complaints.csv');
  },

  exportPdf() {
    const Pdf = window.jspdf?.jsPDF;
    if (!Pdf) {
      App.showToast('PDF export library did not load. Check your connection and try again.', 'error');
      return;
    }
    const reports = this.getFilteredReports();
    const pdf = new Pdf();
    pdf.setFontSize(18);
    pdf.text('Civic Complaint Analytics', 14, 18);
    pdf.setFontSize(10);
    pdf.text(`Generated ${new Date().toLocaleString()} · ${reports.length} filtered complaints`, 14, 26);
    const lines = reports.slice(0, 30).map(report =>
      `${report.id} | ${report.date || '—'} | ${report.category} | ${report.priority || report.severity} | ${report.status}`
    );
    pdf.text(lines.length ? lines : ['No complaints match the current filters.'], 14, 36, { maxWidth: 180 });
    pdf.save('civic-complaint-analytics.pdf');
  }
};
