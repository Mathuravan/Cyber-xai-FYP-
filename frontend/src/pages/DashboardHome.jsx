import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { API_BASE } from "../services/authService"
import { checkHealth } from "../services/predictionService"

import {
  getLatestPrediction,
  getCsvSummary,
  getTotalPredictions,
  getAttackCount,
  getNormalCount,
  getAttackRate,
  getCriticalThreatCount,
  getHighThreatCount,
  getMediumThreatCount,
  getLowThreatCount,
  getLatestThreat,
  getActiveThreatCount,
  getRecentThreats,
  getDetectionAccuracy,
  getSystemUptime,
  getThreatSeverityLabel,
  getPredictionHistory,
} from "../services/storageService"

import { generateExecutiveReport } from "../services/reportService"

import SystemStatusCard from "../components/dashboard/SystemStatusCard"
import LatestPredictionCard from "../components/dashboard/LatestPredictionCard"
import CsvSummaryCard from "../components/dashboard/CsvSummaryCard"

const ATTACK_RATE_ALERT_THRESHOLD = 40
const REFRESH_INTERVAL_MS = 5000

function getLiveThreatStatus(attackRate, activeThreats, criticalCount) {
  if (criticalCount > 0 || Number(attackRate) >= ATTACK_RATE_ALERT_THRESHOLD) {
    return {
      label: "Elevated Risk",
      className: "alert",
    }
  }

  if (activeThreats > 0) {
    return {
      label: "Monitoring",
      className: "watch",
    }
  }

  return {
    label: "Secure",
    className: "secure",
  }
}

function getSeverityClassName(confidence) {
  const label = getThreatSeverityLabel(confidence).toLowerCase()
  return label
}

function generateSecurityRecommendations({
  attackRate,
  criticalThreatCount,
  latestThreat,
  detectionAccuracy,
  recentThreats,
  activeThreats,
  highThreatCount,
}) {
  const rate = Number(attackRate) || 0
  const accuracy = Number(detectionAccuracy) || 0
  const recentCount = recentThreats?.length || 0
  const latestSeverity = latestThreat
    ? getThreatSeverityLabel(latestThreat.confidence)
    : null

  const recommendations = []
  const checklist = []

  if (criticalThreatCount > 0) {
    recommendations.push({
      id: "isolate-endpoints",
      level: "critical",
      priority: "P1",
      title: "Isolate suspicious endpoints",
      description:
        "Critical threats detected. Immediately isolate affected hosts and review network segmentation.",
    })
    checklist.push("Quarantine endpoints linked to critical alerts")
    checklist.push("Review firewall rules for blocked traffic patterns")
  }

  if (rate >= ATTACK_RATE_ALERT_THRESHOLD) {
    recommendations.push({
      id: "firewall-hardening",
      level: "critical",
      priority: "P1",
      title: "Enable firewall hardening",
      description:
        "High attack rate detected. Tighten ingress/egress rules and enable rate limiting on edge devices.",
    })
    checklist.push("Enable strict firewall policies on perimeter gateways")
  } else if (rate >= 20) {
    recommendations.push({
      id: "firewall-review",
      level: "warning",
      priority: "P2",
      title: "Review firewall configuration",
      description:
        "Moderate attack rate observed. Audit current rules and close unused ports.",
    })
  }

  if (accuracy > 0 && accuracy < 70) {
    recommendations.push({
      id: "retrain-model",
      level: "warning",
      priority: "P2",
      title: "Retrain ML detection model",
      description:
        "Detection confidence is below optimal levels. Consider retraining with updated NSL-KDD samples.",
    })
    checklist.push("Schedule ML model retraining with recent traffic data")
  }

  if (recentCount >= 3 || activeThreats >= 5) {
    recommendations.push({
      id: "increase-monitoring",
      level: "warning",
      priority: "P2",
      title: "Increase monitoring frequency",
      description:
        "Frequent attack activity detected. Use batch-based threat analysis and shorten alert intervals.",
    })
    checklist.push("Reduce dashboard monitoring interval")
    checklist.push("Enable automated alert notifications for SOC team")
  }

  if (highThreatCount >= 2 && criticalThreatCount === 0) {
    recommendations.push({
      id: "threat-hunt",
      level: "warning",
      priority: "P3",
      title: "Conduct proactive threat hunting",
      description:
        "Multiple high-severity events logged. Investigate lateral movement and anomalous traffic flows.",
    })
  }

  if (
    recommendations.length === 0 &&
    rate < 10 &&
    criticalThreatCount === 0 &&
    activeThreats === 0
  ) {
    recommendations.push({
      id: "maintain-defenses",
      level: "stable",
      priority: "P4",
      title: "Maintain current defenses",
      description:
        "Environment appears stable. Continue routine monitoring and keep detection models updated.",
    })
    checklist.push("Continue scheduled vulnerability scans")
    checklist.push("Review attack logs weekly for emerging patterns")
  } else if (
    recommendations.every((item) => item.level !== "stable") &&
    rate < 15 &&
    criticalThreatCount === 0
  ) {
    recommendations.push({
      id: "maintain-baseline",
      level: "stable",
      priority: "P4",
      title: "Maintain baseline security posture",
      description:
        "No critical alerts active. Keep current controls while addressing flagged recommendations.",
    })
  }

  let posture = "Stable"
  let postureClass = "stable"
  let hasCriticalAlert = false

  if (criticalThreatCount > 0 || rate >= ATTACK_RATE_ALERT_THRESHOLD) {
    posture = "Critical Risk"
    postureClass = "critical"
    hasCriticalAlert = true
  } else if (
    rate >= 15 ||
    highThreatCount >= 2 ||
    recentCount >= 3 ||
    (accuracy > 0 && accuracy < 70)
  ) {
    posture = "Elevated Warning"
    postureClass = "warning"
  }

  let securityScore = 100
  securityScore -= Math.min(rate, 50)
  securityScore -= criticalThreatCount * 15
  securityScore -= highThreatCount * 5
  if (accuracy > 0 && accuracy < 70) securityScore -= 10
  if (recentCount >= 3) securityScore -= 5
  securityScore = Math.max(0, Math.min(100, Math.round(securityScore)))

  let riskSummary = ""

  if (hasCriticalAlert) {
    riskSummary = `CyberXAI detected ${criticalThreatCount} critical threat(s) with an attack rate of ${rate}%. Immediate defensive action is recommended.`
  } else if (postureClass === "warning") {
    riskSummary = `Monitoring indicates elevated risk with ${activeThreats} active threat(s) and ${rate}% attack rate. Review priority recommendations below.`
  } else if (activeThreats === 0) {
    riskSummary =
      "No active threats in local logs. Network posture is stable — maintain current monitoring and preventive controls."
  } else {
    riskSummary = `Low-level activity detected (${activeThreats} logged threat(s)). Continue monitoring and apply suggested hardening steps.`
  }

  if (latestSeverity === "Critical") {
    riskSummary += ` Latest detection severity: Critical.`
  }

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const order = { critical: 0, warning: 1, stable: 2 }
    return order[a.level] - order[b.level]
  })

  if (checklist.length === 0) {
    checklist.push("Review latest threat logs in the Attack Logs page")
    checklist.push("Run batch CSV analysis for bulk traffic screening")
  }

  return {
    posture,
    postureClass,
    hasCriticalAlert,
    securityScore,
    riskSummary,
    recommendations: sortedRecommendations,
    checklist,
  }
}

export default function DashboardHome() {
  const [backendOk, setBackendOk] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleString()
  )

  const latestPrediction = getLatestPrediction()
  const csvSummary = getCsvSummary()

  const totalPredictions = getTotalPredictions()
  const attackCount = getAttackCount()
  const normalCount = getNormalCount()
  const attackRate = getAttackRate()

  const criticalThreats = getCriticalThreatCount()
  const highThreats = getHighThreatCount()
  const mediumThreats = getMediumThreatCount()
  const lowThreats = getLowThreatCount()
  const latestThreat = getLatestThreat()
  const activeThreats = getActiveThreatCount()
  const recentThreats = getRecentThreats(5)
  const detectionAccuracy = getDetectionAccuracy()
  const systemUptime = getSystemUptime()

  const liveStatus = getLiveThreatStatus(
    attackRate,
    activeThreats,
    criticalThreats
  )

  const isHighAlert =
    Number(attackRate) >= ATTACK_RATE_ALERT_THRESHOLD ||
    criticalThreats > 0

  const securityInsights = generateSecurityRecommendations({
    attackRate,
    criticalThreatCount: criticalThreats,
    latestThreat,
    detectionAccuracy,
    recentThreats,
    activeThreats,
    highThreatCount: highThreats,
  })

  useEffect(() => {
    checkHealth()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [])

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setRefreshTick((value) => value + 1)
      setCurrentTime(new Date().toLocaleString())
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(refreshTimer)
  }, [])

  return (
    <>
      <div className="topbar monitoring-topbar">
        <div>
          <h1>Security Dashboard</h1>
          <p>
            Dashboard monitoring for NSL-KDD intrusion analytics.
          </p>
        </div>

        <div className="monitoring-topbar-meta" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn logs-export-btn"
            onClick={generateExecutiveReport}
            style={{ padding: "6px 12px", fontSize: "13px" }}
          >
            Download PDF Report
          </button>
          <span className="system-online-badge">System Online</span>
          <span className="live-clock">{currentTime}</span>
        </div>
      </div>

      <div
        className="panel dashboard-panel live-monitoring-panel"
        data-refresh={refreshTick}
      >
        <div className="live-monitoring-header">
          <div>
            <h2 className="page-title">Prototype Monitoring View</h2>
            <p className="page-subtitle">
              Auto-refreshes every 5 seconds from local detection data.
            </p>
          </div>

          <div
            className={`live-indicator ${
              isHighAlert ? "alert-pulse" : "healthy-pulse"
            }`}
          >
            <span className="live-indicator-dot" />
            <span>Dashboard</span>
          </div>
        </div>

        <div className="monitoring-widgets-grid">
          <div className={`monitor-card live-status-card ${liveStatus.className}`}>
            <h3>Dashboard Threat Status</h3>
            <p className="monitor-value">{liveStatus.label}</p>
            <p className="monitor-meta">
              {isHighAlert
                ? "Attack rate or critical threats above threshold"
                : "No critical alerts detected"}
            </p>
          </div>

          <div className="monitor-card">
            <h3>Total Active Threats</h3>
            <p className="monitor-value attack">{activeThreats}</p>
            <p className="monitor-meta">Stored attack log entries</p>
          </div>

          <div className="monitor-card">
            <h3>Detection Accuracy</h3>
            <p className="monitor-value">{detectionAccuracy}%</p>
            <p className="monitor-meta">Average prediction confidence</p>
          </div>

          <div className="monitor-card">
            <h3>Last Threat Timestamp</h3>
            <p className="monitor-value monitor-value-sm">
              {latestThreat?.timestamp || "None recorded"}
            </p>
            <p className="monitor-meta">
              {latestThreat?.source || "Run a prediction to log threats"}
            </p>
          </div>

          <div className="monitor-card">
            <h3>System Uptime</h3>
            <p className="monitor-value">{systemUptime}</p>
            <p className="monitor-meta">Current browser session</p>
          </div>

          <div className="monitor-card trend-card">
            <h3>Threat Trend</h3>
            <p className="monitor-value">{attackRate}%</p>
            <p className="monitor-meta">
              Attack rate · {attackCount} attacks / {totalPredictions}{" "}
              predictions
            </p>
          </div>
        </div>

        <h3 className="severity-overview-title">Threat Severity Overview</h3>
        <div className="summary-cards severity-overview-cards">
          <div className="card monitor-severity-card critical-card">
            <h3>Critical Threats</h3>
            <p className="card-value attack">{criticalThreats}</p>
          </div>
          <div className="card monitor-severity-card">
            <h3>High Threats</h3>
            <p className="card-value attack">{highThreats}</p>
          </div>
          <div className="card monitor-severity-card">
            <h3>Medium Threats</h3>
            <p className="card-value">{mediumThreats}</p>
          </div>
          <div className="card monitor-severity-card">
            <h3>Low Threats</h3>
            <p className="card-value normal">{lowThreats}</p>
          </div>
        </div>
      </div>

      <div className="panel dashboard-panel live-activity-panel">
        <h2 className="page-title">Recent Threat Activity</h2>
        <p className="page-subtitle">Latest 5 threats from attack logs.</p>

        {recentThreats.length === 0 ? (
          <div className="empty-state live-activity-empty">
            <p>No recent threats logged. The network appears secure.</p>
          </div>
        ) : (
          <ul className="live-activity-list">
            {recentThreats.map((threat, index) => {
              const severityClass = getSeverityClassName(
                threat.confidence
              )

              return (
                <li
                  key={`${threat.timestamp}-${threat.source}-${index}`}
                  className="live-activity-item"
                >
                  <div className="live-activity-main">
                    <span className="live-activity-time">
                      {threat.timestamp}
                    </span>
                    <span className="live-activity-source">
                      {threat.source}
                    </span>
                  </div>
                  <div className="live-activity-meta">
                    <span
                      className={`severity-badge ${severityClass}`}
                    >
                      {getThreatSeverityLabel(threat.confidence)}
                    </span>
                    <span className="live-activity-confidence">
                      {(Number(threat.confidence) * 100).toFixed(1)}%
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div
        className="panel dashboard-panel ai-recommendations-panel"
        data-refresh={refreshTick}
      >
        <div className="ai-recommendations-header">
          <div>
            <h2 className="page-title">AI Security Recommendations</h2>
            <p className="page-subtitle">
              Dynamic defensive guidance based on dashboard threat analytics.
              Refreshes every 5 seconds.
            </p>
          </div>

          {securityInsights.hasCriticalAlert && (
            <div className="ai-critical-pulse">
              <span className="ai-critical-pulse-dot" />
              <span>Critical Alert</span>
            </div>
          )}
        </div>

        <div className="ai-recommendations-overview">
          <div
            className={`ai-posture-card ${securityInsights.postureClass}`}
          >
            <h3>Threat Posture Status</h3>
            <p className="ai-posture-value">
              {securityInsights.posture}
            </p>
            <p className="ai-posture-meta">
              Based on attack rate, severity, and recent activity
            </p>
          </div>

          <div className="ai-score-card">
            <h3>Security Score</h3>
            <div className="security-score-meter">
              <div
                className="security-score-fill"
                style={{
                  width: `${securityInsights.securityScore}%`,
                }}
              />
            </div>
            <p className="ai-score-value">
              {securityInsights.securityScore}
              <span>/100</span>
            </p>
          </div>
        </div>

        <div className="ai-risk-summary">
          <h3>AI-Generated Risk Summary</h3>
          <p>{securityInsights.riskSummary}</p>
        </div>

        <h3 className="ai-section-title">Priority Recommendations</h3>
        <div className="ai-recommendations-grid">
          {securityInsights.recommendations.map((item) => (
            <div
              key={item.id}
              className={`ai-recommendation-card ${item.level}`}
            >
              <div className="ai-recommendation-header">
                <span
                  className={`ai-priority-badge ${item.level}`}
                >
                  {item.priority}
                </span>
                <span className={`ai-level-label ${item.level}`}>
                  {item.level === "critical"
                    ? "Critical"
                    : item.level === "warning"
                      ? "Warning"
                      : "Stable"}
                </span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          ))}
        </div>

        <div className="ai-checklist-section">
          <h3 className="ai-section-title">Security Action Checklist</h3>
          <ul className="ai-checklist">
            {securityInsights.checklist.map((action, index) => (
              <li key={`${action}-${index}`}>
                <span className="ai-check-icon">✓</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Threat Trend Analytics */}
      <div className="panel dashboard-panel threat-trend-panel" data-refresh={refreshTick}>
        <div className="threat-trend-header">
          <h2 className="page-title">Threat Trend Analytics</h2>
          <p className="page-subtitle">Batch-based threat analysis of attack vectors and prediction trends.</p>
        </div>

        {/* Analytics Insights */}
        <div className="analytics-insights-bar">
          <h3><span className="insight-icon">💡</span> Analytics Insights</h3>
          <ul className="insights-list">
             {Number(attackRate) > 15 ? <li>Attack activity is currently elevated at {attackRate}%.</li> : <li>Normal traffic dominates recent predictions.</li>}
             {criticalThreats > 0 ? <li>Critical threats demand immediate attention.</li> : (highThreats > 0 ? <li>Most threats are High severity.</li> : <li>Detection confidence remains stable.</li>)}
          </ul>
        </div>

        {/* Analytics Cards */}
        <div className="summary-cards trend-analytics-cards">
          <div className="card">
            <h3>Total Predictions</h3>
            <p className="card-value">{totalPredictions}</p>
          </div>
          <div className="card attack">
            <h3>Total Attacks</h3>
            <p className="card-value attack">{attackCount}</p>
          </div>
          <div className="card normal">
            <h3>Total Normal Traffic</h3>
            <p className="card-value">{normalCount}</p>
          </div>
          <div className="card">
            <h3>Average Confidence</h3>
            <p className="card-value">{detectionAccuracy}%</p>
          </div>
          <div className="card">
            <h3>Attack Rate</h3>
            <p className="card-value">{attackRate}%</p>
          </div>
        </div>

        <div className="trend-panels-grid">
           {/* Threat Trend Summary Panel */}
           <div className="trend-summary-panel">
              <h3>Threat Trend Summary</h3>
              <div className="trend-indicator-box">
                {Number(attackRate) >= 15 || criticalThreats > 0 ? (
                  <div className="trend-status increasing">
                    <span className="trend-arrow">↑</span>
                    <h4>Increasing Threat Activity</h4>
                    <p>Attack frequency is rising.</p>
                  </div>
                ) : (Number(attackRate) >= 5 || activeThreats > 0 ? (
                  <div className="trend-status stable">
                    <span className="trend-arrow">→</span>
                    <h4>Stable Threat Activity</h4>
                    <p>Threat detection is stable.</p>
                  </div>
                ) : (
                  <div className="trend-status decreasing">
                    <span className="trend-arrow">↓</span>
                    <h4>Decreasing Threat Activity</h4>
                    <p>No significant threats detected recently.</p>
                  </div>
                ))}
              </div>
           </div>

           {/* Severity Distribution Panel */}
           <div className="severity-distribution-panel">
              <h3>Severity Distribution</h3>
              <div className="severity-bars">
                 <div className="severity-bar-item">
                    <span className="sev-label critical">Critical</span>
                    <span className="sev-count">{criticalThreats}</span>
                 </div>
                 <div className="severity-bar-item">
                    <span className="sev-label high">High</span>
                    <span className="sev-count">{highThreats}</span>
                 </div>
                 <div className="severity-bar-item">
                    <span className="sev-label medium">Medium</span>
                    <span className="sev-count">{mediumThreats}</span>
                 </div>
                 <div className="severity-bar-item">
                    <span className="sev-label low">Low</span>
                    <span className="sev-count">{lowThreats}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Recent Prediction Trends */}
        <div className="recent-prediction-trends">
           <h3>Recent Prediction Trends</h3>
           {getPredictionHistory().slice(0, 10).length === 0 ? (
              <p>No prediction history available.</p>
           ) : (
              <div className="table-responsive">
                <table className="trends-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Label</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPredictionHistory().slice(0, 10).map((pred, i) => (
                      <tr key={i}>
                        <td>{pred.timestamp}</td>
                        <td><span className={`severity-badge ${pred.label.toLowerCase() === 'attack' ? 'critical' : 'low'}`}>{pred.label}</span></td>
                        <td>{(Number(pred.confidence) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           )}
        </div>
      </div>

      <div className="cards">
        <SystemStatusCard backendOk={backendOk} apiBase={API_BASE} />
        <LatestPredictionCard prediction={latestPrediction} />
        <CsvSummaryCard summary={csvSummary} />
      </div>

      <div className="panel dashboard-panel">
        <h2 className="page-title">Quick Actions</h2>
        <p className="page-subtitle">
          Run predictions or test the system using sample CSV files.
        </p>

        <div className="example-buttons">
          <Link to="/dashboard/predict" className="btn">
            Single Predict
          </Link>
          <Link to="/dashboard/batch" className="btn secondary-btn">
            Batch CSV
          </Link>
          <a
            href="/sample_batch_input.csv"
            download
            className="btn secondary-btn"
          >
            Download Sample CSV
          </a>
        </div>
      </div>
    </>
  )
}
