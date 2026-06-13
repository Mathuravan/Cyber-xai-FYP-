import { useState } from "react";
import { predictBatch } from "../services/predictionService";
import {
  saveCsvSummary,
  addMultipleAttackLogs,
  savePredictionHistory,
} from "../services/storageService";

export default function BatchUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setError("");
    }
  };

  const handleDownloadReport = () => {
    if (!summary) return;

    const rows = [
      ["CyberXAI Executive Security Report"],
      ["Filename", summary.filename],
      ["Total Records Analyzed", summary.total_rows],
      ["Normal Traffic", summary.normal_count],
      ["Total Attacks", summary.attack_count],
      ["Attack Rate", `${summary.attack_rate}%`],
      [],
      ["Severity Distribution"],
      ["Critical", summary.severity_distribution?.critical || 0],
      ["High", summary.severity_distribution?.high || 0],
      ["Medium", summary.severity_distribution?.medium || 0],
      ["Low", summary.severity_distribution?.low || 0],
      [],
      ["Top 10 Threats"],
      ["Row", "Threat Type", "Confidence", "Severity", "Explanation Summary"]
    ];

    if (summary.top_threats) {
      summary.top_threats.forEach(t => {
        rows.push([
          t.row, 
          t.label, 
          `${(t.confidence * 100).toFixed(1)}%`, 
          t.severity, 
          `"${t.summary}"`
        ]);
      });
    }

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Threat_Report_${summary.filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      if (!data.summary_mode && data.results) {
        data.results.forEach((result) => {
          savePredictionHistory({
            label: result.label,
            confidence: result.confidence,
            timestamp: new Date().toLocaleString(),
          });
        });
      }

      saveCsvSummary({
        filename: data.filename,
        total_rows: data.total_rows,
        normal_count: data.normal_count,
        attack_count: data.attack_count,
        timestamp: new Date().toLocaleString(),
      });

      let attackLogs = [];
      if (data.summary_mode && data.top_threats) {
        attackLogs = data.top_threats.map((row) => ({
          label: row.label,
          confidence: row.confidence,
          timestamp: new Date().toLocaleString(),
          source: `Batch: ${data.filename} (Row ${row.row})`,
        }));
      } else if (data.results) {
        attackLogs = data.results
          .filter((row) => row.label === "Attack")
          .map((row) => ({
            label: row.label,
            confidence: row.confidence,
            timestamp: new Date().toLocaleString(),
            source: `Batch: ${data.filename} (Row ${row.row})`,
          }));
      }

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

          <button type="submit" className="btn" disabled={loading || !file}>
            {loading ? "Processing..." : "Run Batch Prediction"}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Processing large dataset using vectorized engines... Please wait.</p>
        </div>
      )}

      {summary && !loading && (
        <div className="batch-results">
          {summary.summary_mode && (
            <div className="ai-critical-pulse" style={{ marginBottom: "20px" }}>
              <div className="ai-critical-pulse-dot"></div>
              LARGE DATASET MODE ACTIVATED
            </div>
          )}

          <div className="summary-cards">
            <div className="card">
              <h3>Total Records</h3>
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
            <div className="card critical-card">
              <h3>Attack Rate</h3>
              <p className="card-value attack">{summary.attack_rate}%</p>
            </div>
          </div>

          <div className="summary-cards" style={{ marginTop: '20px' }}>
            <div className="card">
              <h3>Critical Threats</h3>
              <p className="card-value attack">{summary.severity_distribution?.critical || 0}</p>
            </div>
            <div className="card warning">
              <h3>High Threats</h3>
              <p className="card-value attack">{summary.severity_distribution?.high || 0}</p>
            </div>
            <div className="card">
              <h3>Medium Threats</h3>
              <p className="card-value warning">{summary.severity_distribution?.medium || 0}</p>
            </div>
            <div className="card">
              <h3>Low Threats</h3>
              <p className="card-value normal">{summary.severity_distribution?.low || 0}</p>
            </div>
          </div>

          {summary.summary_mode ? (
            <div className="panel dashboard-panel results-table-panel" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Top 10 Critical Threats</h2>
                <button type="button" className="btn logs-export-btn" onClick={handleDownloadReport}>
                  Download Executive Report
                </button>
              </div>

              <div className="table-responsive" style={{ marginTop: '16px' }}>
                <table className="results-table logs-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Threat Type</th>
                      <th>Severity</th>
                      <th>Confidence</th>
                      <th>Explanation Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.top_threats?.map((result, index) => (
                      <tr key={index} className={result.severity === 'Critical' ? "critical-row" : "attack-row"}>
                        <td>{result.row}</td>
                        <td>
                          <span className={`badge attack`}>{result.label}</span>
                        </td>
                        <td>
                          <span className={`severity-badge ${result.severity.toLowerCase()}`}>
                            {result.severity}
                          </span>
                        </td>
                        <td>{(result.confidence * 100).toFixed(1)}%</td>
                        <td style={{ fontSize: '13px', color: '#cbd5e1' }}>{result.summary}</td>
                      </tr>
                    ))}
                    {summary.top_threats?.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>No threats detected.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="panel dashboard-panel results-table-panel" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Prediction Results</h2>
                <button type="button" className="btn logs-export-btn" onClick={handleDownloadReport}>
                  Download Report
                </button>
              </div>

              <div className="table-responsive" style={{ marginTop: '16px' }}>
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
                      <tr key={index} className={result.label === "Attack" ? "attack-row" : "normal-row"}>
                        <td>{result.row}</td>
                        <td>
                          <span className={`badge ${result.label.toLowerCase()}`}>{result.label}</span>
                        </td>
                        <td>{(result.confidence * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}