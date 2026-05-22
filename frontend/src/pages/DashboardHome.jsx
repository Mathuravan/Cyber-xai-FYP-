import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { API_BASE } from "../services/authService"
import { checkHealth } from "../services/predictionService"
import { getLatestPrediction, getCsvSummary } from "../services/storageService"
import SystemStatusCard from "../components/dashboard/SystemStatusCard"
import LatestPredictionCard from "../components/dashboard/LatestPredictionCard"
import CsvSummaryCard from "../components/dashboard/CsvSummaryCard"

export default function DashboardHome() {
  const [backendOk, setBackendOk] = useState(null)
  const latestPrediction = getLatestPrediction()
  const csvSummary = getCsvSummary()

  useEffect(() => {
    checkHealth()
      .then((data) => setBackendOk(data.model_loaded !== false))
      .catch(() => setBackendOk(false))
  }, [])

  return (
    <>
      <div className="topbar">
        <h1>Security dashboard</h1>
        <p>NSL-KDD intrusion detection · 4 features</p>
      </div>
      <div className="cards">
        <SystemStatusCard backendOk={backendOk} apiBase={API_BASE} />
        <LatestPredictionCard prediction={latestPrediction} />
        <CsvSummaryCard summary={csvSummary} />
      </div>
      <div className="panel dashboard-panel">
        <h2 className="page-title">Quick actions</h2>
        <p className="page-subtitle">duration, src_bytes, dst_bytes, count</p>
        <div className="example-buttons">
          <Link to="/dashboard/predict" className="btn">Single predict</Link>
          <Link to="/dashboard/batch" className="btn secondary-btn">Batch CSV</Link>
          <a href="/sample_batch_input.csv" download className="btn secondary-btn">
            Sample CSV
          </a>
        </div>
      </div>
    </>
  )
}