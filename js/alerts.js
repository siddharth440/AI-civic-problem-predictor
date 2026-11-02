document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('alerts-page')) AlertsCenter.init();
});

const AlertsCenter = {
  currentFilter: 'All',

  init() {
    this.initFilters();
    this.initActions();
    document.getElementById('alerts-list-container')?.addEventListener('click', event => {
      const button = event.target.closest('[data-mark-alert-read]');
      if (button) this.markRead(button.dataset.markAlertRead);
    });
    window.addEventListener('civic-data-changed', () => this.renderAlerts());
    window.onLiveSimUpdate = () => this.renderAlerts();
    this.renderAlerts();
  },

  initFilters() {
    document.querySelectorAll('.alert-filter-btn').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('.alert-filter-btn').forEach(item => {
        item.classList.remove('active', 'btn-primary');
        item.classList.add('btn-secondary');
      });
      button.classList.add('active', 'btn-primary');
      button.classList.remove('btn-secondary');
      this.currentFilter = button.dataset.filter;
      this.renderAlerts();
    }));
  },

  initActions() {
    document.getElementById('clear-all-alerts-btn')?.addEventListener('click', () => {
      if (!DataStore.getAlerts().length) return;
      if (!window.confirm('Clear all notifications from this browser?')) return;
      DataStore.clearAlerts();
      App.showToast('Notification history cleared.', 'info');
      this.renderAlerts();
    });
  },

  getProcessedAlerts() {
    let alerts = DataStore.getAlerts();
    if (this.currentFilter === 'Unread') alerts = alerts.filter(alert => !alert.isRead);
    if (this.currentFilter === 'Critical') alerts = alerts.filter(alert => alert.level === 'Critical');
    if (this.currentFilter === 'High') alerts = alerts.filter(alert => alert.level === 'High');
    return alerts;
  },

  renderAlerts() {
    const container = document.getElementById('alerts-list-container');
    if (!container) return;
    container.replaceChildren();
    const alerts = this.getProcessedAlerts();
    if (!alerts.length) {
      const empty = document.createElement('p');
      empty.className = 'card empty-state';
      empty.textContent = 'No notification alerts match the selected filter.';
      container.appendChild(empty);
      return;
    }

    alerts.forEach(alert => {
      const card = document.createElement('article');
      card.className = `card ${alert.isRead ? '' : 'unread'}`;
      card.style.borderLeft = `5px solid ${this.colorFor(alert.level)}`;
      const metadata = document.createElement('div');
      metadata.className = 'alert-metadata';
      const level = document.createElement('span');
      level.className = `badge badge-risk-${this.badgeLevel(alert.level)}`;
      level.textContent = alert.level;
      const zone = document.createElement('span');
      zone.textContent = alert.zone || 'City';
      const timestamp = document.createElement('time');
      const parsed = new Date(alert.timestamp);
      timestamp.textContent = Number.isNaN(parsed.getTime()) ? alert.timestamp : parsed.toLocaleString();
      metadata.append(level, zone, timestamp);
      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = alert.title;
      const message = document.createElement('p');
      message.textContent = alert.message;
      card.append(metadata, title, message);
      if (alert.complaintId) {
        const tracking = document.createElement('a');
        tracking.href = `tracking.html?id=${encodeURIComponent(alert.complaintId)}`;
        tracking.className = 'btn btn-outline btn-sm';
        tracking.textContent = `Track ${alert.complaintId}`;
        card.appendChild(tracking);
      }
      if (!alert.isRead) {
        const mark = document.createElement('button');
        mark.type = 'button';
        mark.className = 'btn btn-secondary btn-sm';
        mark.dataset.markAlertRead = alert.id;
        mark.textContent = 'Mark as read';
        card.appendChild(mark);
      }
      container.appendChild(card);
    });
  },

  badgeLevel(level) {
    if (level === 'Critical' || level === 'High' || level === 'Medium') return level.toLowerCase();
    return 'low';
  },

  colorFor(level) {
    return ({ Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Success: '#10b981' })[level] || '#2563eb';
  },

  markRead(id) {
    DataStore.markAlertRead(id);
    App.showToast('Alert marked as read.', 'success');
    this.renderAlerts();
  }
};
