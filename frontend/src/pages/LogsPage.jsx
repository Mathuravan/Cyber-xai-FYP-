import { getAttackLogs } from "../services/storageService"

export default function LogsPage() {
  const logs = getAttackLogs()

  return (
    <div className="predict-page">
      <div className="topbar">
        <h1>Attack Logs</h1>

        <p>
          View saved prediction and batch analysis
          history.
        </p>
      </div>

      <div className="panel dashboard-panel">
        {logs.length === 0 ? (
          <p className="loading-text">
            No attack logs found.
          </p>
        ) : (
          <div className="logs-list">
            {logs.map((log, index) => (
              <div
                key={index}
                className="result-box predict-result"
              >
                <p>
                  <strong>Type:</strong>{" "}
                  {log.label}
                </p>

                <p>
                  <strong>Confidence:</strong>{" "}
                  {(log.confidence * 100).toFixed(1)}%
                </p>

                <p>
                  <strong>Source:</strong>{" "}
                  {log.source}
                </p>

                <p>
                  <strong>Timestamp:</strong>{" "}
                  {log.timestamp}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}