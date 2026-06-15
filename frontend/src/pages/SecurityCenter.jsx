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

if (criticalThreats > 0) {
status = "CRITICAL"
} else if (Number(attackRate) > 10) {
status = "MONITORING"
}

return ( <div className="security-center-page"> <div className="topbar"> <h1>Security Operations Center</h1> <p>
Centralized monitoring dashboard for CyberXAI security analytics. </p> </div>

```
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

  <div className="panel dashboard-panel">
    <h2>Threat Status</h2>
    <p className="status-text">{status}</p>

    <p>
      Critical Threats: {criticalThreats}
    </p>

    <p>
      High Threats: {highThreats}
    </p>
  </div>

  <div className="panel dashboard-panel">
    <h2>Security Score</h2>

    <div className="security-score-track">
      <div
        className="security-score-fill"
        style={{ width: `${securityScore}%` }}
      />
    </div>

    <p>{securityScore}/100</p>
  </div>

  <div className="panel dashboard-panel">
    <h2>Detection Analytics</h2>

    <p>
      Detection Accuracy: {detectionAccuracy}%
    </p>
  </div>

  <div className="panel dashboard-panel">
    <h2>Latest Threat</h2>

    {latestThreat ? (
      <>
        <p>Source: {latestThreat.source}</p>
        <p>Timestamp: {latestThreat.timestamp}</p>
        <p>
          Confidence:
          {(Number(latestThreat.confidence) * 100).toFixed(1)}%
        </p>
      </>
    ) : (
      <p>No threat recorded yet.</p>
    )}
  </div>

  <div className="panel dashboard-panel">
    <h2>Recommended Actions</h2>

    <ul>
      <li>Review Attack Logs</li>
      <li>Generate Executive PDF Report</li>
      <li>Run Batch CSV Analysis</li>
      <li>Review Model Performance</li>
    </ul>
  </div>
</div>

)
}
