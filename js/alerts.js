/*
  AI Civic Problem Predictor - Alerts & Notification Center Controller
  Smart India Hackathon (SIH) Prototype
*/

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('alerts-page')) {
    AlertsCenter.init();
  }
});

const AlertsCenter = {
  currentFilter: 'All',

  init() {
    this.renderAlerts();
    this.initFilters();
    this.initActions();

    window.onLiveSimUpdate = () => {
      this.renderAlerts();
    };
  },

  initFilters() {
    const filterBtns = document.querySelectorAll('.alert-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active', 'btn-primary'));
        filterBtns.forEach(b => b.classList.add('btn-secondary'));

        btn.classList.remove('btn-secondary');
        btn.classList.add('active', 'btn-primary');

        this.currentFilter = btn.getAttribute('data-filter');
        this.renderAlerts();
      });
    });
  },

  initActions() {
    const clearBtn = document.getElementById('clear-all-alerts-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        DataStore.clearAlerts();
        App.showToast('All notification alerts cleared', 'info');
        this.renderAlerts();
      });
    }
  },

  getProcessedAlerts() {
    let alerts = DataStore.getAlerts();

    if (this.currentFilter === 'Unread') {
      alerts = alerts.filter(a => !a.isRead);
    } else if (this.currentFilter === 'Critical') {
      alerts = alerts.filter(a => a.level === 'Critical');
    } else if (this.currentFilter === 'High') {
      alerts = alerts.filter(a => a.level === 'High');
    }

    return alerts;
  },

  renderAlerts() {
    const container = document.getElementById('alerts-list-container');
    if (!container) return;

    const alerts = this.getProcessedAlerts();
    container.innerHTML = '';

    if (alerts.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:3rem; color:var(--text-muted);">
          <i class="fas fa-bell-slash" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.5;"></i>
          <p>No notification alerts matching the selected filter criteria.</p>
        </div>
      `;
      return;
    }

    alerts.forEach(alert => {
      const card = document.createElement('div');
      card.className = `card ${alert.isRead ? '' : 'unread'}`;
      card.style.padding = '1.25rem 1.5rem';
      card.style.marginBottom = '1rem';
      card.style.borderLeft = `5px solid ${alert.level === 'Critical' ? '#ef4444' : (alert.level === 'High' ? '#f97316' : '#10b981')}`;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.35rem;">
              <span class="badge ${alert.level === 'Critical' ? 'badge-risk-critical' : (alert.level === 'High' ? 'badge-risk-high' : 'badge-risk-low')}">${alert.level}</span>
              <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-map-marker-alt"></i> ${alert.zone}</span>
              <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-clock"></i> ${alert.timestamp}</span>
            </div>
            <h4 style="font-size:1.05rem; font-weight:700; color:var(--text-primary); margin-bottom:0.3rem;">${alert.title}</h4>
            <p style="font-size:0.875rem; color:var(--text-secondary);">${alert.message}</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            ${!alert.isRead ? `<button class="btn btn-secondary btn-sm" onclick="AlertsCenter.markRead('${alert.id}')"><i class="fas fa-check"></i> Mark Read</button>` : '<span style="font-size:0.75rem; color:var(--text-muted); padding:0.4rem;"><i class="fas fa-check-double"></i> Read</span>'}
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  },

  markRead(id) {
    DataStore.markAlertRead(id);
    App.showToast('Alert marked as read', 'success');
    this.renderAlerts();
  }
};
