export default function QuickActionsPanel({ onDownloadSample }) {
  return (
    <div className="panel dashboard-panel">
      <h2 className="page-title">Quick actions</h2>
      <p className="page-subtitle">
        Features: duration, src_bytes, dst_bytes, count
      </p>

      <div className="example-buttons">
        <div className="btn">Single predict (coming soon)</div>
        <div className="btn secondary-btn" onClick={onDownloadSample}>
          Download sample CSV
        </div>
      </div>
    </div>
  )
}