import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "../App.css"
import "../styles/dashboard.css"

const API_BASE = "http://127.0.0.1:8000"

export default function Dashboard() {
  const navigate = useNavigate()
  const [backendOk, setBackendOk] = useState(null)
  const [activeMenu, setActiveMenu] = useState("overview")

  const latestPrediction = JSON.parse(
    localStorage.getItem("cyberxai_latest_prediction") || "null"
  )
  const csvSummary = JSON.parse(
    localStorage.getItem("cyberxai_csv_summary") || "null"
  )

  useEffect(() => {
    const user = localStorage.getItem("cyberxai_user")
    if (!user) navigate("/")
  }, [navigate])

  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("cyberxai_token")
    localStorage.removeItem("cyberxai_user")
    navigate("/")
  }

  return (
    <div className="app dashboard-app">
      <aside className="sidebar">
        <div className="logo">CyberXAI</div>
        <nav>
          {[
            ["overview", "Overview"],
            ["predict", "Single predict"],
            ["batch", "Batch CSV"],
            ["logs", "Logs"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`menu ${activeMenu === id ? "active" : ""}`}
              onClick={() => setActiveMenu(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button type="button" className="menu sidebar-logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1>Security dashboard</h1>
          <p>NSL-KDD intrusion detection · 4 features</p>
        </header>

        <section className="cards">
          <article className="card card-status">
            <h3>System status</h3>
            <p className={`status-pill ${backendOk ? "ok" : backendOk === false ? "bad" : "pending"}`}>
              {backendOk === null && "Checking backend…"}
              {backendOk === true && "Backend online"}
              {backendOk === false && "Backend offline"}
            </p>
            <p className="card-meta">API: {API_BASE}</p>
          </article>

          <article className="card">
            <h3>Latest prediction</h3>
            {latestPrediction ? (
              <>
                <p className={`prediction-label ${latestPrediction.label?.toLowerCase()}`}>
                  {latestPrediction.label}
                </p>
                <p>Confidence: {(latestPrediction.confidence * 100).toFixed(1)}%</p>
                <p className="card-meta">{latestPrediction.timestamp}</p>
              </>
            ) : (
              <p>No prediction yet. Run single or batch analysis.</p>
            )}
          </article>

          <article className="card">
            <h3>Uploaded CSV summary</h3>
            {csvSummary ? (
              <>
                <p><strong>{csvSummary.filename}</strong></p>
                <p>{csvSummary.rows} rows · {csvSummary.columns} columns</p>
                <p>Normal: {csvSummary.normal} · Attack: {csvSummary.attack}</p>
              </>
            ) : (
              <p>No CSV processed. Upload from Batch CSV.</p>
            )}
          </article>
        </section>

        <section className="panel dashboard-panel">
          <h2 className="page-title">Quick actions</h2>
          <p className="page-subtitle">Sample features: duration, src_bytes, dst_bytes, count</p>
          <div className="example-buttons">
            <Link to="/predict" className="btn">Single predict</Link>
            <a href="/sample_batch_input.csv" download className="btn secondary-btn">
              Download sample CSV
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}