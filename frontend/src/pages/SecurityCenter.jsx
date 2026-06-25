import { useEffect, useState } from "react"
import {
  getTotalPredictions,
  getAttackCount,
  getNormalCount,
  getAttackRate,
  getCriticalThreatCount,
  getHighThreatCount,
  getDetectionAccuracy,
  getPredictionHistory,
} from "../services/storageService"
import { fetchPredictionLogs } from "../services/predictionService"

function mapBackendLog(log) {
  return {
    label: log.prediction || log.attack_type || "Prediction",
    confidence: Number(log.confidence) || 0,
    timestamp: log.timestamp || "",
    source: log.attack_type || "Prediction log",
  }
}

export default function SecurityCenter() {
  const [latestPrediction, setLatestPrediction] = useState(null)
  const totalPredictions = getTotalPredictions()
  const attackCount = getAttackCount()
  const normalCount = getNormalCount()
  const attackRate = getAttackRate()

  const criticalThreats = getCriticalThreatCount()
  const highThreats = getHighThreatCount()

  const detectionAccuracy = getDetectionAccuracy()

  useEffect(() => {
    let isMounted = true

    fetchPredictionLogs(1)
      .then((logs) => {
        if (isMounted) {
          setLatestPrediction(
            logs.length > 0
              ? mapBackendLog(logs[0])
              : getPredictionHistory()[0] || null
          )
        }
      })
      .catch(() => {
        if (isMounted) {
          setLatestPrediction(getPredictionHistory()[0] || null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const securityScore = Math.max(
    0,
    Math.round(100 - Number(attackRate || 0))
  )

  let status = "SECURE"
  let statusClass = "secure"

  if (criticalThreats > 0) {
    status = "CRITICAL"
    statusClass = "critical"
  } else if (Number(attackRate) > 10) {
    status = "MONITORING"
    statusClass = "warning"
  }

  return (
    <div className="security-center-page">
      <div className="topbar">
        <h1>Security Analytics Center</h1>
        <p>
          Centralized monitoring dashboard for CyberXAI security analytics.
        </p>
      </div>

      <div className="summary-cards cards">
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
          <p className="card-value normal">{normalCount}</p>
        </div>

        <div className="card">
          <h3>Attack Rate</h3>
          <p className="card-value">{attackRate}%</p>
        </div>
      </div>

      <div className="panel dashboard-panel">
        <h2>Threat Status</h2>
        <p className={`soc-status-badge ${statusClass}`}>{status}</p>

        <div className="soc-detail-grid">
          <p>
            <span>Critical Threats</span>
            <strong>{criticalThreats}</strong>
          </p>
          <p>
            <span>High Threats</span>
            <strong>{highThreats}</strong>
          </p>
        </div>
      </div>

      <div className="panel dashboard-panel">
        <h2>Security Score</h2>

        <div className="security-score-meter">
          <div
            className="security-score-fill"
            style={{ width: `${securityScore}%` }}
          />
        </div>

        <p className="soc-score-value">
          {totalPredictions === 0 ? "Baseline " : ""}
          {securityScore}
          <span>/100</span>
        </p>
      </div>

      <div className="panel dashboard-panel">
        <h2>Detection Analytics</h2>
        <p className="soc-metric-line">
          <span>Detection Accuracy</span>
          <strong>
            {totalPredictions > 0
              ? `${detectionAccuracy}%`
              : "No data yet"}
          </strong>
        </p>
      </div>

      <div className="panel dashboard-panel">
        <h2>Latest Prediction</h2>

        {latestPrediction ? (
          <div className="soc-detail-grid">
            <p>
              <span>Prediction</span>
              <strong>{latestPrediction.label}</strong>
            </p>
            <p>
              <span>Timestamp</span>
              <strong>{latestPrediction.timestamp || "Not available"}</strong>
            </p>
            <p>
              <span>Confidence</span>
              <strong>
                {(Number(latestPrediction.confidence) * 100).toFixed(1)}%
              </strong>
            </p>
            {latestPrediction.source && (
              <p>
                <span>Source</span>
                <strong>{latestPrediction.source}</strong>
              </p>
            )}
          </div>
        ) : totalPredictions === 0 ? (
          <p className="soc-empty">No prediction recorded yet.</p>
        ) : (
          <p className="soc-empty">Loading latest prediction...</p>
        )}
      </div>

      <div className="panel dashboard-panel">
        <h2>Recommended Actions</h2>

        <ul className="soc-action-list">
          <li>Review Prediction Logs</li>
          <li>Generate Executive PDF Report</li>
          <li>Run Batch CSV Analysis</li>
          <li>Review Model Performance</li>
        </ul>
      </div>
    </div>
  )
}
