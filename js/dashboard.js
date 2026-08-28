/*
  AI Civic Problem Predictor - Municipal Authority Dashboard Controller
  Smart India Hackathon (SIH) Prototype
*/

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('dashboard-page')) {
    Dashboard.init();
  }
});

const Dashboard = {
  init() {
    this.renderStats();
    this.renderRiskOverview();
    this.renderPriorityActions();
    this.renderRecentReports();

    // Attach live simulation hook
    window.onLiveSimUpdate = () => {
      this.renderStats();
      this.renderPriorityActions();
    };
  },

  renderStats() {
    const reports = DataStore.getReports();
    const predictions = DataStore.getPredictions();

    const totalReports = reports.length;
    const activeProblems = reports.filter(r => r.status === 'Assigned' || r.status === 'In Progress').length;
    const predictedProblems = predictions.length;
    const highRiskZones = predictions.filter(p => p.riskLevel === 'Critical' || p.riskLevel === 'High').length;
    const preventedIncidents = reports.filter(r => r.status === 'Prevented').length + 8; // Including historical prevented

    document.getElementById('stat-total-reports').textContent = totalReports;
    document.getElementById('stat-active-problems').textContent = activeProblems;
    document.getElementById('stat-predicted-problems').textContent = predictedProblems;
    document.getElementById('stat-high-risk-zones').textContent = highRiskZones;
    document.getElementById('stat-prevented-incidents').textContent = preventedIncidents;
  },

  renderRiskOverview() {
    const predictions = DataStore.getPredictions();
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };

    predictions.forEach(p => {
      if (counts[p.riskLevel] !== undefined) counts[p.riskLevel]++;
    });

    document.getElementById('count-critical').textContent = counts.Critical;
    document.getElementById('count-high').textContent = counts.High;
    document.getElementById('count-medium').textContent = counts.Medium;
    document.getElementById('count-low').textContent = counts.Low;
  },

  renderPriorityActions() {
    const tbody = document.getElementById('priority-actions-tbody');
    if (!tbody) return;

    const predictions = DataStore.getPredictions();
    tbody.innerHTML = '';

    predictions.forEach(pred => {
      const tr = document.createElement('tr');
      
      let badgeClass = 'badge-risk-low';
      if (pred.riskLevel === 'Critical') badgeClass = 'badge-risk-critical';
      if (pred.riskLevel === 'High') badgeClass = 'badge-risk-high';
      if (pred.riskLevel === 'Medium') badgeClass = 'badge-risk-medium';

      tr.innerHTML = `
        <td><strong>${pred.zoneName}</strong></td>
        <td>${pred.category}</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span><strong>${pred.riskScore}%</strong></span>
            <div style="flex:1; height:6px; background:var(--bg-tertiary); border-radius:10px; width:60px; overflow:hidden;">
              <div style="height:100%; width:${pred.riskScore}%; background:${pred.riskScore > 75 ? '#ef4444' : (pred.riskScore > 50 ? '#f97316' : '#f59e0b')}"></div>
            </div>
          </div>
        </td>
        <td><span class="badge ${badgeClass}">${pred.riskLevel}</span></td>
        <td style="max-width:250px; font-size:0.825rem; color:var(--text-secondary);">${pred.recommendedAction}</td>
        <td>
          <select class="status-select" onchange="Dashboard.handleStatusChange('${pred.id}', this.value)">
            <option value="Predicted" ${pred.status === 'Predicted' ? 'selected' : ''}>Predicted</option>
            <option value="Assigned" ${pred.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
            <option value="In Progress" ${pred.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${pred.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            <option value="Prevented" ${pred.status === 'Prevented' ? 'selected' : ''}>Prevented (Success)</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderRecentReports() {
    const tbody = document.getElementById('recent-reports-tbody');
    if (!tbody) return;

    const reports = DataStore.getReports().slice(0, 5);
    tbody.innerHTML = '';

    reports.forEach(rep => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${rep.id}</code></td>
        <td>${rep.category}</td>
        <td>${rep.location}</td>
        <td><span class="badge ${rep.severity === 'Critical' ? 'badge-risk-critical' : (rep.severity === 'High' ? 'badge-risk-high' : 'badge-risk-medium')}">${rep.severity}</span></td>
        <td>${rep.date}</td>
        <td><span class="badge ${rep.status === 'Resolved' ? 'badge-risk-low' : 'badge-risk-medium'}">${rep.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  },

  handleStatusChange(predId, newStatus) {
    const predictions = DataStore.getPredictions();
    const target = predictions.find(p => p.id === predId);
    if (target) {
      target.status = newStatus;
      DataStore.updatePrediction(target);
      App.showToast(`Updated ${predId} status to: ${newStatus}`, 'success');
      this.renderStats();
      this.renderRiskOverview();
    }
  }
};
