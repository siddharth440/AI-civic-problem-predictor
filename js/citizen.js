document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('citizen-page')) CitizenPortal.init();
});

const CitizenPortal = {
  init() {
    this.initForm();
    this.applyMapLocationSelection();
    this.renderUserHistory();
    window.addEventListener('civic-data-changed', () => this.renderUserHistory());
  },

  initForm() {
    const form = document.getElementById('citizen-report-form');
    if (!form) return;

    const now = new Date();
    const dateInput = document.getElementById('report-date');
    const timeInput = document.getElementById('report-time');
    dateInput.value = this.formatDate(now);
    timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const imageInput = document.getElementById('report-image');
    imageInput.addEventListener('change', () => this.previewImage(imageInput));
    form.addEventListener('submit', event => {
      event.preventDefault();
      this.handleSubmit(form).catch(error => {
        console.error('Complaint submission failed.', error);
        App.showToast(error.message || 'The complaint could not be saved. Please try again.', 'error');
      });
    });
  },

  formatDate(date) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  },

  applyMapLocationSelection() {
    let rawSelection;
    try {
      rawSelection = sessionStorage.getItem('civic_report_location_selection');
      sessionStorage.removeItem('civic_report_location_selection');
    } catch (error) {
      console.error('Unable to read the map-selected complaint location.', error);
      return;
    }
    if (!rawSelection) return;

    let selection;
    try {
      selection = JSON.parse(rawSelection);
    } catch (error) {
      console.error('The saved map location selection is invalid.', error);
      return;
    }
    const latitude = Number(selection.latitude);
    const longitude = Number(selection.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
        || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
        || !['gps', 'manual'].includes(selection.method)) return;
    const accuracy = selection.accuracy !== null && selection.accuracy !== ''
      && Number.isFinite(Number(selection.accuracy)) && Number(selection.accuracy) >= 0
      ? Number(selection.accuracy)
      : null;

    document.getElementById('report-latitude').value = String(latitude);
    document.getElementById('report-longitude').value = String(longitude);
    document.getElementById('report-location-method').value = selection.method;
    document.getElementById('report-location-accuracy').value = accuracy === null ? '' : String(accuracy);
    document.getElementById('report-location').value = 'Map-selected location';
    const accuracyNote = accuracy !== null
      ? ` · accuracy ±${Math.round(accuracy)} m`
      : '';
    document.getElementById('report-coordinate-summary').textContent =
      `Map location selected: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${selection.method}${accuracyNote}).`;
  },

  previewImage(input) {
    const preview = document.getElementById('report-image-preview');
    const file = input.files[0];
    if (!file) {
      preview.hidden = true;
      preview.removeAttribute('src');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      input.value = '';
      preview.hidden = true;
      App.showToast('Choose a JPG, PNG, or WebP image up to 5 MB.', 'error');
      return;
    }
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  },

  async handleSubmit(form) {
    if (!form.reportValidity()) return;

    const name = document.getElementById('report-name').value.trim();
    const category = document.getElementById('report-category').value;
    const title = document.getElementById('report-title').value.trim();
    const description = document.getElementById('report-desc').value.trim();
    const zoneId = document.getElementById('report-zone').value;
    const location = document.getElementById('report-location').value.trim();
    const priority = document.getElementById('report-severity').value;
    const date = document.getElementById('report-date').value;
    const time = document.getElementById('report-time').value;
    const image = document.getElementById('report-image').files[0];
    const latitudeInput = document.getElementById('report-latitude').value;
    const longitudeInput = document.getElementById('report-longitude').value;
    const accuracyInput = document.getElementById('report-location-accuracy').value;
    const locationMethod = document.getElementById('report-location-method').value || 'none';
    const shareCoordinates = document.getElementById('report-share-location-consent').checked;
    const zone = DataStore.getZones().find(item => item.id === zoneId);

    if (!zone) throw new Error('Select a valid municipal zone.');
    if (new Date(`${date}T${time}`) > new Date()) throw new Error('Incident date and time cannot be in the future.');

    let imageId = null;
    if (image) {
      imageId = DataStore.createId('IMG');
      await DataStore.storeImage(imageId, image);
    }

    let reportId = DataStore.createComplaintId();
    const createdAt = new Date().toISOString();
    const report = {
      id: reportId,
      name,
      title,
      category,
      description,
      zoneId,
      zoneName: zone.name,
      location,
      latitude: latitudeInput === '' ? null : Number(latitudeInput),
      longitude: longitudeInput === '' ? null : Number(longitudeInput),
      locationAccuracy: accuracyInput === '' ? null : Number(accuracyInput),
      locationMethod: latitudeInput === '' || longitudeInput === '' ? 'none' : locationMethod,
      date,
      time,
      createdAt,
      priority,
      severity: priority,
      status: 'Submitted',
      department: this.departmentFor(category),
      imageId,
      isDemo: false,
      history: [{ status: 'Submitted', at: createdAt, note: 'Complaint received.' }]
    };

    let backendError = null;
    let imageBackendError = null;
    let backendResponse = null;
    try {
      const backendReport = { ...report };
      if (!shareCoordinates) {
        backendReport.latitude = null;
        backendReport.longitude = null;
        backendReport.locationAccuracy = null;
        backendReport.locationMethod = 'none';
      }
      backendResponse = await DataStore.submitToBackend(backendReport);
      if (backendResponse?.complaint?.id) {
        reportId = backendResponse.complaint.id;
        report.id = reportId;
      }
    } catch (error) {
      backendError = error;
    }
    if (backendResponse && image) {
      try {
        await DataStore.uploadImageToBackend(reportId, image);
      } catch (error) {
        imageBackendError = error;
      }
    }
    if (backendResponse) report.source = 'backend';

    try {
      await DataStore.addReport(report);
    } catch (error) {
      if (!DataStore.getReports().some(item => item.id === reportId)) throw error;
      App.showToast('Complaint is saved in this browser, but IndexedDB backup failed. Export a backup before clearing site data.', 'warning');
    }

    form.reset();
    document.getElementById('report-date').value = this.formatDate(new Date());
    document.getElementById('report-time').value = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    document.getElementById('report-image-preview').hidden = true;
    document.getElementById('report-latitude').value = '';
    document.getElementById('report-longitude').value = '';
    document.getElementById('report-location-accuracy').value = '';
    document.getElementById('report-location-method').value = 'none';
    document.getElementById('report-coordinate-summary').textContent = 'No map coordinates selected. Address-only reports are still accepted.';
    this.showConfirmationModal(reportId, report);
    this.renderUserHistory();
    if (backendError) {
      App.showToast(`Backend unavailable; complaint ${reportId} was saved only in this browser. ${backendError.message}`, 'warning');
    } else if (imageBackendError) {
      App.showToast(`Complaint ${reportId} was submitted to the backend, but its photo remains only in this browser. ${imageBackendError.message}`, 'warning');
    } else {
      App.showToast(`Complaint ${reportId} submitted. Save this ID to track updates.`, 'success');
    }
  },

  departmentFor(category) {
    if (category.includes('Water') || category.includes('Drainage') || category.includes('Flood')) return 'Water & Drainage';
    if (category.includes('Road') || category.includes('Traffic')) return 'Roads & Transport';
    if (category.includes('Garbage')) return 'Sanitation';
    if (category.includes('Light')) return 'Electrical Services';
    if (category.includes('Safety')) return 'Public Safety';
    return 'Civic Services';
  },

  showConfirmationModal(reportId, report) {
    const modal = document.getElementById('submission-success-modal');
    document.getElementById('modal-report-id').textContent = reportId;
    document.getElementById('modal-report-zone').textContent = `${report.zoneName} - ${report.location}`;
    document.getElementById('modal-report-cat').textContent = report.category;
    document.getElementById('modal-track-link').href = `tracking.html?id=${encodeURIComponent(reportId)}`;
    modal.classList.add('active');
  },

  renderUserHistory() {
    const container = document.getElementById('citizen-history-list');
    if (!container) return;
    const reports = DataStore.getReports().slice(0, 6);
    container.replaceChildren();

    if (!reports.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No complaints submitted yet.';
      container.appendChild(empty);
      return;
    }

    reports.forEach(report => {
      const card = document.createElement('article');
      card.className = 'card complaint-history-card';
      const header = document.createElement('div');
      header.className = 'complaint-history-header';
      const id = document.createElement('strong');
      id.textContent = report.id;
      const status = document.createElement('span');
      status.className = 'badge badge-risk-medium';
      status.textContent = report.isDemo ? `Demo · ${report.status}` : report.status;
      const title = document.createElement('h4');
      title.textContent = report.title || report.category;
      const details = document.createElement('p');
      details.textContent = `${report.category} · ${report.location}`;
      const date = document.createElement('small');
      date.textContent = `Submitted ${report.date || ''} ${report.time || ''}`;
      header.append(id, status);
      card.append(header, title, details, date);
      container.appendChild(card);
    });
  }
};
