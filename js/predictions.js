/*
  AI Civic Problem Predictor - AI Prediction Engine Dashboard Controller
  Smart India Hackathon (SIH) Prototype
*/

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('predictions-page')) {
    PredictionsDashboard.init();
  }
});

const PredictionsDashboard = {
  currentCategoryFilter: 'All',
  currentSortOption: 'risk-desc',

  init() {
    this.renderPredictions();
    this.initFilters();
    this.initSort();

    window.onLiveSimUpdate = () => {
      this.renderPredictions();
    };
  },

  initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active', 'btn-primary'));
        filterButtons.forEach(b => b.classList.add('btn-secondary'));
        
        btn.classList.remove('btn-secondary');
        btn.classList.add('active', 'btn-primary');

        this.currentCategoryFilter = btn.getAttribute('data-category');
        this.renderPredictions();
      });
    });
  },

  initSort() {
    const sortSelect = document.getElementById('prediction-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSortOption = e.target.value;
        this.renderPredictions();
      });
    }
  },

  getProcessedPredictions() {
    let predictions = DataStore.getPredictions();

    // Apply Category Filter
    if (this.currentCategoryFilter !== 'All') {
      predictions = predictions.filter(p => p.category.toLowerCase().includes(this.currentCategoryFilter.toLowerCase()));
    }

    // Apply Sorting
    predictions.sort((a, b) => {
      if (this.currentSortOption === 'risk-desc') return b.riskScore - a.riskScore;
      if (this.currentSortOption === 'risk-asc') return a.riskScore - b.riskScore;
      if (this.currentSortOption === 'confidence-desc') return b.confidence - a.confidence;
      if (this.currentSortOption === 'newest') return b.id.localeCompare(a.id);
      return 0;
    });

    return predictions;
  },

  renderPredictions() {
    const container = document.getElementById('predictions-cards-grid');
    if (!container) return;

    const predictions = this.getProcessedPredictions();
    container.innerHTML = '';

    if (predictions.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
          <i class="fas fa-search" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.5;"></i>
          <p>No AI predictions matching the selected filter criteria.</p>
        </div>
      `;
      return;
    }

    predictions.forEach(pred => {
      let riskClass = 'low';
      let badgeClass = 'badge-risk-low';
      if (pred.riskLevel === 'Critical') { riskClass = 'critical'; badgeClass = 'badge-risk-critical'; }
      else if (pred.riskLevel === 'High') { riskClass = 'high'; badgeClass = 'badge-risk-high'; }
      else if (pred.riskLevel === 'Medium') { riskClass = 'medium'; badgeClass = 'badge-risk-medium'; }

      const card = document.createElement('div');
      card.className = `prediction-card ${riskClass}`;

      card.innerHTML = `
        <div>
          <div class="prediction-card-header">
            <div>
              <div class="prediction-title">${pred.category}</div>
              <div class="prediction-zone"><i class="fas fa-map-marker-alt"></i> ${pred.zoneName}</div>
            </div>
            <span class="badge ${badgeClass}">${pred.riskLevel}</span>
          </div>

          <div class="risk-meter">
            <div class="risk-meter-header">
              <span>Civic Risk Index</span>
              <span style="font-weight:800; color:${riskClass === 'critical' ? '#ef4444' : '#2563eb'};">${pred.riskScore}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${riskClass}" style="width: ${pred.riskScore}%;"></div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem; padding:0.5rem 0; border-y:1px solid var(--border-color);">
            <span><i class="fas fa-bullseye" style="color:var(--accent-primary);"></i> Confidence: <strong>${pred.confidence}%</strong></span>
            <span><i class="fas fa-clock" style="color:var(--risk-medium);"></i> ${pred.timeframe}</span>
          </div>

          <div style="background:var(--bg-tertiary); padding:0.75rem; border-radius:var(--radius-sm); font-size:0.825rem; margin-bottom:1.25rem;">
            <strong style="color:var(--text-primary); display:block; margin-bottom:0.25rem;"><i class="fas fa-shield-alt" style="color:var(--risk-low);"></i> Recommended Preventive Action:</strong>
            <span style="color:var(--text-secondary);">${pred.recommendedAction}</span>
          </div>
        </div>

        <button class="btn btn-outline btn-sm" style="width:100%;" onclick="PredictionsDashboard.showExplanationModal('${pred.id}')">
          <i class="fas fa-calculator"></i> Why this prediction? (Explainable AI)
        </button>
      `;

      container.appendChild(card);
    });
  },

  showExplanationModal(predId) {
    const predictions = DataStore.getPredictions();
    const target = predictions.find(p => p.id === predId);
    if (!target) return;

    const modal = document.getElementById('explanation-modal');
    if (!modal) return;

    document.getElementById('explain-title').textContent = target.category;
    document.getElementById('explain-zone').textContent = target.zoneName;
    document.getElementById('explain-score').textContent = `${target.riskScore}%`;
    document.getElementById('explain-confidence').textContent = `${target.confidence}%`;

    const ind = target.indicators || {};
    const factors = [
      { name: 'Historical Complaint Volume', pts: ind.historicalComplaints || 25, max: 30 },
      { name: 'Recent Complaint Surge Rate', pts: ind.recentSurge || 18, max: 20 },
      { name: 'Rainfall & Weather Impact Index', pts: ind.weatherFactor || 14, max: 15 },
      { name: 'Previous Incident Recurrence Record', pts: ind.incidentHistory || 12, max: 15 },
      { name: 'Population Density & Footfall Spike', pts: ind.populationActivity || 8, max: 10 },
      { name: 'Maintenance & Service Delay Index', pts: ind.serviceFrequency || 6, max: 10 }
    ];

    const factorListContainer = document.getElementById('explain-factor-list');
    factorListContainer.innerHTML = '';

    factors.forEach(f => {
      const pct = Math.round((f.pts / f.max) * 100);
      const item = document.createElement('div');
      item.className = 'factor-item';
      item.innerHTML = `
        <div class="factor-label-row">
          <span>${f.name}</span>
          <strong style="color:var(--text-primary);">+${f.pts} / ${f.max} pts</strong>
        </div>
        <div class="progress-bar-bg" style="height:7px;">
          <div class="progress-bar-fill high" style="width:${pct}%;"></div>
        </div>
      `;
      factorListContainer.appendChild(item);
    });

    modal.classList.add('active');
  }
};
