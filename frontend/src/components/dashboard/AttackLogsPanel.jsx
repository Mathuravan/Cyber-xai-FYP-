export default function AttackLogsPanel({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="panel dashboard-panel">
        <div className="logs-header">
          <h2 className="page-title">Prediction logs</h2>
        </div>
        <p className="page-subtitle">No logs yet.</p>
      </div>
    )
  }

  return (
    <div className="panel dashboard-panel">
      <div className="logs-header">
        <h2 className="page-title">Prediction logs</h2>
        <p className="page-subtitle">{logs.length} recent entries</p>
      </div>

      <div className="logs-container">
        {logs.map((log, index) => (
          <div key={index} className="log-card">
            <h3>{log.label}</h3>
            <p>Time: {log.timestamp}</p>
            <p>Source: {log.source}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
