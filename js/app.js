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
        sidebar.classList.toggle('open');
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
    this.isLiveSimActive = true;
    localStorage.setItem(STORAGE_KEYS.LIVE_SIM, 'true');

    const simBadge = document.getElementById('live-sim-badge');
    if (simBadge) {
      simBadge.classList.add('active');
      simBadge.querySelector('.sim-text').textContent = '● LIVE SIMULATION';
    }

    this.showToast('Live Municipal Data Simulation Active', 'success');

    // Run simulation loop every 6 seconds
    this.liveSimTimer = setInterval(() => {
      this.triggerLiveSimEvent();
    }, 6000);
  },

  stopLiveSimulation() {
    this.isLiveSimActive = false;
    localStorage.setItem(STORAGE_KEYS.LIVE_SIM, 'false');
    if (this.liveSimTimer) clearInterval(this.liveSimTimer);

    const simBadge = document.getElementById('live-sim-badge');
    if (simBadge) {
      simBadge.classList.remove('active');
      simBadge.querySelector('.sim-text').textContent = '○ SIMULATION PAUSED';
    }

    this.showToast('Live Simulation Paused', 'warning');
  },

  triggerLiveSimEvent() {
    const events = [
      () => {
        const randZone = Math.floor(Math.random() * 6) + 1;
        DataStore.addAlert({
          id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
          zone: `Zone ${randZone}`,
          level: 'High',
          title: `Sensor Spike: Zone ${randZone} Drainage Level`,
          message: `Rainfall runoff surge detected. Civic risk score updated for Zone ${randZone}.`,
          timestamp: 'Just now',
          isRead: false
        });
        this.showToast(`Live Alert: Rainfall surge detected in Zone ${randZone}`, 'warning');
      },
      () => {
        this.showToast(`AI Engine recalculated risk matrix across 6 municipal zones`, 'info');
      },
      () => {
        const randId = 'REP-' + Math.floor(8500 + Math.random() * 500);
        this.showToast(`Simulated telemetry: Sensor update received for ${randId}`, 'success');
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
      }
    });
  }
};
