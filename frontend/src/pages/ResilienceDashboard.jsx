import { useMemo, useState } from "react"
import { testResilience } from "../services/predictionService"
import { saveResilienceSummary } from "../services/storageService"
import "../styles/resilience.css"

const FEATURES = [
  { key: "duration", label: "Duration", placeholder: "0" },
  { key: "src_bytes", label: "Source Bytes", placeholder: "491" },
  { key: "dst_bytes", label: "Destination Bytes", placeholder: "0" },
  { key: "count", label: "Count", placeholder: "2" },
]

const EMPTY_FORM = {
  duration: "",
  src_bytes: "",
  dst_bytes: "",
  count: "",
}

const PRESETS = [
  {
    label: "Normal",
    values: { duration: 10, src_bytes: 300, dst_bytes: 200, count: 3 },
  },
  {
    label: "Scan",
    values: { duration: 0, src_bytes: 0, dst_bytes: 0, count: 123 },
  },
  {
    label: "Exfil",
    values: { duration: 2, src_bytes: 45076, dst_bytes: 0, count: 1 },
  },
]

function formatValue(value) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return "-"
  }

  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

function getMetricTone(value) {
  if (value >= 90) {
    return "ok"
  }

  if (value >= 70) {
    return "warn"
  }

  return "bad"
}

export default function ResilienceDashboard() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const baseline = result?.baseline
  const states = useMemo(
    () => result?.states || [],
    [result]
  )

  const boundaryCount = useMemo(() => {
    if (!states.length) {
      return 0
    }

    return states.filter((state) => state.ood_flag).length
  }, [states])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const applyPreset = (values) => {
    setForm({ ...values })
    setResult(null)
    setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
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
        throw new Error("Enter valid numeric values for all features.")
      }

      const data = await testResilience(payload)
      setResult(data)
      saveResilienceSummary({
        modelStabilityIndex: data.model_stability_index,
        attackSuccessRate: data.attack_success_rate,
        resistanceScore: data.resistance_score,
        easiestFeature: data.easiest_feature_to_manipulate,
        featureSensitivityRanking: data.feature_sensitivity_ranking,
        trackSummary: data.track_summary,
      })
    } catch (err) {
      setError(err.message || "Resilience test failed. Check the backend service.")
    } finally {
      setLoading(false)
    }
  }

  const stability = result?.model_stability_index ?? 0
  const attackSuccessRate = result?.attack_success_rate ?? 0
  const resistanceScore = result?.resistance_score ?? 0
  const consistency = result?.prediction_consistency ?? 0
  const baselineLabel = baseline?.prediction?.label || "Awaiting test"
  const oodStatus = result?.ood_distribution_status || "Awaiting test"

  return (
    <div className="resilience-page">
      <div className="resilience-header">
        <span className="resilience-eyebrow">Robustness Evaluation</span>
        <h1>Model Resilience Testing</h1>
        <p>
          Stress-test the four-feature NSL-KDD model against poisoning,
          evasion, and out-of-distribution distortions.
        </p>
      </div>

      <section className="resilience-metrics">
        <article className={`resilience-metric ${getMetricTone(stability)}`}>
          <span>Model Stability Index</span>
          <strong>{result ? `${stability}%` : "--"}</strong>
          <small>Track-level resistance</small>
        </article>

        <article className={`resilience-metric ${getMetricTone(resistanceScore)}`}>
          <span>Resistance Score</span>
          <strong>{result ? `${resistanceScore}%` : "--"}</strong>
          <small>Scenario-level resistance</small>
        </article>

        <article className={`resilience-metric ${attackSuccessRate > 10 ? "bad" : attackSuccessRate > 0 ? "warn" : "ok"}`}>
          <span>Attack Success Rate</span>
          <strong>{result ? `${attackSuccessRate}%` : "--"}</strong>
          <small>Simulations that flipped prediction</small>
        </article>

        <article className={`resilience-metric ${oodStatus.includes("Out") ? "warn" : "ok"}`}>
          <span>OOD Distribution Status</span>
          <strong>{oodStatus}</strong>
          <small>Baseline: {baselineLabel}</small>
        </article>
      </section>

      <section className="resilience-panel">
        <div className="resilience-panel-header">
          <div>
            <h2>Traffic Feature Vector</h2>
            <p>Enter the raw feature values used as the baseline state.</p>
          </div>

          <div className="resilience-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.values)}
                disabled={loading}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form className="resilience-form" onSubmit={handleSubmit}>
          <div className="resilience-form-grid">
            {FEATURES.map((feature) => (
              <label key={feature.key} className="resilience-field">
                <span>{feature.label}</span>
                <input
                  name={feature.key}
                  type="number"
                  min="0"
                  step="any"
                  placeholder={feature.placeholder}
                  value={form[feature.key]}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </label>
            ))}
          </div>

          <button className="resilience-submit" type="submit" disabled={loading}>
            {loading ? "Running resilience test..." : "Run Resilience Test"}
          </button>
        </form>

        {error && <p className="resilience-error">{error}</p>}
      </section>

      {result && (
        <section className="resilience-panel">
          <div className="resilience-sensitivity-grid">
            <article className="resilience-sensitivity-card">
              <span>Prediction Consistency</span>
              <strong>{consistency}%</strong>
              <small>States matching baseline</small>
            </article>
            <article className="resilience-sensitivity-card">
              <span>Input Distortion Boundary</span>
              <strong>{boundaryCount}</strong>
              <small>OOD flagged states</small>
            </article>
            <article className="resilience-sensitivity-card">
              <span>Easiest Feature To Manipulate</span>
              <strong>{result.easiest_feature_to_manipulate}</strong>
              <small>Based on gradient flip sensitivity</small>
            </article>
          </div>

          <div className="resilience-panel-header">
            <div>
              <h2>Feature Sensitivity Ranking</h2>
              <p>Higher scores indicate a feature flipped more often or with less movement.</p>
            </div>
          </div>

          <div className="resilience-ranking-list">
            {result.feature_sensitivity_ranking?.map((item, index) => (
              <div key={item.feature} className="resilience-ranking-row">
                <span>{index + 1}</span>
                <strong>{item.feature}</strong>
                <small>Flips {item.flip_count}/{item.tested_states}</small>
                <small>First flip {item.first_flip_step_percent ? `${item.first_flip_step_percent}%` : "None"}</small>
                <div className="resilience-ranking-bar">
                  <div style={{ width: `${Math.min(item.sensitivity_score, 100)}%` }} />
                </div>
                <b>{item.sensitivity_score}%</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section className="resilience-panel">
          <div className="resilience-panel-header">
            <div>
              <h2>Comparative State Grid</h2>
              <p>
                Green rows held the baseline classification. Red rows indicate
                a simulated classification flip.
              </p>
            </div>

            <span className="resilience-baseline-pill">
              Baseline {baseline.prediction.label} ({(baseline.prediction.confidence * 100).toFixed(1)}%)
            </span>
          </div>

          <div className="resilience-table-wrap">
            <table className="resilience-table">
              <thead>
                <tr>
                  <th>Track</th>
                  <th>Scenario</th>
                  <th>Status</th>
                  <th>Prediction</th>
                  {FEATURES.map((feature) => (
                    <th key={feature.key}>{feature.label}</th>
                  ))}
                  <th>OOD</th>
                </tr>
              </thead>
              <tbody>
                {states.map((state, index) => (
                  <tr
                    key={`${state.track}-${state.scenario}-${index}`}
                    className={state.flipped ? "bg-red-50" : "bg-green-50"}
                  >
                    <td>{state.track}</td>
                    <td>
                      <strong>{state.scenario}</strong>
                      <span>{state.distortion}</span>
                    </td>
                    <td>
                      <span className={`resilience-status ${state.flipped ? "subverted" : "held"}`}>
                        {state.flipped ? "Subverted" : "Held Firm"}
                      </span>
                    </td>
                    <td>
                      {state.prediction.label}{" "}
                      <small>{(state.prediction.confidence * 100).toFixed(1)}%</small>
                    </td>
                    {FEATURES.map((feature) => (
                      <td key={feature.key}>
                        <span className="resilience-feature-pair">
                          <small>Raw {formatValue(baseline.features[feature.key])}</small>
                          {formatValue(state.features[feature.key])}
                        </span>
                      </td>
                    ))}
                    <td>{state.ood_flag ? state.ood_features.join(", ") : "Within range"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
