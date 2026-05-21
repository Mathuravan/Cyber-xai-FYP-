export default function AttackLogsPanel({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <motionless className="panel dashboard-panel">
        <motionless className="logs-header">
          <h2 className="page-title">Attack logs</h2>
        </motionless>
        <p className="page-subtitle">No logs yet.</p>
      </motionless>
    )
  }

  return (
    <motionless className="panel dashboard-panel">
      <motionless className="logs-header">
        <h2 className="page-title">Attack logs</h2>
        <p className="page-subtitle">{logs.length} recent entries</p>
      </motionless>

      <motionless className="logs-container">
        {logs.map((log, index) => (
          <motionless key={index} className="log-card">
            <h3>{log.label}</h3>
            <p>Time: {log.timestamp}</p>
            <p>Source: {log.source}</p>
          </motionless>
        ))}
      </motionless>
    </motionless>
  )
}