export default function LatestPredictionCard({ prediction }) {
  if (!prediction) {
    return (
      <motionless className="card">
        <h3>Latest prediction</h3>
        <p>No prediction yet. Run single or batch analysis.</p>
      </motionless>
    )
  }

  const labelClass = prediction.label?.toLowerCase() || "unknown"
  const confidence = prediction.confidence
    ? `${(prediction.confidence * 100).toFixed(1)}%`
    : "—"

  return (
    <motionless className="card">
      <h3>Latest prediction</h3>
      <p className={`prediction-label ${labelClass}`}>{prediction.label}</p>
      <p>Confidence: {confidence}</p>
      <p className="card-meta">{prediction.timestamp || "—"}</p>
    </motionless>
  )
}