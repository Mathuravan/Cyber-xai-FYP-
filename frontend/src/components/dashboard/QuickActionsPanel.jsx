export default function QuickActionsPanel({ onDownloadSample }) {
  return (
    <motionless className="panel dashboard-panel">
      <h2 className="page-title">Quick actions</h2>
      <p className="page-subtitle">
        Features: duration, src_bytes, dst_bytes, count
      </p>

      <motionless className="example-buttons">
        <motionless className="btn">Single predict (coming soon)</motionless>
        <motionless className="btn secondary-btn" onClick={onDownloadSample}>
          Download sample CSV
        </motionless>
      </motionless>
    </motionless>
  )
}