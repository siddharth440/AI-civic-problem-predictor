/*
  AI Civic Problem Predictor - Global App Shell & Shell Utilities
  Smart India Hackathon (SIH) Prototype
*/

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  liveSimTimer: null,
  isLiveSimActive: false,

  init() {
    this.initTheme();
    this.initSidebar();
    this.initLiveSimulation();
    this.initGlobalEvents();
    this.renderHomeStats();
    this.initDataTools();
  },

  // Theme Management
  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEYS.THEME, next);
        this.updateThemeIcon(next);
        this.showToast(`Switched to ${next} theme`, 'info');
      });
    }
  },

  updateThemeIcon(theme) {
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
      themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
  },

  // Sidebar & Mobile Nav
  initSidebar() {
    const mobileToggle = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');

    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // Set Active Nav Link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  // Live Simulation Engine
  initLiveSimulation() {
    const simBadge = document.getElementById('live-sim-badge');
    const savedSimState = localStorage.getItem(STORAGE_KEYS.LIVE_SIM) === 'true';

    if (savedSimState) {
      this.startLiveSimulation();
    } else {
      this.updateSimulationBadge(false);
    }

    if (simBadge) {
      simBadge.addEventListener('click', () => {
        if (this.isLiveSimActive) {
          this.stopLiveSimulation();
        } else {
          this.startLiveSimulation();
        }
      });
    }
  },

  startLiveSimulation() {
    if (this.liveSimTimer) clearInterval(this.liveSimTimer);
    this.isLiveSimActive = true;
    localStorage.setItem(STORAGE_KEYS.LIVE_SIM, 'true');
    this.updateSimulationBadge(true);
    this.showToast('Demo simulation active. Generated alerts are simulated, not live incidents.', 'info');

    // Run simulation loop every 6 seconds
    this.liveSimTimer = setInterval(() => {
      this.triggerLiveSimEvent();
    }, 6000);
  },

  stopLiveSimulation() {
    this.isLiveSimActive = false;
    localStorage.setItem(STORAGE_KEYS.LIVE_SIM, 'false');
    if (this.liveSimTimer) clearInterval(this.liveSimTimer);

    this.updateSimulationBadge(false);

    this.showToast('Live Simulation Paused', 'warning');
  },

  triggerLiveSimEvent() {
    const events = [
      () => {
        const randZone = Math.floor(Math.random() * 6) + 1;
        DataStore.addAlert({
          id: DataStore.createId('ALT'),
          zone: `Zone ${randZone}`,
          level: 'High',
          title: `Sensor Spike: Zone ${randZone} Drainage Level`,
          message: `Rainfall runoff surge detected. Civic risk score updated for Zone ${randZone}.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isDemo: true
        });
        this.showToast(`Simulated alert: rainfall surge in Zone ${randZone}`, 'warning');
      },
      () => {
        const predictions = PredictionEngine.recalculateAllZonePredictions();
        predictions.forEach(prediction => DataStore.updatePrediction(prediction));
        this.showToast('Demo risk scores recalculated from available complaint data.', 'info');
      },
      () => {
        this.showToast('Simulated telemetry pulse received. No real sensor data is connected.', 'success');
      }
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();

    // Trigger page re-render if controller has live refresh method
    if (window.onLiveSimUpdate) {
      window.onLiveSimUpdate();
    }
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
      <i class="fas ${iconClass}"></i>
      <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  initGlobalEvents() {
    // Global esc key for modal closing
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) activeModal.classList.remove('active');
        document.querySelector('.sidebar.open')?.classList.remove('open');
      }
    });
    window.addEventListener('civic-data-changed', () => {
      this.renderHomeStats();
      this.updateSimulationBadge(this.isLiveSimActive);
    });
    window.addEventListener('storage', () => this.renderHomeStats());
  },

  updateSimulationBadge(active) {
    const badge = document.getElementById('live-sim-badge');
    if (!badge) return;
    badge.classList.toggle('active', active);
    const text = badge.querySelector('.sim-text');
    const reports = DataStore.getReports();
    const demoCount = reports.filter(report => report.isDemo).length;
    const userCount = reports.length - demoCount;
    if (text) text.textContent = active
      ? '● DEMO SIMULATION ON'
      : `${demoCount ? `DEMO ${demoCount}` : 'NO DEMO DATA'} · USER ${userCount}`;
    badge.setAttribute('aria-label', active
      ? 'Demo simulation active; generated data is simulated'
      : `${demoCount} sample demo records and ${userCount} user records stored in this browser`);
  },

  renderHomeStats() {
    if (!document.body || document.body.id !== 'home-page') return;
    const reports = DataStore.getReports();
    const predictions = DataStore.getPredictions();
    const durations = reports
      .filter(report => report.status === 'Resolved' && report.createdAt && report.resolvedAt)
      .map(report => (new Date(report.resolvedAt) - new Date(report.createdAt)) / 3600000)
      .filter(hours => Number.isFinite(hours) && hours >= 0);
    const average = durations.length
      ? `${(durations.reduce((sum, hours) => sum + hours, 0) / durations.length).toFixed(1)} hrs`
      : '—';
    const values = {
      'home-total-reports': reports.length,
      'home-high-risk-zones': predictions.filter(item => ['High', 'Critical'].includes(item.riskLevel)).length,
      'home-prevented': reports.filter(item => item.status === 'Prevented').length,
      'home-response-time': average
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  },

  initDataTools() {
    const exportButton = document.getElementById('export-backup-btn');
    if (exportButton) exportButton.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(DataStore.exportData(), null, 2)], { type: 'application/json' });
      this.downloadBlob(blob, `civic-predict-backup-${new Date().toISOString().slice(0, 10)}.json`);
    });
    const importInput = document.getElementById('import-backup-file');
    if (importInput) importInput.addEventListener('change', async () => {
      const file = importInput.files[0];
      if (!file) return;
      try {
        DataStore.importData(JSON.parse(await file.text()));
        this.showToast('Backup restored in this browser.', 'success');
      } catch (error) {
        this.showToast(`Backup restore failed: ${error.message}`, 'error');
      } finally {
        importInput.value = '';
      }
    });
    const resetButton = document.getElementById('reset-demo-btn');
    if (resetButton) resetButton.addEventListener('click', () => {
      if (!window.confirm('Replace local records with the sample demo dataset? This cannot be undone.')) return;
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(DEFAULT_ALERTS));
      localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(DEFAULT_ZONES));
      const predictions = PredictionEngine.recalculateAllZonePredictions();
      localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions));
      DataStore.persistReports(DEFAULT_REPORTS).catch(error => {
        this.showToast(`Demo data was reset in local storage, but IndexedDB sync failed: ${error.message}`, 'error');
      });
      DataStore.notifyChange('all');
      this.showToast('Sample demo data restored.', 'success');
    });
  },

  downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
};
