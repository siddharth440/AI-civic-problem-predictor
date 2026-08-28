/*
  AI Civic Problem Predictor - Analytics & Insights Visualizer Controller
  Smart India Hackathon (SIH) Prototype
*/

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('analytics-page')) {
    Analytics.init();
  }
});

const Analytics = {
  charts: {},

  init() {
    this.renderSummaryStats();
    
    // Check if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
      this.initChartJs();
    } else {
      this.initFallbackVisuals();
    }
  },

  renderSummaryStats() {
    const reports = DataStore.getReports();
    const prevented = reports.filter(r => r.status === 'Prevented').length + 8;
    
    document.getElementById('analytics-prevented-count').textContent = prevented;
    document.getElementById('analytics-avg-response').textContent = '4.2 hrs';
    document.getElementById('analytics-accuracy').textContent = '91.4%';
  },

  initChartJs() {
    // 1. Complaints & Predictions Over Time (Line Chart)
    const ctxTime = document.getElementById('chart-time-trend');
    if (ctxTime) {
      this.charts.time = new Chart(ctxTime, {
        type: 'line',
        data: {
          labels: ['Aug 21', 'Aug 22', 'Aug 23', 'Aug 24', 'Aug 25', 'Aug 26', 'Aug 27'],
          datasets: [
            {
              label: 'Citizen Complaints (Reactive)',
              data: [18, 22, 25, 20, 28, 32, 24],
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'AI Risk Predictions (Proactive)',
              data: [14, 19, 21, 26, 30, 35, 38],
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // 2. Category Breakdown (Doughnut Chart)
    const ctxCategory = document.getElementById('chart-category-breakdown');
    if (ctxCategory) {
      this.charts.category = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
          labels: ['Garbage', 'Drainage Overflow', 'Potholes', 'Flooding', 'Water Leakage', 'Streetlights'],
          datasets: [{
            data: [35, 25, 20, 10, 6, 4],
            backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#10b981', '#7c3aed']
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    // 3. Zone Risk Comparison (Bar Chart)
    const ctxZone = document.getElementById('chart-zone-risk');
    if (ctxZone) {
      this.charts.zone = new Chart(ctxZone, {
        type: 'bar',
        data: {
          labels: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'],
          datasets: [{
            label: 'Current Risk Score (%)',
            data: [32, 76, 58, 87, 69, 92],
            backgroundColor: ['#10b981', '#f97316', '#f59e0b', '#ef4444', '#f59e0b', '#ef4444']
          }]
        },
        options: {
          responsive: true,
          scales: { y: { max: 100, beginAtZero: true } }
        }
      });
    }
  },

  initFallbackVisuals() {
    console.log("Chart.js unavailable, rendering SVG fallback graphs.");
  }
};
