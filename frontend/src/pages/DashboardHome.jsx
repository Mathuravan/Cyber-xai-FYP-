import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { API_BASE } from "../services/authService"
import { checkHealth } from "../services/predictionService"

import {
  getLatestPrediction,
  getCsvSummary,
  getTotalPredictions,
  getAttackCount,
  getNormalCount,
  getAttackRate,
} from "../services/storageService"

import SystemStatusCard from "../components/dashboard/SystemStatusCard"
import LatestPredictionCard from "../components/dashboard/LatestPredictionCard"
import CsvSummaryCard from "../components/dashboard/CsvSummaryCard"

export default function DashboardHome() {
  const [backendOk, setBackendOk] = useState(null)

  const latestPrediction = getLatestPrediction()
  const csvSummary = getCsvSummary()
  
  // Analytics data
  const totalPredictions = getTotalPredictions()
  const attackCount = getAttackCount()
  const normalCount = getNormalCount()
  const attackRate = getAttackRate()

  useEffect(() => {
    checkHealth()
      .then(() => {
        setBackendOk(true)
      })
      .catch(() => {
        setBackendOk(false)
      })
  }, [])

  return (
    <>
      <div className="topbar">
        <h1>Security Dashboard</h1>

        <p>
          NSL-KDD intrusion detection using
          duration, src_bytes, dst_bytes, and count.
        </p>
      </div>

      {/* Analytics Summary Section */}
      <div className="panel dashboard-panel" style={{ marginBottom: '20px' }}>
        <h2 className="page-title">Attack Analytics</h2>
        <div className="summary-cards">
          <div className="card">
            <h3>Total Predictions</h3>
            <p className="card-value">{totalPredictions}</p>
          </div>
          <div className="card attack">
            <h3>Total Attacks</h3>
            <p className="card-value">{attackCount}</p>
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
      </div>

      <div className="cards">
        <SystemStatusCard
          backendOk={backendOk}
          apiBase={API_BASE}
        />

        <LatestPredictionCard
          prediction={latestPrediction}
        />

        <CsvSummaryCard
          summary={csvSummary}
        />
      </div>

      <div className="panel dashboard-panel">
        <h2 className="page-title">
          Quick Actions
        </h2>

        <p className="page-subtitle">
          Run predictions or test the system using
          sample CSV files.
        </p>

        <div className="example-buttons">
          <Link
            to="/dashboard/predict"
            className="btn"
          >
            Single Predict
          </Link>

          <Link
            to="/dashboard/batch"
            className="btn secondary-btn"
          >
            Batch CSV
          </Link>

          <a
            href="/sample_batch_input.csv"
            download
            className="btn secondary-btn"
          >
            Download Sample CSV
          </a>
        </div>
      </div>
    </>
  )
}