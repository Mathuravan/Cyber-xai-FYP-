import { useState } from "react"
import { predictSingle } from "../services/predictionService"
import {
  saveLatestPrediction,
  addAttackLog,
} from "../services/storageService"

const FEATURES = [
  { name: "duration", label: "Duration", placeholder: "12" },
  { name: "src_bytes", label: "Source bytes", placeholder: "7000" },
  { name: "dst_bytes", label: "Destination bytes", placeholder: "4000" },
  { name: "count", label: "Count", placeholder: "30" },
]

const EMPTY_FORM = {
  duration: "",
  src_bytes: "",
  dst_bytes: "",
  count: "",
}

function getThreatLevel(label, confidence) {
  if (label === "Normal") return { level: "Low", className: "ok" }
  if (confidence >= 0.8) return { level: "High", className: "bad" }
  return { level: "Medium", className: "pending" }
}

export default function SinglePredict() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setError("")
  }

  const fillSample = () => {
    setForm({
      duration: "12",
      src_bytes: "7000",
      dst_bytes: "4000",
      count: "30",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setResult(null)
    setLoading(true)

    try {
      const payload = {
        duration: Number(form.duration),
        src_bytes: Number(form.src_bytes),
        dst_bytes: Number(form.dst_bytes),
        count: Number(form.count),
      }

      if (Object.values(payload).some(Number.isNaN)) {
        throw new Error("Enter valid numbers")
      }

      const data = await predictSingle(payload)
      const threat = getThreatLevel(data.label, data.confidence)

      const display = {
        ...data,
        threatLevel: threat.level,
        threatClass: threat.className,
        timestamp: new Date().toLocaleString(),
      }

      setResult(display)

      const log = {
        ...payload,
        ...data,
        timestamp: display.timestamp,
        source: "Single Predict",
      }

      saveLatestPrediction(log)
      addAttackLog(log)

    } catch (err) {
      setError(err.message || "Prediction failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="predict-page">
      <div className="topbar">
        <h1>Single Prediction</h1>
        <p>Analyze network traffic using ML model</p>
      </div>

      <div className="panel dashboard-panel">
        <h2>Traffic Features</h2>

        <button
          className="btn secondary-btn"
          onClick={fillSample}
          disabled={loading}
        >
          Load Sample
        </button>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {FEATURES.map((f) => (
              <div className="form-group" key={f.name}>
                <label>{f.label}</label>
                <input
                  type="number"
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          <button className="btn" disabled={loading}>
            {loading ? "Predicting..." : "Run Prediction"}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}

        {result && (
          <div className="result-box predict-result">
            <h3>Result</h3>

            <p>
              Prediction:{" "}
              <span className={`prediction-label ${result.label?.toLowerCase()}`}>
                {result.label}
              </span>
            </p>

            <p>
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </p>

            <p>
              Threat:{" "}
              <span className={`status-pill ${result.threatClass}`}>
                {result.threatLevel}
              </span>
            </p>

            <p className="card-meta">{result.timestamp}</p>
          </div>
        )}
      </div>
    </div>
  )
}