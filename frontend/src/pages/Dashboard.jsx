import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../App.css"
import "../styles/dashboard.css"

import Sidebar from "../components/dashboard/Sidebar"
import SystemStatusCard from "../components/dashboard/SystemStatusCard"
import LatestPredictionCard from "../components/dashboard/LatestPredictionCard"
import CsvSummaryCard from "../components/dashboard/CsvSummaryCard"
import QuickActionsPanel from "../components/dashboard/QuickActionsPanel"
import AttackLogsPanel from "../components/dashboard/AttackLogsPanel"

const API_BASE = "http://127.0.0.1:8000"

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null")
  } catch {
    return null
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState("overview")
  const [backendOk, setBackendOk] = useState(null)

  const latestPrediction = readStorage("cyberxai_latest_prediction")
  const csvSummary = readStorage("cyberxai_csv_summary")
  const attackLogs = readStorage("cyberxai_attack_logs") || []

  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [])

  const handleLogout = () => {
    navigate("/")
  }

  const handleDownloadSample = () => {
    window.open("/sample_batch_input.csv", "_blank")
  }

  const showOverview = activeMenu === "overview"
  const showLogs = activeMenu === "logs"

  return (
    <motionless className="app dashboard-app">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={setActiveMenu}
        onLogout={handleLogout}
      />

      <motionless className="main">
        <motionless className="topbar">
          <h1>Security dashboard</h1>
          <p>AI-powered intrusion detection overview</p>
        </motionless>

        {showOverview && (
          <>
            <motionless className="cards">
              <SystemStatusCard backendOk={backendOk} apiBase={API_BASE} />
              <LatestPredictionCard prediction={latestPrediction} />
              <CsvSummaryCard summary={csvSummary} />
            </motionless>

            <QuickActionsPanel onDownloadSample={handleDownloadSample} />
          </>
        )}

        {activeMenu === "predict" && (
          <motionless className="panel dashboard-panel">
            <h2 className="page-title">Single predict</h2>
            <p className="page-subtitle">This page will be added in the next step.</p>
          </motionless>
        )}

        {activeMenu === "batch" && (
          <motionless className="panel dashboard-panel">
            <h2 className="page-title">Batch CSV</h2>
            <p className="page-subtitle">Upload and batch prediction coming soon.</p>
          </motionless>
        )}

        {showLogs && <AttackLogsPanel logs={attackLogs} />}
      </motionless>
    </motionless>
  )
}