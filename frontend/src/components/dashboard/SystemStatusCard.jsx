export default function SystemStatusCard({ backendOk, apiBase }) {
  let statusClass = "pending"
  let statusText = "Checking backend…"

  if (backendOk === true) {
    statusClass = "ok"
    statusText = "Backend online"
  } else if (backendOk === false) {
    statusClass = "bad"
    statusText = "Backend offline"
  }

  return (
    <div className="card">
      <h3>System status</h3>
      <p className={`status-pill ${statusClass}`}>{statusText}</p>
      <p className="card-meta">API: {apiBase}</p>
    </div>
  )
}