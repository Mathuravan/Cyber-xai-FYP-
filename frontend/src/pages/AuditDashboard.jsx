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

export default function AuditDashboard() {
  const totalPredictions = getTotalPredictions()
  const attackCount = getAttackCount()
  const normalCount = getNormalCount()
  const attackRate = getAttackRate()

  const criticalThreats = getCriticalThreatCount()
  const highThreats = getHighThreatCount()

  const latestPrediction = getPredictionHistory()[0] || null
  const detectionAccuracy = getDetectionAccuracy()

  const recentEvents = getPredictionHistory().slice(0, 10)

  return (
    <div className="audit-dashboard-page">
      <div className="topbar">
        <h1>Audit Dashboard</h1>
        <p>
          Security audit monitoring and activity tracking for CyberXAI.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="audit-summary-grid">
        <div className="audit-card">
          <h3>Total Predictions</h3>
          <p className="audit-value">{totalPredictions}</p>
        </div>

        <div className="audit-card">
          <h3>Total Attacks</h3>
          <p className="audit-value">{attackCount}</p>
        </div>

        <div className="audit-card">
          <h3>Normal Traffic</h3>
          <p className="audit-value">{normalCount}</p>
        </div>

        <div className="audit-card">
          <h3>Attack Rate</h3>
          <p className="audit-value">{attackRate}%</p>
        </div>
      </div>

      {/* System Status */}
      <div className="panel dashboard-panel">
        <h2>System Audit Status</h2>

        <div className="audit-status-grid">
          <div className="audit-status-card">
            <h3>Detection Accuracy</h3>
            <p className="audit-status-active">
              {totalPredictions > 0
                ? `${detectionAccuracy}%`
                : "No data yet"}
            </p>
          </div>

          <div className="audit-status-card">
            <h3>Critical Threats</h3>
            <p className="audit-status-active">
              {criticalThreats}
            </p>
          </div>

          <div className="audit-status-card">
            <h3>High Threats</h3>
            <p className="audit-status-active">
              {highThreats}
            </p>
          </div>

          <div className="audit-status-card">
            <h3>Audit Status</h3>
            <p className="audit-status-active">
              Active
            </p>
          </div>
        </div>
      </div>

      {/* Latest Prediction */}
      <div className="panel dashboard-panel">
        <h2>Latest Prediction Information</h2>

        {latestPrediction ? (
          <>
            <p>
              <strong>Prediction:</strong>{" "}
              {latestPrediction.label}
            </p>

            <p>
              <strong>Timestamp:</strong>{" "}
              {latestPrediction.timestamp}
            </p>

            <p>
              <strong>Confidence:</strong>{" "}
              {(Number(latestPrediction.confidence) * 100).toFixed(1)}%
            </p>
          </>
        ) : (
          <p>No prediction records available.</p>
        )}
      </div>

      {/* Audit Event Table */}
      <div className="panel dashboard-panel">
        <h2>Recent Audit Events</h2>

        {recentEvents.length === 0 ? (
          <p>No audit events available.</p>
        ) : (
          <div className="table-responsive">
            <table className="audit-events-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                </tr>
              </thead>

              <tbody>
                {recentEvents.map((event, index) => (
                  <tr key={index}>
                    <td>{event.timestamp}</td>
                    <td>{event.label}</td>
                    <td>
                      {(Number(event.confidence) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Recommendations */}
      <div className="panel dashboard-panel">
        <h2>Audit Recommendations</h2>

        <ul>
          <li>Review recent prediction logs regularly</li>
          <li>Monitor high severity predictions</li>
          <li>Generate PDF security reports when required</li>
          <li>Review model performance metrics</li>
          <li>Run batch traffic analysis periodically</li>
        </ul>
      </div>
    </div>
  )
}
