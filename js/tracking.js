document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tracking-page')) ComplaintTracking.init();
});

const ComplaintTracking = {
  init() {
    const form = document.getElementById('tracking-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      this.find(document.getElementById('tracking-id').value);
    });
    const requestedId = new URLSearchParams(window.location.search).get('id');
    if (requestedId) {
      document.getElementById('tracking-id').value = requestedId;
      this.find(requestedId);
    }
    window.addEventListener('civic-data-changed', () => {
      const currentId = document.getElementById('tracking-id').value.trim();
      if (currentId) this.find(currentId);
    });
  },

  async find(rawId) {
    const id = rawId.trim().toUpperCase();
    const result = document.getElementById('tracking-result');
    result.replaceChildren();
    let report = null;
    let backendError = null;
    try {
      const response = await DataStore.fetchBackendComplaint(id);
      report = response?.complaint || null;
    } catch (error) {
      backendError = error;
      console.error('Remote complaint lookup failed.', error);
    }
    if (!report) report = DataStore.getReports().find(item => String(item.id).toUpperCase() === id);
    if (!report) {
      const error = document.createElement('div');
      error.className = 'card tracking-error';
      error.setAttribute('role', 'alert');
      error.textContent = backendError
        ? `Backend lookup failed (${backendError.message}) and no complaint with ID ${id || '(empty)'} exists in this browser.`
        : `No complaint with ID ${id || '(empty)'} was found. Check the ID or use the browser where the complaint was submitted.`;
      result.appendChild(error);
      return;
    }

    const card = document.createElement('article');
    card.className = 'card tracking-card';
    if (report.source === 'backend') {
      const source = document.createElement('p');
      source.className = 'tracking-source';
      source.textContent = 'Retrieved from the configured civic service backend.';
      card.appendChild(source);
    } else if (backendError) {
      const warning = document.createElement('p');
      warning.className = 'tracking-source';
      warning.textContent = `Backend unavailable; showing this browser's saved copy. ${backendError.message}`;
      card.appendChild(warning);
    }
    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = `${report.title || report.category} · ${report.id}`;
    const badge = document.createElement('span');
    badge.className = 'badge badge-risk-medium';
    badge.textContent = report.status;
    header.append(title, badge);
    card.appendChild(header);

    const details = document.createElement('dl');
    details.className = 'tracking-details';
    [
      ['Category', report.category],
      ['Submitted', `${report.date || '—'} ${report.time || ''}`],
      ['Zone', report.zoneName || report.zoneId],
      ['Location', report.location],
      ['Priority', report.priority || report.severity],
      ['Assigned department', report.department || 'Not yet assigned'],
      ['Resolution', report.resolution || (report.status === 'Resolved' ? 'Resolved; no additional note recorded.' : 'No resolution recorded.')]
    ].forEach(([label, value]) => {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value || '—';
      wrapper.append(term, description);
      details.appendChild(wrapper);
    });
    card.appendChild(details);

    const timelineHeading = document.createElement('h4');
    timelineHeading.className = 'tracking-timeline-heading';
    timelineHeading.textContent = 'Status timeline';
    card.appendChild(timelineHeading);
    const timeline = document.createElement('ol');
    timeline.className = 'tracking-timeline';
    const entries = report.history?.length
      ? report.history
      : [{ status: report.status, at: report.updatedAt || report.createdAt || report.date, note: 'Current recorded status.' }];
    entries.forEach(entry => {
      const item = document.createElement('li');
      const eventTitle = document.createElement('strong');
      eventTitle.textContent = entry.status;
      const note = document.createElement('span');
      note.textContent = entry.note || '';
      const date = document.createElement('time');
      const timestamp = new Date(entry.at);
      date.textContent = Number.isNaN(timestamp.getTime()) ? String(entry.at || '') : timestamp.toLocaleString();
      item.append(eventTitle, note, date);
      timeline.appendChild(item);
    });
    card.appendChild(timeline);

    if (report.imageId) {
      const image = await DataStore.getImage(report.imageId);
      if (image) {
        const preview = document.createElement('img');
        preview.className = 'complaint-evidence';
        preview.alt = 'Photo attached to this complaint';
        preview.src = URL.createObjectURL(image);
        card.appendChild(preview);
      }
    }
    result.appendChild(card);
  }
};
