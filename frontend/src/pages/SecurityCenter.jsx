import {
  getTotalPredictions,
  getAttackCount,
  getNormalCount,
  getAttackRate,
  getCriticalThreatCount,
  getHighThreatCount,
  getLatestThreat,
  getDetectionAccuracy,
} from "../services/storageService"

export default function SecurityCenter() {
  const totalPredictions = getTotalPredictions()
  const attackCount = getAttackCount()
  const normalCount = getNormalCount()
  const attackRate = getAttackRate()

  const criticalThreats = getCriticalThreatCount()
  const highThreats = getHighThreatCount()

  const latestThreat = getLatestThreat()
  const detectionAccuracy = getDetectionAccuracy()

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
        <h1>Security Operations Center</h1>
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
          {securityScore}
          <span>/100</span>
        </p>
      </div>

      <div className="panel dashboard-panel">
        <h2>Detection Analytics</h2>
        <p className="soc-metric-line">
          <span>Detection Accuracy</span>
          <strong>{detectionAccuracy}%</strong>
        </p>
      </div>

      <div className="panel dashboard-panel">
        <h2>Latest Threat</h2>

        {latestThreat ? (
          <div className="soc-detail-grid">
            <p>
              <span>Source</span>
              <strong>{latestThreat.source}</strong>
            </p>
            <p>
              <span>Timestamp</span>
              <strong>{latestThreat.timestamp}</strong>
            </p>
            <p>
              <span>Confidence</span>
              <strong>
                {(Number(latestThreat.confidence) * 100).toFixed(1)}%
              </strong>
            </p>
          </div>
        ) : (
          <p className="soc-empty">No threat recorded yet.</p>
        )}
      </div>

      <div className="panel dashboard-panel">
        <h2>Recommended Actions</h2>

        <ul className="soc-action-list">
          <li>Review Attack Logs</li>
          <li>Generate Executive PDF Report</li>
          <li>Run Batch CSV Analysis</li>
          <li>Review Model Performance</li>
        </ul>
      </div>
    </div>
  )
}
