import { useState } from "react";
import { predictBatch } from "../services/predictionService";
import {
  saveCsvSummary,
  addMultipleAttackLogs,
} from "../services/storageService";

export default function BatchUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  // Handle file selection
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setError("");
    }
  };

  // Handle batch prediction submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const data = await predictBatch(file);
      setSummary(data);

      // Save summary to local storage
      saveCsvSummary({
        filename: data.filename,
        total_rows: data.total_rows,
        normal_count: data.normal_count,
        attack_count: data.attack_count,
        timestamp: new Date().toLocaleString()
      });

      // Filter attack results and save to logs
      const attackLogs = data.results
        .filter(row => row.label === "Attack")
        .map(row => ({
          label: row.label,
          confidence: row.confidence,
          timestamp: new Date().toLocaleString(),
          source: `Batch: ${data.filename} (Row ${row.row})`,
        }));

      if (attackLogs.length > 0) {
        addMultipleAttackLogs(attackLogs);
      }
    } catch (err) {
      setError(err.message || "Batch prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="predict-page">
      <div className="topbar">
        <h1>Batch CSV Prediction</h1>
        <p>Upload an NSL-KDD CSV file for bulk intrusion analysis.</p>
      </div>

      <div className="panel dashboard-panel">
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading || !file}
          >
            {loading ? "Uploading..." : "Run Batch Prediction"}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Processing CSV file... Please wait.</p>
        </div>
      )}

      {summary && !loading && (
        <div className="batch-results">
          <div className="summary-cards">
            <div className="card">
              <h3>Total Rows</h3>
              <p className="card-value">{summary.total_rows}</p>
            </div>
            <div className="card">
              <h3>Normal Traffic</h3>
              <p className="card-value normal">{summary.normal_count}</p>
            </div>
            <div className="card warning">
              <h3>Attack Traffic</h3>
              <p className="card-value attack">{summary.attack_count}</p>
            </div>
          </div>

          <div className="panel dashboard-panel results-table-panel">
            <h2>Prediction Results</h2>
            <div className="table-responsive">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Label</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.results.map((result, index) => (
                    <tr 
                      key={index} 
                      className={result.label === "Attack" ? "attack-row" : "normal-row"}
                    >
                      <td>{result.row}</td>
                      <td>
                        <span className={`badge ${result.label.toLowerCase()}`}>
                          {result.label}
                        </span>
                      </td>
                      <td>{(result.confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}