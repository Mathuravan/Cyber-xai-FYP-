import { useMemo, useState } from "react"
import { explainCombined } from "../services/predictionService"
import { saveXaiSummary } from "../services/storageService"
import "../styles/xai-comparison.css"

// ── Constants ──────────────────────────────────────────────────────────────
const FEATURE_META = [
  {
    key: "duration",
    label: "Duration",
    placeholder: "0",
    hint: "Connection duration (seconds)",
    icon: "⏱",
  },
  {
    key: "src_bytes",
    label: "Source Bytes",
    placeholder: "491",
    hint: "Bytes sent from source",
    icon: "📤",
  },
  {
    key: "dst_bytes",
    label: "Destination Bytes",
    placeholder: "0",
    hint: "Bytes received at destination",
    icon: "📥",
  },
  {
    key: "count",
    label: "Count",
    placeholder: "2",
    hint: "Connections to the same host",
    icon: "🔗",
  },
]

const EMPTY_FORM = { duration: "", src_bytes: "", dst_bytes: "", count: "" }

const QUICK_PRESETS = [
  { label: "Normal Traffic", values: { duration: 10, src_bytes: 300, dst_bytes: 200, count: 3 } },
  { label: "Port Scan", values: { duration: 0, src_bytes: 0, dst_bytes: 0, count: 123 } },
  { label: "Data Exfil", values: { duration: 2, src_bytes: 45000, dst_bytes: 0, count: 1 } },
  { label: "DoS Attack", values: { duration: 0, src_bytes: 1032, dst_bytes: 0, count: 255 } },
]

const FEATURE_LABELS = {
  duration: "Duration",
  src_bytes: "Source Bytes",
  dst_bytes: "Dest. Bytes",
  count: "Count",
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function normalise(values) {
  const max = Math.max(...Object.values(values).map(Math.abs), 0.001)
  const result = {}
  for (const [k, v] of Object.entries(values)) {
    result[k] = { raw: v, pct: Math.round((Math.abs(v) / max) * 100) }
  }
  return result
}

// Positive = red (suspicious), Negative = green (safe)
function barColor(value) {
  return value >= 0 ? "#ef4444" : "#22c55e"
}

function FeatureBar({ label, value, pct, showLabel }) {
  const color = barColor(value)
  const sign = value >= 0 ? "+" : ""
  return (
    <div className="xai-bar-row">
      {showLabel && (
        <span className="xai-bar-label">{label}</span>
      )}
      <div className="xai-bar-track">
        <div
          className="xai-bar-fill"
          style={{ width: `${pct}%`, background: color }}
          title={`${sign}${value.toFixed(4)}`}
        />
      </div>
      <span className="xai-bar-value" style={{ color }}>
        {sign}{value.toFixed(4)}
      </span>
    </div>
  )
}

function buildXaiAnalytics(data) {
  const features = Object.keys(data.shap_values || {})
  const rankedFeatures = features.map((feature) => {
    const shap = Number(data.shap_values[feature] || 0)
    const lime = Number(data.lime_values[feature] || 0)
    const agrees = (shap >= 0) === (lime >= 0)

    return {
      feature,
      label: FEATURE_LABELS[feature] || feature,
      shap,
      lime,
      agrees,
      combinedStrength: Math.abs(shap) + Math.abs(lime),
      dominant: Math.abs(shap) >= Math.abs(lime) ? "SHAP" : "LIME",
    }
  }).sort((a, b) => b.combinedStrength - a.combinedStrength)

  const matchingCount = rankedFeatures.filter((feature) => feature.agrees).length
  const agreementScore = features.length
    ? Math.round((matchingCount / features.length) * 100)
    : 0

  return {
    agreementScore,
    explanationConfidence: Math.round(
      ((Number(data.prediction?.confidence) || 0) * 0.7 +
        (agreementScore / 100) * 0.3) *
        100
    ),
    matchingCount,
    conflictingCount: rankedFeatures.length - matchingCount,
    rankedFeatures,
  }
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function XaiComparison() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const applyPreset = (values) => {
    setForm({ ...values })
    setError("")
    setResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const payload = {
        duration: Number(form.duration),
        src_bytes: Number(form.src_bytes),
        dst_bytes: Number(form.dst_bytes),
        count: Number(form.count),
      }

      if (Object.values(payload).some(Number.isNaN)) {
        throw new Error("Please enter valid numeric values for all fields.")
      }

      const data = await explainCombined(payload)
      const analytics = buildXaiAnalytics(data)
      const enriched = {
        ...data,
        xai_analytics: analytics,
      }

      setResult(enriched)
      saveXaiSummary({
        prediction: data.prediction,
        agreementScore: analytics.agreementScore,
        explanationConfidence: analytics.explanationConfidence,
        matchingCount: analytics.matchingCount,
        conflictingCount: analytics.conflictingCount,
        topFeatures: analytics.rankedFeatures.slice(0, 4),
      })
    } catch (err) {
      setError(err.message || "Explanation request failed. Ensure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  // Normalised SHAP & LIME for bar rendering
  const shapNorm = result ? normalise(result.shap_values) : null
  const limeNorm = result ? normalise(result.lime_values) : null
  const features = result ? Object.keys(result.shap_values) : []

  const predLabel = result?.prediction?.label
  const predConf  = result?.prediction?.confidence
  const xaiAnalytics = result?.xai_analytics
  const rankedFeatures = useMemo(
    () => xaiAnalytics?.rankedFeatures || [],
    [xaiAnalytics]
  )

  return (
    <div className="xai-page">
      {/* ── Header ── */}
      <div className="xai-header">
        <div className="xai-header-badge">🔬 Dual-Framework</div>
        <h1 className="xai-title">XAI Benchmarking</h1>
        <p className="xai-subtitle">
          Enter network traffic metrics to simultaneously compute{" "}
          <strong>SHAP</strong> and <strong>LIME</strong> feature attributions
          side-by-side and compare how each explainability framework interprets
          the model decision.
        </p>
      </div>

      {/* ── Input Panel ── */}
      <div className="xai-card xai-input-card">
        <h2 className="xai-card-title">
          <span className="xai-card-icon">⚙️</span>
          Network Traffic Parameters
        </h2>

        {/* Quick Presets */}
        <div className="xai-presets">
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="xai-preset-btn"
              onClick={() => applyPreset(p.values)}
              disabled={loading}
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="xai-form">
          <div className="xai-form-grid">
            {FEATURE_META.map((f) => (
              <div key={f.key} className="xai-form-group">
                <label className="xai-label" htmlFor={`xai-${f.key}`}>
                  <span className="xai-label-icon">{f.icon}</span>
                  {f.label}
                </label>
                <input
                  id={`xai-${f.key}`}
                  name={f.key}
                  type="number"
                  min="0"
                  step="any"
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="xai-input"
                />
                <span className="xai-input-hint">{f.hint}</span>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="xai-run-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="xai-spinner-wrap">
                <span className="xai-spinner" />
                Computing explanations…
              </span>
            ) : (
              "⚡ Run Dual-XAI Analysis"
            )}
          </button>
        </form>

        {error && <p className="xai-error">{error}</p>}
      </div>

      {/* ── Results ── */}
      {result && (
        <>
          <div className="xai-metric-grid">
            <article className="xai-metric-card">
              <span>Agreement Score</span>
              <strong>{xaiAnalytics.agreementScore}%</strong>
              <small>{xaiAnalytics.matchingCount} matching feature directions</small>
            </article>

            <article className="xai-metric-card">
              <span>Explanation Confidence</span>
              <strong>{xaiAnalytics.explanationConfidence}%</strong>
              <small>Prediction confidence plus method agreement</small>
            </article>

            <article className="xai-metric-card conflict">
              <span>Conflicting Explanations</span>
              <strong>{xaiAnalytics.conflictingCount}</strong>
              <small>SHAP and LIME direction mismatches</small>
            </article>
          </div>

          {/* Prediction Banner */}
          <div className={`xai-pred-banner ${predLabel === "Attack" ? "xai-banner-attack" : "xai-banner-normal"}`}>
            <div className="xai-pred-label">
              <span className="xai-pred-dot" />
              {predLabel}
            </div>
            <div className="xai-pred-conf">
              Confidence: <strong>{(predConf * 100).toFixed(1)}%</strong>
            </div>
            <div className="xai-pred-tagline">
              {predLabel === "Attack"
                ? "Malicious traffic detected — review feature attributions below."
                : "Traffic appears benign — attributions show contributing factors."}
            </div>
          </div>

          {/* Side-by-Side Charts */}
          <div className="xai-charts-row">
            {/* SHAP Panel */}
            <div className="xai-chart-panel">
              <div className="xai-chart-header shap-header">
                <div className="xai-chart-badge shap-badge">SHAP</div>
                <h3 className="xai-chart-title">
                  SHapley Additive Explanations
                </h3>
                <p className="xai-chart-desc">
                  Heuristic feature scores derived from decision-tree split
                  patterns. Positive = push toward Attack; Negative = push
                  toward Normal.
                </p>
              </div>

              <div className="xai-chart-bars">
                {features.map((feat) => (
                  <FeatureBar
                    key={feat}
                    label={FEATURE_LABELS[feat] || feat}
                    value={result.shap_values[feat]}
                    pct={shapNorm[feat].pct}
                    showLabel
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="xai-legend">
                <span className="xai-legend-item">
                  <span className="xai-legend-dot red" />
                  Increases attack probability
                </span>
                <span className="xai-legend-item">
                  <span className="xai-legend-dot green" />
                  Reduces attack probability
                </span>
              </div>
            </div>

            {/* LIME Panel */}
            <div className="xai-chart-panel">
              <div className="xai-chart-header lime-header">
                <div className="xai-chart-badge lime-badge">LIME</div>
                <h3 className="xai-chart-title">
                  Local Interpretable Model-agnostic Explanations
                </h3>
                <p className="xai-chart-desc">
                  Linear approximation of the model locally around this input.
                  Weights indicate how much each feature nudges the prediction
                  for this specific data point.
                </p>
              </div>

              <div className="xai-chart-bars">
                {features.map((feat) => (
                  <FeatureBar
                    key={feat}
                    label={FEATURE_LABELS[feat] || feat}
                    value={result.lime_values[feat]}
                    pct={limeNorm[feat].pct}
                    showLabel
                  />
                ))}
              </div>

              <div className="xai-legend">
                <span className="xai-legend-item">
                  <span className="xai-legend-dot red" />
                  Increases attack probability
                </span>
                <span className="xai-legend-item">
                  <span className="xai-legend-dot green" />
                  Reduces attack probability
                </span>
              </div>
            </div>
          </div>

          {/* Agreement Table */}
          <div className="xai-card xai-agree-card">
            <h2 className="xai-card-title">
              <span className="xai-card-icon">📊</span>
              Framework Comparison Table
            </h2>
            <div className="xai-table-wrap">
              <table className="xai-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>SHAP Score</th>
                    <th>LIME Weight</th>
                    <th>Direction Agreement</th>
                    <th>Dominant Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feat) => {
                    const sv = result.shap_values[feat]
                    const lv = result.lime_values[feat]
                    const agree = (sv >= 0) === (lv >= 0)
                    const dominant = Math.abs(sv) >= Math.abs(lv) ? "SHAP" : "LIME"
                    return (
                      <tr key={feat} className={agree ? "xai-row-match" : "xai-row-conflict"}>
                        <td className="xai-table-feat">{FEATURE_LABELS[feat] || feat}</td>
                        <td style={{ color: barColor(sv) }}>
                          {sv >= 0 ? "+" : ""}{sv.toFixed(4)}
                        </td>
                        <td style={{ color: barColor(lv) }}>
                          {lv >= 0 ? "+" : ""}{lv.toFixed(4)}
                        </td>
                        <td>
                          <span className={`xai-agree-pill ${agree ? "agree" : "disagree"}`}>
                            {agree ? "✓ Agree" : "✗ Disagree"}
                          </span>
                        </td>
                        <td>
                          <span className={`xai-dom-pill ${dominant === "SHAP" ? "shap-dom" : "lime-dom"}`}>
                            {dominant}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xai-card xai-ranking-card">
            <h2 className="xai-card-title">Top Contributing Features</h2>
            <div className="xai-ranking-list">
              {rankedFeatures.map((feature, index) => (
                <div
                  key={feature.feature}
                  className={`xai-ranking-row ${feature.agrees ? "match" : "conflict"}`}
                >
                  <span className="xai-rank-number">{index + 1}</span>
                  <span className="xai-rank-feature">{feature.label}</span>
                  <span>SHAP {feature.shap >= 0 ? "+" : ""}{feature.shap.toFixed(4)}</span>
                  <span>LIME {feature.lime >= 0 ? "+" : ""}{feature.lime.toFixed(4)}</span>
                  <strong>{feature.agrees ? "Matching" : "Conflicting"}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
