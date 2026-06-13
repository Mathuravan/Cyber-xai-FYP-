import { useEffect, useState } from "react"
import { fetchModelMetrics } from "../services/predictionService"
import "../styles/metrics.css"

function formatFeatureLabel(name) {
  const labels = {
    duration: "Duration",
    src_bytes: "Source bytes",
    dst_bytes: "Destination bytes",
    count: "Count",
  }

  return labels[name] || name
}

export default function ModelMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchModelMetrics()
      .then((data) => {
        setMetrics(data)
        setError("")
      })
      .catch((err) => {
        setError(err.message || "Failed to load model metrics.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="metrics-page">
        <div className="topbar">
          <h1>Model Performance</h1>
          <p>Loading evaluation metrics...</p>
        </div>
        <p className="metrics-loading">Fetching /model/metrics from backend...</p>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="metrics-page">
        <div className="topbar">
          <h1>Model Performance</h1>
          <p>ML evaluation dashboard for FYP review.</p>
        </div>
        <p className="metrics-error">{error || "No metrics available."}</p>
      </div>
    )
  }

  const maxImportance = Math.max(
    ...metrics.feature_importance.map((item) => item.importance),
    0.01
  )

  const coreMetrics = [
    { label: "Accuracy", value: metrics.accuracy, className: "accuracy" },
    { label: "Precision", value: metrics.precision, className: "precision" },
    { label: "Recall", value: metrics.recall, className: "recall" },
    { label: "F1 Score", value: metrics.f1_score, className: "f1" },
  ]

  const confusionItems = [
    { key: "tp", label: "True Positive (TP)", value: metrics.confusion_matrix.tp },
    { key: "tn", label: "True Negative (TN)", value: metrics.confusion_matrix.tn },
    { key: "fp", label: "False Positive (FP)", value: metrics.confusion_matrix.fp },
    { key: "fn", label: "False Negative (FN)", value: metrics.confusion_matrix.fn },
  ]

  return (
    <div className="metrics-page">
      <div className="topbar">
        <h1>Model Performance</h1>
        <p>
          NSL-KDD Random Forest evaluation metrics, confusion matrix, and
          feature importance for supervisor review.
        </p>
      </div>

      <section className="panel dashboard-panel metrics-section">
        <h2 className="page-title">Core Metrics</h2>
        <div className="metrics-cards-grid">
          {coreMetrics.map((item) => (
            <div
              key={item.label}
              className={`metrics-card ${item.className}`}
            >
              <h3>{item.label}</h3>
              <p className="metrics-card-value">{item.value}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel dashboard-panel metrics-section">
        <h2 className="page-title">Confusion Matrix</h2>
        <p className="page-subtitle">
          Test-set classification breakdown (Attack = positive class).
        </p>
        <div className="confusion-matrix-grid">
          {confusionItems.map((item) => (
            <div key={item.key} className={`confusion-cell ${item.key}`}>
              <span className="confusion-label">{item.label}</span>
              <span className="confusion-value">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel dashboard-panel metrics-section">
        <h2 className="page-title">Dataset & Model Information</h2>
        <div className="metrics-info-grid">
          <div className="metrics-info-card">
            <h3>Train Samples</h3>
            <p>{metrics.dataset.train_rows.toLocaleString()}</p>
          </div>
          <div className="metrics-info-card">
            <h3>Test Samples</h3>
            <p>{metrics.dataset.test_rows.toLocaleString()}</p>
          </div>
          <div className="metrics-info-card">
            <h3>Model Type</h3>
            <p>{metrics.model.type}</p>
          </div>
          <div className="metrics-info-card">
            <h3>Number of Trees</h3>
            <p>{metrics.model.estimators}</p>
          </div>
        </div>
        <div className="metrics-feature-tags">
          <strong>Features:</strong>
          {metrics.model.features.map((feature) => (
            <span key={feature} className="metrics-feature-tag">
              {formatFeatureLabel(feature)}
            </span>
          ))}
        </div>
      </section>

      <section className="panel dashboard-panel metrics-section">
        <h2 className="page-title">Feature Importance</h2>
        <p className="page-subtitle">
          Relative contribution from the loaded Random Forest model.
        </p>
        <div className="feature-importance-list">
          {metrics.feature_importance.map((item) => {
            const width = Math.round(
              (item.importance / maxImportance) * 100
            )

            return (
              <div key={item.feature} className="feature-importance-row">
                <div className="feature-importance-header">
                  <span>{formatFeatureLabel(item.feature)}</span>
                  <span>{(item.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="feature-importance-track">
                  <div
                    className="feature-importance-fill"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
