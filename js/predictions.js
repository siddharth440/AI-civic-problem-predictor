document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('predictions-page')) PredictionsDashboard.init();
});

const PredictionsDashboard = {
  currentCategoryFilter: 'All',
  currentSortOption: 'risk-desc',

  init() {
    this.initFilters();
    this.initSort();
    document.getElementById('predictions-cards-grid')?.addEventListener('click', event => {
      const button = event.target.closest('[data-explanation-id]');
      if (button) this.showExplanationModal(button.dataset.explanationId);
    });
    window.addEventListener('civic-data-changed', () => this.renderPredictions());
    window.onLiveSimUpdate = () => this.renderPredictions();
    this.renderPredictions();
  },

  initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(button => button.addEventListener('click', () => {
      buttons.forEach(item => {
        item.classList.remove('active', 'btn-primary');
        item.classList.add('btn-secondary');
      });
      button.classList.add('active', 'btn-primary');
      button.classList.remove('btn-secondary');
      this.currentCategoryFilter = button.dataset.category;
      this.renderPredictions();
    }));
  },

  initSort() {
    document.getElementById('prediction-sort')?.addEventListener('change', event => {
      this.currentSortOption = event.target.value;
      this.renderPredictions();
    });
  },

  getProcessedPredictions() {
    let predictions = DataStore.getPredictions();
    const aliases = {
      Garbage: /garbage|waste/i,
      Pothole: /pothole|road damage/i,
      Water: /water/i,
      Drainage: /drainage/i,
      Flooding: /flood/i,
      Streetlight: /street.?light/i
    };
    if (this.currentCategoryFilter !== 'All') {
      const matcher = aliases[this.currentCategoryFilter] || new RegExp(this.currentCategoryFilter, 'i');
      predictions = predictions.filter(prediction => matcher.test(prediction.category));
    }
    return predictions.sort((a, b) => {
      if (this.currentSortOption === 'risk-asc') return a.riskScore - b.riskScore;
      if (this.currentSortOption === 'confidence-desc') return b.complaintCount - a.complaintCount;
      return b.riskScore - a.riskScore;
    });
  },

  renderPredictions() {
    const container = document.getElementById('predictions-cards-grid');
    if (!container) return;
    container.replaceChildren();
    const predictions = this.getProcessedPredictions();
    if (!predictions.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No risk scores match the selected category.';
      container.appendChild(empty);
      return;
    }
    predictions.forEach(prediction => {
      const level = prediction.riskLevel.toLowerCase();
      const card = document.createElement('article');
      card.className = `prediction-card ${level}`;
      const header = document.createElement('div');
      header.className = 'prediction-card-header';
      const identity = document.createElement('div');
      const category = document.createElement('h3');
      category.className = 'prediction-title';
      category.textContent = prediction.category;
      const zone = document.createElement('div');
      zone.className = 'prediction-zone';
      zone.textContent = prediction.zoneName;
      identity.append(category, zone);
      const badge = document.createElement('span');
      badge.className = `badge badge-risk-${level}`;
      badge.textContent = prediction.riskLevel;
      header.append(identity, badge);
      card.appendChild(header);

      const meter = document.createElement('div');
      meter.className = 'risk-meter';
      const meterLabel = document.createElement('div');
      meterLabel.className = 'risk-meter-header';
      meterLabel.textContent = `Risk score ${prediction.riskScore}/100`;
      const bar = document.createElement('div');
      bar.className = 'progress-bar-bg';
      const fill = document.createElement('div');
      fill.className = `progress-bar-fill ${level}`;
      fill.style.width = `${prediction.riskScore}%`;
      bar.appendChild(fill);
      meter.append(meterLabel, bar);
      card.appendChild(meter);

      const count = document.createElement('p');
      count.className = 'prediction-data-note';
      count.textContent = `${prediction.complaintCount} stored complaint(s) · ${prediction.unresolvedCount} unresolved`;
      card.appendChild(count);
      const action = document.createElement('p');
      action.className = 'prediction-action';
      action.textContent = `Recommended review: ${prediction.recommendedAction}`;
      card.appendChild(action);
      const details = document.createElement('p');
      details.className = 'prediction-data-note';
      details.textContent = `Status: ${prediction.status} · ${prediction.timeframe}`;
      card.appendChild(details);

      const explain = document.createElement('button');
      explain.type = 'button';
      explain.className = 'btn btn-outline btn-sm';
      explain.dataset.explanationId = prediction.id;
      explain.textContent = 'Why this score?';
      card.appendChild(explain);
      container.appendChild(card);
    });
  },

  showExplanationModal(id) {
    const prediction = DataStore.getPredictions().find(item => item.id === id);
    if (!prediction) return;
    document.getElementById('explain-title').textContent = prediction.category;
    document.getElementById('explain-zone').textContent = prediction.zoneName;
    document.getElementById('explain-score').textContent = `${prediction.riskScore}/100`;
    document.getElementById('explain-confidence').textContent = 'Weighted rules';
    const factors = prediction.factorBreakdown || [];
    const list = document.getElementById('explain-factor-list');
    list.replaceChildren();
    factors.forEach(factor => {
      const item = document.createElement('div');
      item.className = 'factor-item';
      const label = document.createElement('div');
      label.className = 'factor-label-row';
      const name = document.createElement('span');
      name.textContent = factor.name;
      const points = document.createElement('strong');
      points.textContent = `${factor.points}/${factor.max} pts`;
      label.append(name, points);
      const bar = document.createElement('div');
      bar.className = 'progress-bar-bg';
      bar.style.height = '7px';
      const fill = document.createElement('div');
      fill.className = `progress-bar-fill ${prediction.riskLevel.toLowerCase()}`;
      fill.style.width = `${factor.max ? factor.points / factor.max * 100 : 0}%`;
      bar.appendChild(fill);
      item.append(label, bar);
      list.appendChild(item);
    });
    const reasons = document.createElement('p');
    reasons.className = 'prediction-data-note';
    reasons.textContent = `Main contributing factors: ${(prediction.reasons || []).join('; ') || 'No complaint signals recorded.'}`;
    list.appendChild(reasons);
    document.getElementById('explanation-modal').classList.add('active');
  }
};
