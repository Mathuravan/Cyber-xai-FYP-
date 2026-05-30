import { useState } from "react"
import { predictSingle } from "../services/predictionService"
import {
  saveLatestPrediction,
  addAttackLog,
  savePredictionHistory,
} from "../services/storageService"

const FEATURES = [
  {
    name: "duration",
    label: "Duration",
    placeholder: "12",
  },
  {
    name: "src_bytes",
    label: "Source bytes",
    placeholder: "7000",
  },
  {
    name: "dst_bytes",
    label: "Destination bytes",
    placeholder: "4000",
  },
  {
    name: "count",
    label: "Count",
    placeholder: "30",
  },
]

const EMPTY_FORM = {
  duration: "",
  src_bytes: "",
  dst_bytes: "",
  count: "",
}

function getThreatLevel(label, confidence) {
  if (label === "Normal") {
    return {
      level: "Low",
      className: "ok",
    }
  }

  if (confidence >= 0.8) {
    return {
      level: "High",
      className: "bad",
    }
  }

  return {
    level: "Medium",
    className: "pending",
  }
}

export default function SinglePredict() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setError("")
  }

  const loadSampleValues = () => {
    setForm({
      duration: "12",
      src_bytes: "7000",
      dst_bytes: "4000",
      count: "30",
    })

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

      if (Object.values(payload).some((value) => Number.isNaN(value))) {
        throw new Error("Please enter valid numeric values.")
      }

      const data = await predictSingle(payload)

      const threat = getThreatLevel(
        data.label,
        data.confidence
      )

      const timestamp = new Date().toLocaleString()

      const displayResult = {
        label: data.label,
        confidence: data.confidence,
        threatLevel: threat.level,
        threatClass: threat.className,
        timestamp,
      }

      setResult(displayResult)

      const logEntry = {
        label: data.label,
        confidence: data.confidence,
        timestamp,
        source: "Single prediction",
        features: payload,
      }

      saveLatestPrediction(logEntry)
      
      if (data.label === "Attack") {
      addAttackLog(logEntry)
      }

      savePredictionHistory({
        label: data.label,
        confidence: data.confidence,
        timestamp,
      })
    } catch (err) {
      setError(
        err.message ||
          "Prediction failed. Make sure backend is running."
      )
    } finally {
      setLoading(false)
    }
  }

  const labelClass = result?.label?.toLowerCase() || ""

  return (
    <div className="predict-page">
      <div className="topbar">
        <h1>Single Prediction</h1>

        <p>
          Analyze a single NSL-KDD network flow using the
          CyberXAI intrusion detection API.
        </p>
      </div>

      <div className="panel dashboard-panel">
        <h2 className="page-title">
          Network Traffic Features
        </h2>

        <p className="page-subtitle">
          Enter traffic values and run a prediction.
        </p>

        <div className="example-buttons">
          <button
            type="button"
            className="btn secondary-btn"
            onClick={loadSampleValues}
            disabled={loading}
          >
            Load Sample Values
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {FEATURES.map((field) => (
              <div
                className="form-group"
                key={field.name}
              >
                <label htmlFor={field.name}>
                  {field.label}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min="0"
                  step="any"
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="btn predict-submit-btn"
            disabled={loading}
          >
            {loading
              ? "Analyzing traffic..."
              : "Run Prediction"}
          </button>
        </form>

        {loading && (
          <p className="loading-text">
            Contacting backend API...
          </p>
        )}

        {error && (
          <p className="error-text">
            {error}
          </p>
        )}

        {result && (
          <div className="result-box predict-result">
            <h3>Prediction Result</h3>

            <p>
              <strong>Prediction:</strong>{" "}
              <span
                className={`prediction-label ${labelClass}`}
              >
                {result.label}
              </span>
            </p>

            <p>
              <strong>Confidence:</strong>{" "}
              {(result.confidence * 100).toFixed(1)}%
            </p>

            <p>
              <strong>Threat Level:</strong>{" "}
              <span
                className={`status-pill ${result.threatClass}`}
              >
                {result.threatLevel}
              </span>
            </p>

            <p className="card-meta">
              Timestamp: {result.timestamp}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}