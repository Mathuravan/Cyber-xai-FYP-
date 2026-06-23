import { useMemo, useState } from "react"

import {
  getAttackLogs,
  getThreatSeverityLabel,
} from "../services/storageService"

const STATUS_KEY = "cyberxai_notification_read_status"

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

function getStoredReadStatus() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveReadStatus(status) {
  localStorage.setItem(STATUS_KEY, JSON.stringify(status))
}

function createNotificationId(log) {
  return [
    log.timestamp || "unknown-time",
    log.source || "unknown-source",
    log.label || "unknown-threat",
    log.confidence ?? "unknown-confidence",
  ].join("|")
}

function getSeverityClass(confidence) {
  return getThreatSeverityLabel(confidence).toLowerCase()
}

function formatConfidence(confidence) {
  const value = Number(confidence)

  if (Number.isNaN(value)) {
    return "0.0%"
  }

  return `${(value * 100).toFixed(1)}%`
}

function mapLogsToNotifications(logs, readStatus) {
  return logs.map((log) => {
    const id = createNotificationId(log)
    const severity = getThreatSeverityLabel(log.confidence)

    return {
      id,
      timestamp: log.timestamp || "Unknown timestamp",
      threatLabel: log.label || "Unknown threat",
      confidence: Number(log.confidence) || 0,
      confidenceLabel: formatConfidence(log.confidence),
      severity,
      severityClass: severity.toLowerCase(),
      source: log.source || "CyberXAI detector",
      isRead: Boolean(readStatus[id]),
    }
  })
}

function getNotificationCounts(notifications) {
  return notifications.reduce(
    (counts, notification) => {
      counts.total += 1

      if (notification.severityClass === "critical") {
        counts.critical += 1
      }

      if (!notification.isRead) {
        counts.unread += 1
      }

      return counts
    },
    { total: 0, critical: 0, unread: 0 }
  )
}

function getSeverityCounts(notifications) {
  return notifications.reduce(
    (counts, notification) => {
      counts[notification.severityClass] += 1
      return counts
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  )
}

function filterNotifications(notifications, activeFilter, searchQuery) {
  const query = searchQuery.trim().toLowerCase()

  return notifications.filter((notification) => {
    const matchesSeverity =
      activeFilter === "all" ||
      notification.severityClass === activeFilter

    if (!matchesSeverity) {
      return false
    }

    if (!query) {
      return true
    }

    return (
      notification.threatLabel.toLowerCase().includes(query) ||
      notification.timestamp.toLowerCase().includes(query)
    )
  })
}

export default function Notifications() {
  const [logs] = useState(() => getAttackLogs())
  const [readStatus, setReadStatus] = useState(() => getStoredReadStatus())
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const notifications = useMemo(
    () => mapLogsToNotifications(logs, readStatus),
    [logs, readStatus]
  )

  const counts = useMemo(
    () => getNotificationCounts(notifications),
    [notifications]
  )

  const severityCounts = useMemo(
    () => getSeverityCounts(notifications),
    [notifications]
  )

  const filteredNotifications = useMemo(
    () =>
      filterNotifications(
        notifications,
        activeFilter,
        searchQuery
      ),
    [notifications, activeFilter, searchQuery]
  )

  const handleMarkAllAsRead = () => {
    const nextReadStatus = notifications.reduce((status, item) => {
      status[item.id] = true
      return status
    }, {})

    setReadStatus(nextReadStatus)
    saveReadStatus(nextReadStatus)
  }

  const hasActiveSearchOrFilter =
    activeFilter !== "all" || searchQuery.trim() !== ""

  return (
    <div className="predict-page notifications-page">
      <div className="topbar logs-header notifications-header">
        <div>
          <h1>Security Notifications</h1>
          <p>
            Centralized alert monitoring for CyberXAI threat
            detections.
          </p>
        </div>

        <button
          type="button"
          className="btn notifications-read-btn"
          onClick={handleMarkAllAsRead}
          disabled={notifications.length === 0 || counts.unread === 0}
        >
          Mark All as Read
        </button>
      </div>

      <div className="summary-cards notifications-summary">
        <div className="card">
          <h3>Total Alerts</h3>
          <p className="card-value">{counts.total}</p>
        </div>

        <div className="card critical-card">
          <h3>Critical Alerts</h3>
          <p className="card-value attack">{counts.critical}</p>
        </div>

        <div className="card">
          <h3>Unread Alerts</h3>
          <p className="card-value">{counts.unread}</p>
        </div>
      </div>

      <div className="summary-cards notification-severity-grid">
        <div className="card notification-severity-card critical">
          <h3>Critical Alerts</h3>
          <p className="card-value attack">
            {severityCounts.critical}
          </p>
        </div>

        <div className="card notification-severity-card high">
          <h3>High Severity Alerts</h3>
          <p className="card-value attack">{severityCounts.high}</p>
        </div>

        <div className="card notification-severity-card medium">
          <h3>Medium Severity Alerts</h3>
          <p className="card-value">{severityCounts.medium}</p>
        </div>

        <div className="card notification-severity-card low">
          <h3>Low Severity Alerts</h3>
          <p className="card-value normal">{severityCounts.low}</p>
        </div>
      </div>

      <div className="panel dashboard-panel notifications-controls-panel">
        <h2 className="page-title">Alert Controls</h2>
        <p className="page-subtitle">
          Filter by severity or search by threat label and timestamp.
        </p>

        <div className="logs-toolbar">
          <div className="logs-search-group">
            <input
              type="search"
              className="logs-search-input"
              placeholder="Search threat label or timestamp..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />

            {searchQuery && (
              <button
                type="button"
                className="btn secondary-btn logs-clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </button>
            )}
          </div>

          <div className="notifications-filter-tabs">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`notification-filter-tab ${
                  activeFilter === option.value ? "active" : ""
                }`}
                onClick={() => setActiveFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {notifications.length > 0 && (
          <p className="logs-filter-hint">
            Showing {filteredNotifications.length} of{" "}
            {notifications.length} alert
            {notifications.length === 1 ? "" : "s"}
            {hasActiveSearchOrFilter ? " (filtered)" : ""}
          </p>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="panel dashboard-panel empty-state">
            <p>
              No security notifications found. Run predictions to
              populate CyberXAI attack logs.
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="panel dashboard-panel empty-state">
            <p>
              No alerts match your current filter or search term.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <article
              key={`${notification.id}-${index}`}
              className={`notification-card ${
                notification.severityClass
              } ${notification.isRead ? "read" : "unread"}`}
            >
              <div className="notification-card-main">
                <div className="notification-title-row">
                  <span
                    className={`severity-badge ${getSeverityClass(
                      notification.confidence
                    )}`}
                  >
                    {notification.severity}
                  </span>

                  {!notification.isRead && (
                    <span className="notification-unread-dot">
                      Unread
                    </span>
                  )}
                </div>

                <h3>{notification.threatLabel}</h3>
                <p>{notification.source}</p>
              </div>

              <div className="notification-card-meta">
                <div>
                  <span>Timestamp</span>
                  <strong>{notification.timestamp}</strong>
                </div>

                <div>
                  <span>Confidence Score</span>
                  <strong>{notification.confidenceLabel}</strong>
                </div>

                <div>
                  <span>Severity Level</span>
                  <strong>{notification.severity}</strong>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
