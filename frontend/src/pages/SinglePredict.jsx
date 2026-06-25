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

const SHAP_FEATURE_LABELS = {
  duration: "Duration",
  src_bytes: "Source bytes",
  dst_bytes: "Destination bytes",
  count: "Count",
}

const SHAP_TOOLTIPS = {
  duration:
    "Very short flows can indicate scanning or rapid connection attempts.",
  src_bytes:
    "High source bytes may suggest unusual outbound or exfiltration activity.",
  dst_bytes:
    "Elevated destination bytes can reflect heavy inbound transfer patterns.",
  count:
    "High connection counts often correlate with floods or repeated probes.",
}

function getImpactLevel(absValue) {
  if (absValue >= 0.5) {
    return {
      label: "High Impact",
      className: "high",
    }
  }

  if (absValue >= 0.25) {
    return {
      label: "Medium Impact",
      className: "medium",
    }
  }

  return {
    label: "Low Impact",
    className: "low",
  }
}

function formatShapValues(shapValues) {
  if (!shapValues || typeof shapValues !== "object") {
    return []
  }

  const entries = Object.entries(shapValues).map(([name, rawValue]) => {
    const value = Number(rawValue)
    const absValue = Math.abs(value)
    const impact = getImpactLevel(absValue)

    return {
      name,
      label: SHAP_FEATURE_LABELS[name] || name,
      value,
      absValue,
      direction: value >= 0 ? "suspicious" : "safe",
      impactLabel: impact.label,
      impactClass: impact.className,
      tooltip: SHAP_TOOLTIPS[name] || "Feature contribution toward the prediction.",
    }
  })

  const maxAbs = Math.max(...entries.map((item) => item.absValue), 0.01)

  return entries.map((item) => ({
    ...item,
    barWidth: Math.round((item.absValue / maxAbs) * 100),
  }))
}

function getTopSuspiciousFeature(formattedShap) {
  if (!formattedShap.length) {
    return null
  }

  return formattedShap.reduce((top, item) => {
    if (!top || item.value > top.value) {
      return item
    }

    return top
  }, null)
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

function generateThreatExplanation(features, label, confidence) {
  if (label === "Normal") {
    return {
      summary: "Traffic appears benign and matches normal network baselines.",
      riskFactors: [
        "Traffic behavior matches expected NSL-KDD baseline patterns.",
        "No suspicious repeated connections or abnormal traffic spikes detected.",
      ],
      recommendation: "No action required. Continue monitoring."
    };
  }

  const riskFactors = [];
  
  if (features.count > 50 && features.duration < 2) {
    riskFactors.push("Very low duration with a high connection count indicates a possible port scanning attack.");
  } else if (features.count > 50) {
    riskFactors.push("High connection count suggests suspicious repeated connections or a potential DOS attempt.");
  }

  if (features.src_bytes > 10000) {
    riskFactors.push("High source bytes transferred indicates unusual outbound traffic or possible data exfiltration.");
  }

  if (confidence >= 0.8) {
    riskFactors.push("High confidence attack prediction signifies a severe intrusion risk.");
  }

  if (riskFactors.length === 0) {
    riskFactors.push("The AI model detected anomalous feature patterns typical of malicious behavior.");
  }

  return {
    summary: "The AI model has flagged this traffic as a potential security threat.",
    riskFactors,
    recommendation: "Isolate the source IP immediately and investigate the associated endpoints."
  };
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

      const shapContributions = formatShapValues(data.shap_values)
      const topSuspicious = getTopSuspiciousFeature(shapContributions)

      const displayResult = {
        label: data.label,
        confidence: data.confidence,
        threatLevel: threat.level,
        threatClass: threat.className,
        timestamp,
        explanation: generateThreatExplanation(payload, data.label, data.confidence),
        shapContributions,
        topSuspicious,
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
          Analyze one NSL-KDD network flow using selected traffic features.
        </p>
      </div>

      <div className="panel dashboard-panel">
        <h2 className="page-title">
          Network Traffic Features
        </h2>

        <p className="page-subtitle">
          Enter traffic values and run a prediction.
        </p>

        <p className="page-subtitle">
          Selected NSL-KDD Feature Prediction Prototype
          <br />
          This prototype uses selected numerical NSL-KDD features:
          duration, src_bytes, dst_bytes, and count.
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
          <>
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

            <div
              className={`explanation-box ${
                result.label === "Attack"
                  ? "attack-glow"
                  : "normal-glow"
              }`}
            >
              <h3>Prediction Explanation (XAI)</h3>

              <p>
                <strong>Severity:</strong>{" "}
                <span
                  className={`badge ${
                    result.label === "Attack"
                      ? "attack"
                      : "normal"
                  }`}
                >
                  {result.threatLevel}
                </span>
              </p>
              
              <p>
                <strong>Summary:</strong> {result.explanation.summary}
              </p>
              
              <div className="risk-factors">
                <strong>Risk Factors:</strong>
                <ul>
                  {result.explanation.riskFactors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>

              <p className="recommendation">
                <strong>Recommendation:</strong> {result.explanation.recommendation}
              </p>
            </div>

            {result.shapContributions?.length > 0 && (
              <div className="shap-panel">
                <h3>Feature Contribution Analysis</h3>
                <p className="shap-panel-subtitle">
                  SHAP-style scores show how each NSL-KDD feature pushed the
                  prediction toward attack (positive) or normal traffic (negative).
                </p>

                {result.topSuspicious && result.topSuspicious.value > 0 && (
                  <div className="shap-top-feature">
                    <strong>Top contributing feature:</strong>
                    <span>{result.topSuspicious.label}</span>
                    <span>({result.topSuspicious.value.toFixed(2)})</span>
                  </div>
                )}

                <div className="shap-feature-list">
                  {result.shapContributions.map((feature) => (
                    <div
                      key={feature.name}
                      className={`shap-feature-row ${
                        result.topSuspicious?.name === feature.name &&
                        feature.value > 0
                          ? "top-suspicious"
                          : ""
                      }`}
                    >
                      <div className="shap-feature-header">
                        <span className="shap-feature-name">
                          {feature.label}
                        </span>

                        <div className="shap-feature-meta">
                          <span className="shap-score">
                            {feature.value >= 0 ? "+" : ""}
                            {feature.value.toFixed(2)}
                          </span>
                          <span
                            className={`shap-impact-label ${feature.impactClass}`}
                          >
                            {feature.impactLabel}
                          </span>
                        </div>
                      </div>

                      <div className="shap-bar-track">
                        <div
                          className={`shap-bar-fill ${feature.direction}`}
                          style={{ width: `${feature.barWidth}%` }}
                          title={`${feature.label}: ${feature.value.toFixed(2)}`}
                        />
                      </div>

                      <p className="shap-tooltip">{feature.tooltip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
