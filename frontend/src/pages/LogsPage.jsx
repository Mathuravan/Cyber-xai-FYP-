import { useEffect, useState } from "react"

import {
  getAttackLogs,
  clearAttackLogs,
} from "../services/storageService"

const FILTER_OPTIONS = [
  { value: "all", label: "All Logs" },
  { value: "attack", label: "Attack Only" },
  { value: "normal", label: "Normal Only" },
  { value: "high_confidence", label: "High Confidence (>80%)" },
]

function getSeverity(confidence) {
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
    (log) => Number(log.confidence) >= 0.9
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

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    setLogs(getAttackLogs())
  }, [])

  const filteredLogs = filterLogs(logs, searchQuery, filterType)
  const analytics = getLogAnalytics(filteredLogs)

  const latestAttack =
    logs.length > 0 ? logs[0].timestamp : "No logs"

  const hasActiveSearchOrFilter =
    searchQuery.trim() !== "" || filterType !== "all"

  const handleClearLogs = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all attack logs?"
    )

    if (!confirmed) return

    clearAttackLogs()
    setLogs([])
    setSearchQuery("")
    setFilterType("all")
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="predict-page">
      <div className="topbar logs-header">
        <div>
          <h1>Attack Logs</h1>
          <p>
            Search, filter, and analyze saved intrusion
            detection history.
          </p>
        </div>

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

      <div className="panel dashboard-panel logs-controls-panel">
        <h2 className="page-title">Threat Log Controls</h2>
        <p className="page-subtitle">
          Search by label, timestamp, or source. Filter by threat type
          or confidence.
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
        <h2>Recent Threats</h2>

        {logs.length === 0 ? (
          <div className="empty-state">
            <p>
              No attack logs found. The system is currently secure.
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
                  <th>Threat Type</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log, index) => {
                  const severity = getSeverity(log.confidence)
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
