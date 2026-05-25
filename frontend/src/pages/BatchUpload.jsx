import { useState } from "react"
import { predictBatch } from "../services/predictionService"
import {
  saveCsvSummary,
  addAttackLog,
} from "../services/storageService"

export default function BatchUpload() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState(null)

  const handleFileChange = (event) => {
    setFile(event.target.files[0])
    setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      setError("Please select a CSV file.")
      return
    }

    setLoading(true)
    setError("")
    setSummary(null)

    try {
      const data = await predictBatch(file)

      setSummary(data)

      saveCsvSummary(data)

      addAttackLog({
        label: "Batch Upload",
        confidence: 1,
        timestamp: new Date().toLocaleString(),
        source: file.name,
      })
    } catch (err) {
      setError(
        err.message ||
          "Batch prediction failed."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="predict-page">
      <div className="topbar">
        <h1>Batch CSV Prediction</h1>

        <p>
          Upload an NSL-KDD CSV file for bulk
          intrusion analysis.
        </p>
      </div>

      <div className="panel dashboard-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select CSV File</label>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading
              ? "Uploading..."
              : "Run Batch Prediction"}
          </button>
        </form>

        {loading && (
          <p className="loading-text">
            Processing CSV file...
          </p>
        )}

        {error && (
          <p className="error-text">
            {error}
          </p>
        )}

        {summary && (
          <div className="result-box predict-result">
            <h3>Batch Summary</h3>

            <p>
              <strong>Filename:</strong>{" "}
              {summary.filename}
            </p>

            <p>
              <strong>Total Rows:</strong>{" "}
              {summary.total_rows}
            </p>

            <p>
              <strong>Normal Traffic:</strong>{" "}
              {summary.normal_count}
            </p>

            <p>
              <strong>Attack Traffic:</strong>{" "}
              {summary.attack_count}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}