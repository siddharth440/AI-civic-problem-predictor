/*
  AI Civic Problem Predictor - Explainable Risk Calculation Engine
  Smart India Hackathon (SIH) Prototype
  
  Note: This JavaScript-based engine simulates an AI prediction model using
  weighted multi-factor historical & environmental indicators.
  Formula:
    Risk Score = (Historical Complaints * 0.30) + 
                 (Recent Complaint Surge * 0.20) + 
                 (Weather/Rainfall Index * 0.15) + 
                 (Previous Incidents * 0.15) + 
                 (Population Activity * 0.10) + 
                 (Service Delay Factor * 0.10)
*/

const PredictionEngine = {
  ENGINE_NAME: "AI Prediction Engine Prototype v2.4",
  METHODOLOGY: "Multi-indicator Weighted Risk Matrix & Predictive Time-Series Heuristics",

  /**
   * Calculate civic risk score for a target zone or dataset
   * @param {Object} inputData
   *   - historicalComplaintsCount: number (0-100 scale)
   *   - recentSurgePercent: number (0-100 scale)
   *   - weatherRainfallMm: number (0-100 scale)
   *   - previousIncidentsCount: number (0-100 scale)
   *   - populationDensityIndex: number (0-100 scale)
   *   - daysSinceLastService: number (0-100 scale)
   */
  calculateRiskScore(inputData) {
    const rawHist = Math.min(100, Math.max(0, inputData.historicalComplaintsCount || 40));
    const rawSurge = Math.min(100, Math.max(0, inputData.recentSurgePercent || 35));
    const rawWeather = Math.min(100, Math.max(0, inputData.weatherRainfallMm || 30));
    const rawIncidents = Math.min(100, Math.max(0, inputData.previousIncidentsCount || 45));
    const rawPop = Math.min(100, Math.max(0, inputData.populationDensityIndex || 50));
    const rawService = Math.min(100, Math.max(0, inputData.daysSinceLastService || 60));

    // Calculate weighted points (Total max = 100)
    const pointsHist = Math.round(rawHist * 0.30);      // Max 30 pts
    const pointsSurge = Math.round(rawSurge * 0.20);    // Max 20 pts
    const pointsWeather = Math.round(rawWeather * 0.15); // Max 15 pts
    const pointsIncidents = Math.round(rawIncidents * 0.15); // Max 15 pts
    const pointsPop = Math.round(rawPop * 0.10);        // Max 10 pts
    const pointsService = Math.round(rawService * 0.10);  // Max 10 pts

    const totalRiskScore = Math.min(100, pointsHist + pointsSurge + pointsWeather + pointsIncidents + pointsPop + pointsService);

    // Risk level classification
    let riskLevel = 'Low';
    let riskClass = 'badge-risk-low';
    if (totalRiskScore >= 76) {
      riskLevel = 'Critical';
      riskClass = 'badge-risk-critical';
    } else if (totalRiskScore >= 51) {
      riskLevel = 'High';
      riskClass = 'badge-risk-high';
    } else if (totalRiskScore >= 26) {
      riskLevel = 'Medium';
      riskClass = 'badge-risk-medium';
    }

    // Calculate prediction confidence (Higher sample size / consistent signals = higher confidence)
    const confidence = Math.min(96, Math.max(75, 78 + Math.round((pointsHist + pointsSurge) * 0.2)));

    // Generate predicted problem type based on dominant vector
    let predictedProblem = "Garbage Accumulation";
    let recommendedAction = "Schedule additional municipal waste collection shift.";
    let timeframe = "Within 48–72 hours";

    if (rawWeather > 65 || rawIncidents > 70) {
      predictedProblem = "Stormwater Drainage & Flooding Overflow";
      recommendedAction = "Inspect storm drain grates, clear debris, and deploy mobile hydro-vac pumps.";
      timeframe = "Within 24–48 hours";
    } else if (rawHist > 70 && rawService > 60) {
      predictedProblem = "Severe Road Pothole & Subbase Erosion";
      recommendedAction = "Deploy road maintenance unit for rapid asphalt patching and soil stabilization.";
      timeframe = "Within 3–5 days";
    } else if (rawSurge > 65) {
      predictedProblem = "Main Water Distribution Pipe Rupture";
      recommendedAction = "Conduct acoustic pressure telemetry check and inspect pressure reduction valves.";
      timeframe = "Within 24–36 hours";
    }

    return {
      riskScore: totalRiskScore,
      riskLevel: riskLevel,
      riskClass: riskClass,
      confidence: confidence,
      predictedProblem: predictedProblem,
      recommendedAction: recommendedAction,
      timeframe: timeframe,
      factorBreakdown: [
        { name: 'Historical Complaints (30%)', points: pointsHist, max: 30, pct: Math.round((pointsHist/30)*100) },
        { name: 'Recent Complaint Surge (20%)', points: pointsSurge, max: 20, pct: Math.round((pointsSurge/20)*100) },
        { name: 'Weather / Rainfall Risk (15%)', points: pointsWeather, max: 15, pct: Math.round((pointsWeather/15)*100) },
        { name: 'Previous Incident Record (15%)', points: pointsIncidents, max: 15, pct: Math.round((pointsIncidents/15)*100) },
        { name: 'Population & Activity (10%)', points: pointsPop, max: 10, pct: Math.round((pointsPop/10)*100) },
        { name: 'Service Delay Factor (10%)', points: pointsService, max: 10, pct: Math.round((pointsService/10)*100) }
      ],
      engineMeta: {
        name: this.ENGINE_NAME,
        methodology: this.METHODOLOGY
      }
    };
  },

  /**
   * Recalculate dynamic predictions for all municipal zones
   */
  recalculateAllZonePredictions() {
    const zones = DataStore.getZones();
    const reports = DataStore.getReports();
    
    return zones.map(zone => {
      const zoneReports = reports.filter(r => r.zoneId === zone.id);
      const recentSurge = zoneReports.filter(r => r.severity === 'Critical' || r.severity === 'High').length * 15;
      
      const input = {
        historicalComplaintsCount: zone.complaintCount,
        recentSurgePercent: Math.min(100, recentSurge + 20),
        weatherRainfallMm: zone.weatherRisk === 'Heavy Rain' ? 85 : (zone.weatherRisk === 'Moderate' ? 50 : 25),
        previousIncidentsCount: zoneReports.length * 8,
        populationDensityIndex: Math.round((zone.population / 175000) * 100),
        daysSinceLastService: zone.serviceFreq === 'Monthly' ? 80 : (zone.serviceFreq === 'Bi-weekly' ? 50 : 25)
      };

      const result = this.calculateRiskScore(input);
      
      return {
        id: `PRED-${zone.id.replace('zone-', '')}01`,
        zoneId: zone.id,
        zoneName: zone.name,
        category: result.predictedProblem,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        confidence: result.confidence,
        timeframe: result.timeframe,
        recommendedAction: result.recommendedAction,
        status: 'Predicted',
        indicators: {
          historicalComplaints: result.factorBreakdown[0].points,
          recentSurge: result.factorBreakdown[1].points,
          weatherFactor: result.factorBreakdown[2].points,
          incidentHistory: result.factorBreakdown[3].points,
          populationActivity: result.factorBreakdown[4].points,
          serviceFrequency: result.factorBreakdown[5].points
        }
      };
    });
  }
};
