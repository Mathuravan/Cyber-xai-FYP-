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
} from "../services/storageService"

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
            Real-time NSL-KDD intrusion monitoring and analytics.
          </p>
        </div>

        <div className="monitoring-topbar-meta">
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
            <h2 className="page-title">Live Threat Monitoring</h2>
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
            <span>Live</span>
          </div>
        </div>

        <div className="monitoring-widgets-grid">
          <div className={`monitor-card live-status-card ${liveStatus.className}`}>
            <h3>Live Threat Status</h3>
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

      <div className="panel dashboard-panel">
        <h2 className="page-title">Attack Analytics</h2>
        <div className="summary-cards">
          <div className="card">
            <h3>Total Predictions</h3>
            <p className="card-value">{totalPredictions}</p>
          </div>
          <div className="card attack">
            <h3>Total Attacks</h3>
            <p className="card-value attack">{attackCount}</p>
          </div>
          <div className="card normal">
            <h3>Normal Traffic</h3>
            <p className="card-value">{normalCount}</p>
          </div>
          <div className="card">
            <h3>Attack Rate</h3>
            <p className="card-value">{attackRate}%</p>
          </div>
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
