import { useEffect, useMemo, useState } from "react"

import {
  getAttackLogs,
  getPredictionHistory,
  getThreatSeverityLabel,
} from "../services/storageService"

const REFRESH_INTERVAL_MS = 5000
const TIMELINE_BUCKET_LIMIT = 12
const TOP_SOURCE_LIMIT = 5
const LIVE_FEED_LIMIT = 10

function isAttack(record) {
  return (record.label || "").toLowerCase() === "attack"
}

function isNormal(record) {
  return (record.label || "").toLowerCase() === "normal"
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function formatConfidence(confidence) {
  return formatPercent((Number(confidence) || 0) * 100)
}

function getDateLabel(timestamp) {
  const parsed = new Date(timestamp)

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  return String(timestamp || "Unknown").split(",")[0] || "Unknown"
}

function getTimeLabel(timestamp) {
  const parsed = new Date(timestamp)

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return String(timestamp || "Unknown")
}

function getSeverityClass(confidence) {
  return getThreatSeverityLabel(confidence).toLowerCase()
}

function buildTimeline(history) {
  const buckets = new Map()

  history.forEach((record) => {
    const label = getDateLabel(record.timestamp)
    const bucket = buckets.get(label) || {
      label,
      attacks: 0,
      normal: 0,
      order: buckets.size,
    }

    if (isAttack(record)) {
      bucket.attacks += 1
    } else if (isNormal(record)) {
      bucket.normal += 1
    }

    buckets.set(label, bucket)
  })

  return Array.from(buckets.values())
    .sort((a, b) => a.order - b.order)
    .slice(-TIMELINE_BUCKET_LIMIT)
}

function buildSeverityDistribution(attackLogs) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  attackLogs.forEach((log) => {
    counts[getSeverityClass(log.confidence)] += 1
  })

  return [
    { key: "critical", label: "Critical", value: counts.critical },
    { key: "high", label: "High", value: counts.high },
    { key: "medium", label: "Medium", value: counts.medium },
    { key: "low", label: "Low", value: counts.low },
  ]
}

function buildTopSources(attackLogs) {
  const sourceCounts = new Map()

  attackLogs.forEach((log) => {
    const source = log.source || "Unknown source"
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1)
  })

  return Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_SOURCE_LIMIT)
}

function calculateAnalytics(attackLogs, history) {
  const totalPredictions = history.length
  const totalAttacks = history.filter(isAttack).length
  const totalNormal = history.filter(isNormal).length
  const attackRate =
    totalPredictions > 0
      ? (totalAttacks / totalPredictions) * 100
      : 0

  const criticalThreatCount = attackLogs.filter(
    (log) => getSeverityClass(log.confidence) === "critical"
  ).length

  return {
    totalPredictions,
    totalAttacks,
    totalNormal,
    attackRate,
    criticalThreatCount,
    activeThreatCount: attackLogs.length,
  }
}

function TimelineChart({ data }) {
  const maxValue = Math.max(
    1,
    ...data.map((item) => item.attacks + item.normal)
  )

  if (!data.length) {
    return (
      <div className="threat-viz-empty">
        No prediction timeline data available.
      </div>
    )
  }

  return (
    <div className="threat-timeline-chart">
      {data.map((item) => {
        const attackHeight = `${Math.max(
          4,
          (item.attacks / maxValue) * 100
        )}%`
        const normalHeight = `${Math.max(
          4,
          (item.normal / maxValue) * 100
        )}%`

        return (
          <div className="timeline-column" key={item.label}>
            <div className="timeline-bars">
              <span
                className="timeline-bar attack"
                style={{ height: attackHeight }}
                title={`${item.attacks} attacks`}
              />
              <span
                className="timeline-bar normal"
                style={{ height: normalHeight }}
                title={`${item.normal} normal`}
              />
            </div>
            <span className="timeline-label">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function HorizontalBars({ data, valueKey, labelKey, classNamePrefix }) {
  const maxValue = Math.max(1, ...data.map((item) => item[valueKey]))

  if (!data.length || data.every((item) => item[valueKey] === 0)) {
    return (
      <div className="threat-viz-empty">
        No chart data available yet.
      </div>
    )
  }

  return (
    <div className="viz-horizontal-bars">
      {data.map((item) => (
        <div className="viz-bar-row" key={item[labelKey]}>
          <div className="viz-bar-label">
            <span>{item[labelKey]}</span>
            <strong>{item[valueKey]}</strong>
          </div>
          <div className="viz-bar-track">
            <span
              className={`viz-bar-fill ${classNamePrefix}-${item.key || "item"}`}
              style={{
                width: `${Math.max(
                  4,
                  (item[valueKey] / maxValue) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, tone, meta }) {
  return (
    <div className={`threat-stat-card ${tone || ""}`}>
      <h3>{label}</h3>
      <p>{value}</p>
      {meta && <span>{meta}</span>}
    </div>
  )
}

export default function ThreatVisualization() {
  const [attackLogs, setAttackLogs] = useState([])
  const [predictionHistory, setPredictionHistory] = useState([])
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const refreshData = () => {
      setAttackLogs(getAttackLogs())
      setPredictionHistory(getPredictionHistory())
      setLastUpdated(new Date())
    }

    refreshData()

    const timer = setInterval(refreshData, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const analytics = useMemo(
    () => calculateAnalytics(attackLogs, predictionHistory),
    [attackLogs, predictionHistory]
  )

  const timelineData = useMemo(
    () => buildTimeline(predictionHistory),
    [predictionHistory]
  )

  const severityData = useMemo(
    () => buildSeverityDistribution(attackLogs),
    [attackLogs]
  )

  const topSources = useMemo(
    () => buildTopSources(attackLogs),
    [attackLogs]
  )

  const trendData = useMemo(
    () => [
      {
        key: "attack",
        label: "Attack Traffic",
        value: analytics.totalAttacks,
      },
      {
        key: "normal",
        label: "Normal Traffic",
        value: analytics.totalNormal,
      },
    ],
    [analytics.totalAttacks, analytics.totalNormal]
  )

  const liveThreats = useMemo(
    () => attackLogs.slice(0, LIVE_FEED_LIMIT),
    [attackLogs]
  )

  return (
    <div className="predict-page threat-viz-page">
      <div className="topbar threat-viz-topbar">
        <div>
          <h1>Threat Visualization</h1>
          <p>
            Interactive threat intelligence views powered by stored
            CyberXAI prediction logs.
          </p>
        </div>

        <div className="threat-viz-refresh">
          <span className="live-indicator-dot" />
          <div>
            <strong>Live refresh</strong>
            <span>{lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="threat-stats-grid">
        <StatCard
          label="Total Predictions"
          value={analytics.totalPredictions}
          meta="All stored prediction records"
        />
        <StatCard
          label="Total Attacks"
          value={analytics.totalAttacks}
          tone="danger"
          meta="Attack labels in history"
        />
        <StatCard
          label="Attack Rate"
          value={formatPercent(analytics.attackRate)}
          tone="warning"
          meta="Attacks / total predictions"
        />
        <StatCard
          label="Critical Threat Count"
          value={analytics.criticalThreatCount}
          tone="critical"
          meta="Confidence at 90% or higher"
        />
        <StatCard
          label="Active Threat Count"
          value={analytics.activeThreatCount}
          tone="active"
          meta="Stored attack log entries"
        />
      </div>

      <div className="threat-viz-grid">
        <section className="panel dashboard-panel threat-viz-panel threat-viz-panel-wide">
          <div className="threat-viz-panel-header">
            <div>
              <h2 className="page-title">Threat Timeline</h2>
              <p className="page-subtitle">
                Attack activity over time compared with normal traffic.
              </p>
            </div>
            <div className="chart-legend">
              <span className="legend-item attack">Attacks</span>
              <span className="legend-item normal">Normal</span>
            </div>
          </div>

          <TimelineChart data={timelineData} />
        </section>

        <section className="panel dashboard-panel threat-viz-panel">
          <h2 className="page-title">Severity Distribution</h2>
          <p className="page-subtitle">
            Critical, high, medium, and low severity attack logs.
          </p>
          <HorizontalBars
            data={severityData}
            valueKey="value"
            labelKey="label"
            classNamePrefix="severity"
          />
        </section>

        <section className="panel dashboard-panel threat-viz-panel">
          <h2 className="page-title">Attack vs Normal Trend</h2>
          <p className="page-subtitle">
            Total attack and normal traffic in stored predictions.
          </p>
          <HorizontalBars
            data={trendData}
            valueKey="value"
            labelKey="label"
            classNamePrefix="trend"
          />
        </section>

        <section className="panel dashboard-panel threat-viz-panel">
          <h2 className="page-title">Top Threat Sources</h2>
          <p className="page-subtitle">
            Most frequent sources found in attack logs.
          </p>
          <HorizontalBars
            data={topSources}
            valueKey="count"
            labelKey="source"
            classNamePrefix="source"
          />
        </section>

        <section className="panel dashboard-panel threat-viz-panel live-feed-panel">
          <div className="threat-viz-panel-header">
            <div>
              <h2 className="page-title">Live Threat Feed</h2>
              <p className="page-subtitle">
                Latest 10 threats, refreshed every 5 seconds.
              </p>
            </div>
          </div>

          {liveThreats.length === 0 ? (
            <div className="threat-viz-empty">
              No live threats available.
            </div>
          ) : (
            <ul className="threat-feed-list">
              {liveThreats.map((threat, index) => {
                const severityClass = getSeverityClass(threat.confidence)

                return (
                  <li
                    className={`threat-feed-item ${severityClass}`}
                    key={`${threat.timestamp}-${threat.source}-${index}`}
                  >
                    <div className="threat-feed-main">
                      <span className="threat-feed-time">
                        {getTimeLabel(threat.timestamp)}
                      </span>
                      <strong>{threat.label || "Attack"}</strong>
                      <span>{threat.source || "Unknown source"}</span>
                    </div>
                    <div className="threat-feed-meta">
                      <span className={`severity-badge ${severityClass}`}>
                        {getThreatSeverityLabel(threat.confidence)}
                      </span>
                      <strong>{formatConfidence(threat.confidence)}</strong>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
