import { useEffect, useState } from "react"

import {
  getAttackLogs,
  clearAttackLogs,
} from "../services/storageService"

import { generateExecutiveReport } from "../services/reportService"
import { API_BASE, getToken } from "../services/authService"

const FILTER_OPTIONS = [
  { value: "all", label: "All Logs" },
  { value: "attack", label: "Attack Only" },
  { value: "normal", label: "Normal Only" },
  { value: "high_confidence", label: "High Confidence (>80%)" },
]

const EXPORT_FILENAME = "cyberxai_threat_report.csv"
const BACKEND_LOG_LIMIT = 100

function getSeverity(confidence, label = "") {
  if (label.toLowerCase() === "normal") {
    return { label: "Low", className: "low" }
  }

  const value = Number(confidence) || 0

  if (value >= 0.9) {
    return { label: "Critical", className: "critical" }
  }

  if (value >= 0.75) {
    return { label: "High", className: "high" }
  }

  if (value >= 0.5) {
    return { label: "Medium", className: "medium" }
  }

  return { label: "Low", className: "low" }
}

function filterLogs(logs, searchQuery, filterType) {
  let result = [...logs]

  if (filterType === "attack") {
    result = result.filter(
      (log) =>
        log.label &&
        log.label.toLowerCase() === "attack"
    )
  } else if (filterType === "normal") {
    result = result.filter(
      (log) =>
        log.label &&
        log.label.toLowerCase() === "normal"
    )
  } else if (filterType === "high_confidence") {
    result = result.filter(
      (log) => Number(log.confidence) > 0.8
    )
  }

  const query = searchQuery.trim().toLowerCase()

  if (query) {
    result = result.filter((log) => {
      const label = (log.label || "").toLowerCase()
      const timestamp = (log.timestamp || "").toLowerCase()
      const source = (log.source || "").toLowerCase()

      return (
        label.includes(query) ||
        timestamp.includes(query) ||
        source.includes(query)
      )
    })
  }

  return result
}

function getLogAnalytics(logs) {
  const criticalCount = logs.filter(
    (log) =>
      getSeverity(log.confidence, log.label).label === "Critical"
  ).length

  const attackCount = logs.filter(
    (log) =>
      log.label &&
      log.label.toLowerCase() === "attack"
  ).length

  const normalCount = logs.filter(
    (log) =>
      log.label &&
      log.label.toLowerCase() === "normal"
  ).length

  return {
    total: logs.length,
    critical: criticalCount,
    attacks: attackCount,
    normal: normalCount,
  }
}

function generateThreatReport(logs) {
  if (!logs.length) {
    return null
  }

  const attackLogs = logs.filter(
    (log) =>
      log.label &&
      log.label.toLowerCase() === "attack"
  )

  const confidences = logs.map(
    (log) => Number(log.confidence) || 0
  )

  const averageConfidence =
    confidences.reduce((sum, value) => sum + value, 0) /
    confidences.length

  const highestConfidenceThreat = logs.reduce((top, log) => {
    if (!top) return log
    return Number(log.confidence) > Number(top.confidence)
      ? log
      : top
  }, null)

  const severityCounts = {}

  logs.forEach((log) => {
    const severityLabel = getSeverity(log.confidence, log.label).label
    severityCounts[severityLabel] =
      (severityCounts[severityLabel] || 0) + 1
  })

  const mostCommonSeverity = Object.entries(severityCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0]

  return {
    totalAttacks: attackLogs.length,
    highestConfidenceThreat,
    averageConfidence,
    mostCommonSeverity: mostCommonSeverity || "N/A",
    generatedAt: new Date().toLocaleString(),
  }
}

function escapeCsvCell(value) {
  const text = String(value ?? "")

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function exportLogsToCSV(logs) {
  if (!logs.length) {
    return false
  }

  const report = generateThreatReport(logs)
  const generatedAt = new Date().toLocaleString()

  const summaryRows = [
    ["CyberXAI Threat Report"],
    ["Generated At", generatedAt],
    ["Total Attacks", report.totalAttacks],
    [
      "Average Confidence %",
      (report.averageConfidence * 100).toFixed(1),
    ],
    [
      "Highest Confidence %",
      (
        Number(report.highestConfidenceThreat.confidence) * 100
      ).toFixed(1),
    ],
    ["Most Common Severity", report.mostCommonSeverity],
    [],
    [
      "timestamp",
      "label",
      "confidence",
      "severity",
      "source",
    ],
  ]

  const dataRows = logs.map((log) => {
    const severity = getSeverity(log.confidence, log.label)

    return [
      log.timestamp,
      log.label,
      `${(Number(log.confidence) * 100).toFixed(1)}%`,
      severity.label,
      log.source,
    ]
  })

  const csvContent = [...summaryRows, ...dataRows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n")

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = EXPORT_FILENAME
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return true
}

function parseInputJson(value) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function mapBackendLog(log) {
  return {
    id: log.id,
    timestamp: log.timestamp || "",
    label: log.prediction || log.attack_type || "Unknown",
    confidence: Number(log.confidence) || 0,
    threatLevel: log.threat_level || "",
    attackType: log.attack_type || "",
    source: "Backend prediction log",
    features: parseInputJson(log.input_json),
  }
}

async function fetchBackendLogs() {
  const token = getToken()
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined

  const response = await fetch(
    `${API_BASE}/api/logs?limit=${BACKEND_LOG_LIMIT}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Backend logs request failed")
  }

  const data = await response.json()

  if (!data || !Array.isArray(data.logs)) {
    throw new Error("Unexpected backend logs response")
  }

  return data.logs.map(mapBackendLog)
}

export default function LogsPage() {
  const [logs, setLogs] = useState(() => getAttackLogs())
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [exportMessage, setExportMessage] = useState("")
  const [exportError, setExportError] = useState("")

  useEffect(() => {
    let isMounted = true

    fetchBackendLogs()
      .then((backendLogs) => {
        if (isMounted) {
          setLogs(backendLogs)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLogs(getAttackLogs())
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredLogs = filterLogs(logs, searchQuery, filterType)
  const analytics = getLogAnalytics(filteredLogs)
  const threatReport = generateThreatReport(filteredLogs)

  const latestAttack =
    logs.length > 0 ? logs[0].timestamp : "No logs"

  const hasActiveSearchOrFilter =
    searchQuery.trim() !== "" || filterType !== "all"

  const handleClearLogs = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all prediction logs?"
    )

    if (!confirmed) return

    clearAttackLogs()
    setLogs([])
    setSearchQuery("")
    setFilterType("all")
    setExportMessage("")
    setExportError("")
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  const handleExportCsv = () => {
    setExportMessage("")
    setExportError("")

    if (logs.length === 0) {
      setExportError(
        "No logs available to export. Run a prediction first."
      )
      return
    }

    if (filteredLogs.length === 0) {
      setExportError(
        "No logs match your current filters. Adjust search or filters to export."
      )
      return
    }

    const success = exportLogsToCSV(filteredLogs)

    if (success) {
      setExportMessage(
        `Report exported successfully as ${EXPORT_FILENAME}`
      )
    } else {
      setExportError("Export failed. Please try again.")
    }
  }

  return (
    <div className="predict-page">
      <div className="topbar logs-header">
        <div>
          <h1>Prediction Logs</h1>
          <p>
            Search, filter, analyze, and export intrusion
            detection history.
          </p>
        </div>

        <div className="logs-header-actions">
          <button
            type="button"
            className="btn logs-export-btn"
            onClick={handleExportCsv}
            disabled={logs.length === 0}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="btn logs-export-btn logs-export-btn-pdf"
            onClick={generateExecutiveReport}
            disabled={logs.length === 0}
          >
            Export PDF Report
          </button>

          {logs.length > 0 && (
            <button
              type="button"
              className="btn-danger"
              onClick={handleClearLogs}
            >
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {exportMessage && (
        <p className="logs-export-success">{exportMessage}</p>
      )}

      {exportError && (
        <p className="logs-export-error">{exportError}</p>
      )}

      <div className="summary-cards logs-summary logs-analytics">
        <div className="card">
          <h3>Total Logs</h3>
          <p className="card-value">{analytics.total}</p>
        </div>

        <div className="card critical-card">
          <h3>Critical Threats</h3>
          <p className="card-value attack">{analytics.critical}</p>
        </div>

        <div className="card warning">
          <h3>Attack Events</h3>
          <p className="card-value attack">{analytics.attacks}</p>
        </div>

        <div className="card normal">
          <h3>Normal Events</h3>
          <p className="card-value">{analytics.normal}</p>
        </div>
      </div>

      {threatReport && (
        <div className="panel dashboard-panel threat-report-panel">
          <h2 className="page-title">Prediction Report Summary</h2>
          <p className="page-subtitle">
            Dashboard statistics for the currently filtered log view.
            Generated {threatReport.generatedAt}
          </p>

          <div className="summary-cards threat-report-cards">
            <div className="card warning">
              <h3>Total Attacks</h3>
              <p className="card-value attack">
                {threatReport.totalAttacks}
              </p>
            </div>

            <div className="card critical-card">
              <h3>Highest Confidence Prediction</h3>
              <p className="card-value attack">
                {(
                  Number(
                    threatReport.highestConfidenceThreat.confidence
                  ) * 100
                ).toFixed(1)}
                %
              </p>
              <p className="report-meta">
                {threatReport.highestConfidenceThreat.label} ·{" "}
                {threatReport.highestConfidenceThreat.source}
              </p>
            </div>

            <div className="card">
              <h3>Average Confidence</h3>
              <p className="card-value">
                {(threatReport.averageConfidence * 100).toFixed(1)}%
              </p>
            </div>

            <div className="card">
              <h3>Most Common Severity</h3>
              <p className="card-value">
                {threatReport.mostCommonSeverity}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="panel dashboard-panel logs-controls-panel">
        <h2 className="page-title">Prediction Log Controls</h2>
        <p className="page-subtitle">
          Search by label, timestamp, or source. Export downloads
          filtered logs only.
        </p>

        <div className="logs-toolbar">
          <div className="logs-search-group">
            <input
              type="search"
              className="logs-search-input"
              placeholder="Search label, timestamp, or source..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />

            {searchQuery && (
              <button
                type="button"
                className="btn secondary-btn logs-clear-search-btn"
                onClick={handleClearSearch}
              >
                Clear Search
              </button>
            )}
          </div>

          <select
            className="logs-filter-select"
            value={filterType}
            onChange={(event) =>
              setFilterType(event.target.value)
            }
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {logs.length > 0 && (
          <p className="logs-filter-hint">
            Showing {filteredLogs.length} of {logs.length} log
            {logs.length === 1 ? "" : "s"}
            {hasActiveSearchOrFilter ? " (filtered)" : ""}
            {" · "}
            Latest detection: {latestAttack}
          </p>
        )}
      </div>

      <div className="panel dashboard-panel results-table-panel logs-table-panel">
        <h2>Recent Predictions</h2>

        {logs.length === 0 ? (
          <div className="empty-state">
            <p>
              No prediction logs found. The system is currently secure.
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <p>
              No logs match your search or filters. Try adjusting
              the query or selecting a different filter.
            </p>
          </div>
        ) : (
          <div className="table-responsive logs-table-wrap">
            <table className="results-table logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Prediction Type</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log, index) => {
                  const severity = getSeverity(
                    log.confidence,
                    log.label
                  )
                  const labelClass = (log.label || "").toLowerCase()
                  const isCritical = severity.className === "critical"

                  return (
                    <tr
                      key={`${log.timestamp}-${log.source}-${index}`}
                      className={`logs-table-row ${
                        isCritical ? "critical-row" : ""
                      }`}
                    >
                      <td>{log.timestamp}</td>
                      <td>{log.source}</td>
                      <td>
                        <span className={`badge ${labelClass}`}>
                          {log.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`severity-badge ${severity.className}`}
                        >
                          {severity.label}
                        </span>
                      </td>
                      <td>
                        {(Number(log.confidence) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
