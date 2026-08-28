/*
  AI Civic Problem Predictor - Citizen Reporting Portal Controller
  Smart India Hackathon (SIH) Prototype
*/

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('citizen-page')) {
    CitizenPortal.init();
  }
});

const CitizenPortal = {
  init() {
    this.initForm();
    this.renderUserHistory();
  },

  initForm() {
    const form = document.getElementById('citizen-report-form');
    if (!form) return;

    // Set default date to today
    const dateInput = document.getElementById('report-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(form);
    });
  },

  handleSubmit(form) {
    const name = document.getElementById('report-name').value.trim();
    const category = document.getElementById('report-category').value;
    const description = document.getElementById('report-desc').value.trim();
    const zoneId = document.getElementById('report-zone').value;
    const location = document.getElementById('report-location').value.trim();
    const severity = document.getElementById('report-severity').value;
    const date = document.getElementById('report-date').value;

    // Form Validation
    if (!name || !category || !description || !zoneId || !location) {
      App.showToast('Please complete all required fields.', 'error');
      return;
    }

    // Generate unique Report ID
    const reportId = 'REP-' + Math.floor(8510 + Math.random() * 890);

    const newReport = {
      id: reportId,
      name: name,
      category: category,
      zoneId: zoneId,
      location: `${zoneId.replace('zone-', 'Zone ')} - ${location}`,
      description: description,
      severity: severity,
      date: date,
      status: 'Assigned',
      image: 'assets/images/placeholder.jpg'
    };

    // Save to LocalStorage Data Store
    DataStore.addReport(newReport);

    // Trigger AI prediction recalculation for the affected zone
    const predictions = PredictionEngine.recalculateAllZonePredictions();
    predictions.forEach(p => DataStore.updatePrediction(p));

    // Reset Form
    form.reset();
    document.getElementById('report-date').value = new Date().toISOString().split('T')[0];

    // Show Confirmation Modal / Toast
    this.showConfirmationModal(reportId, newReport);
    this.renderUserHistory();
    App.showToast(`Report ${reportId} submitted & risk matrix updated!`, 'success');
  },

  showConfirmationModal(reportId, report) {
    const modal = document.getElementById('submission-success-modal');
    if (modal) {
      document.getElementById('modal-report-id').textContent = reportId;
      document.getElementById('modal-report-zone').textContent = report.location;
      document.getElementById('modal-report-cat').textContent = report.category;
      modal.classList.add('active');
    }
  },

  renderUserHistory() {
    const container = document.getElementById('citizen-history-list');
    if (!container) return;

    const reports = DataStore.getReports().slice(0, 6);
    container.innerHTML = '';

    if (reports.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);">No reports submitted yet.</p>';
      return;
    }

    reports.forEach(rep => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '1rem 1.25rem';
      card.style.marginBottom = '0.75rem';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <span style="font-weight:700; font-size:0.9rem; color:var(--accent-primary);"><code>${rep.id}</code></span>
          <span class="badge ${rep.status === 'Resolved' || rep.status === 'Prevented' ? 'badge-risk-low' : 'badge-risk-high'}">${rep.status}</span>
        </div>
        <div style="font-weight:600; font-size:0.95rem;">${rep.category} - <span style="font-weight:400; color:var(--text-secondary);">${rep.location}</span></div>
        <p style="font-size:0.825rem; color:var(--text-secondary); margin-top:0.3rem;">${rep.description}</p>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem; display:flex; justify-content:space-between;">
          <span>Submitted on ${rep.date}</span>
          <span>Severity: <strong>${rep.severity}</strong></span>
        </div>
      `;
      container.appendChild(card);
    });
  }
};
