import { useMemo, useState } from "react";
import { predictBatch } from "../services/predictionService";
import {
  saveCsvSummary,
  addMultipleAttackLogs,
  savePredictionHistory,
  getSavedCsvMapping,
  saveCsvMapping,
} from "../services/storageService";

import { generateExecutiveReport } from "../services/reportService";

const REQUIRED_FEATURES = [
  {
    key: "duration",
    label: "Duration",
    aliases: ["duration", "duration_sec", "session_duration", "flow_duration", "connection_duration", "dur"],
  },
  {
    key: "src_bytes",
    label: "Source Bytes",
    aliases: ["src_bytes", "source_bytes", "src bytes", "bytes_sent", "bytes sent", "outbound_bytes", "fwd_bytes"],
  },
  {
    key: "dst_bytes",
    label: "Destination Bytes",
    aliases: ["dst_bytes", "destination_bytes", "dest_bytes", "bytes_received", "bytes received", "inbound_bytes", "bwd_bytes"],
  },
  {
    key: "count",
    label: "Count",
    aliases: ["count", "packet_count", "packet count", "connection_count", "flow_packets", "packets_per_second"],
  },
];

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let insideQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === "," && !insideQuote) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvPreview(text) {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const columns = splitCsvLine(lines[0]).map((column) =>
    column.replace(/^"|"$/g, "").trim()
  );

  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};

    columns.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });

    return row;
  });

  return { columns, rows };
}

function normalizeName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]);

  for (let col = 0; col <= a.length; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let col = 1; col <= a.length; col += 1) {
      matrix[row][col] =
        b[row - 1] === a[col - 1]
          ? matrix[row - 1][col - 1]
          : Math.min(
              matrix[row - 1][col - 1] + 1,
              matrix[row][col - 1] + 1,
              matrix[row - 1][col] + 1
            );
    }
  }

  return matrix[b.length][a.length];
}

function similarity(left, right) {
  const a = normalizeName(left);
  const b = normalizeName(right);

  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  if (a.includes(b) || b.includes(a)) {
    return 0.92;
  }

  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function detectMapping(columns) {
  const usedColumns = new Set();
  const mapping = {};
  const confidence = {};

  REQUIRED_FEATURES.forEach((feature) => {
    let best = { column: "", score: 0 };

    columns.forEach((column) => {
      if (usedColumns.has(column)) {
        return;
      }

      const score = Math.max(
        ...feature.aliases.map((alias) => similarity(column, alias))
      );

      if (score > best.score) {
        best = { column, score };
      }
    });

    if (best.score >= 0.58) {
      mapping[feature.key] = best.column;
      confidence[feature.key] = Math.round(best.score * 100);
      usedColumns.add(best.column);
    } else {
      mapping[feature.key] = "";
      confidence[feature.key] = 0;
    }
  });

  return { mapping, confidence };
}

function analyzeQuality(columns, rows, mapping) {
  const totalCells = Math.max(columns.length * rows.length, 1);
  let missingCells = 0;
  let invalidNumeric = 0;
  let outliers = 0;
  const typeSummary = { numeric: 0, text: 0, mixed: 0, empty: 0 };
  const duplicateRows = rows.length - new Set(rows.map((row) => JSON.stringify(row))).size;

  columns.forEach((column) => {
    const values = rows.map((row) => String(row[column] ?? "").trim());
    const present = values.filter((value) => value !== "");
    const numeric = present.filter((value) => Number.isFinite(Number(value)));

    missingCells += values.length - present.length;

    if (!present.length) {
      typeSummary.empty += 1;
    } else if (numeric.length === present.length) {
      typeSummary.numeric += 1;
    } else if (numeric.length === 0) {
      typeSummary.text += 1;
    } else {
      typeSummary.mixed += 1;
    }

    if (numeric.length >= 4) {
      const numbers = numeric.map(Number).sort((a, b) => a - b);
      const q1 = numbers[Math.floor(numbers.length * 0.25)];
      const q3 = numbers[Math.floor(numbers.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      outliers += numbers.filter((value) => value < lower || value > upper).length;
    }
  });

  REQUIRED_FEATURES.forEach((feature) => {
    const sourceColumn = mapping[feature.key];

    if (!sourceColumn) {
      invalidNumeric += rows.length;
      return;
    }

    rows.forEach((row) => {
      const value = String(row[sourceColumn] ?? "").trim();

      if (value !== "" && !Number.isFinite(Number(value))) {
        invalidNumeric += 1;
      }
    });
  });

  const missingPercentage = (missingCells / totalCells) * 100;
  const duplicatePercentage = rows.length ? (duplicateRows / rows.length) * 100 : 0;
  const invalidPercentage = rows.length ? (invalidNumeric / (rows.length * REQUIRED_FEATURES.length)) * 100 : 0;
  const outlierPercentage = rows.length ? (outliers / rows.length) * 100 : 0;

  const score = Math.max(
    0,
    Math.round(
      100 -
        missingPercentage * 0.7 -
        duplicatePercentage * 0.5 -
        invalidPercentage * 1.2 -
        Math.min(outlierPercentage * 0.35, 20)
    )
  );

  return {
    score,
    missingPercentage: Number(missingPercentage.toFixed(1)),
    duplicateRows,
    invalidNumeric,
    outliers,
    totalRows: rows.length,
    totalColumns: columns.length,
    typeSummary,
    warnings: [
      score < 70 ? "Data quality is below the recommended threshold." : "",
      missingPercentage > 10 ? "Missing values exceed 10% of the dataset." : "",
      invalidNumeric > 0 ? "Some mapped model fields contain non-numeric values." : "",
      duplicateRows > 0 ? "Duplicate rows were detected." : "",
    ].filter(Boolean),
  };
}

function getScoreClass(score) {
  if (score >= 85) return "normal";
  if (score >= 70) return "warning";
  return "attack";
}

export default function BatchUpload() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [mappingConfidence, setMappingConfidence] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const quality = useMemo(() => {
    if (!columns.length || !rows.length) {
      return null;
    }

    return analyzeQuality(columns, rows, mapping);
  }, [columns, rows, mapping]);

  const mappingComplete = REQUIRED_FEATURES.every((feature) => mapping[feature.key]);

  const handleFileChange = async (event) => {
    const selected = event.target.files?.[0];

    if (!selected) {
      return;
    }

    setFile(selected);
    setSummary(null);
    setError("");

    try {
      const text = await selected.text();
      const parsed = parseCsvPreview(text);
      const saved = getSavedCsvMapping(parsed.columns);
      const detected = detectMapping(parsed.columns);

      setColumns(parsed.columns);
      setRows(parsed.rows);
      setMapping(saved?.mapping || detected.mapping);
      setMappingConfidence(saved ? {} : detected.confidence);
    } catch (err) {
      setFile(null);
      setColumns([]);
      setRows([]);
      setMapping({});
      setError(err.message || "Could not read the CSV file.");
    }
  };

  const handleMappingChange = (feature, value) => {
    setMapping((prev) => ({
      ...prev,
      [feature]: value,
    }));
    setError("");
  };

  const handleDownloadReport = () => {
    if (!summary) return;

    const rowsForCsv = [
      ["CyberXAI Executive Security Report"],
      ["Filename", summary.filename],
      ["Total Records Analyzed", summary.total_rows],
      ["Normal Traffic", summary.normal_count],
      ["Total Attacks", summary.attack_count],
      ["Attack Rate", `${summary.attack_rate}%`],
      ["Data Quality Score", quality ? `${quality.score}/100` : "N/A"],
      [],
      ["Detected Mapping"],
      ...Object.entries(mapping).map(([feature, column]) => [feature, column]),
      [],
      ["Severity Distribution"],
      ["Critical", summary.severity_distribution?.critical || 0],
      ["High", summary.severity_distribution?.high || 0],
      ["Medium", summary.severity_distribution?.medium || 0],
      ["Low", summary.severity_distribution?.low || 0],
      [],
      ["Top 10 Threats"],
      ["Row", "Threat Type", "Confidence", "Severity", "Explanation Summary"],
    ];

    summary.top_threats?.forEach((t) => {
      rowsForCsv.push([
        t.row,
        t.label,
        `${(t.confidence * 100).toFixed(1)}%`,
        t.severity,
        `"${t.summary}"`,
      ]);
    });

    const csvContent = rowsForCsv.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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

    if (!mappingComplete) {
      setError("Please map all four model features before prediction.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const data = await predictBatch(file, mapping);
      setSummary(data);
      saveCsvMapping(columns, mapping);

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
        attack_rate: data.attack_rate,
        data_quality_score: quality?.score,
        mapping,
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
        <p>Upload CSV traffic records and run batch intrusion analysis through the CyberXAI detection API.</p>
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

          {columns.length > 0 && (
            <div className="adaptation-grid">
              <section className="adaptation-card">
                <h2>Detected Feature Mapping</h2>
                <p className="card-meta">Review and correct the columns before prediction.</p>

                <div className="mapping-list">
                  {REQUIRED_FEATURES.map((feature) => (
                    <label key={feature.key} className="mapping-row">
                      <span>
                        {feature.label}
                        {mappingConfidence[feature.key] ? (
                          <small>{mappingConfidence[feature.key]}% match</small>
                        ) : null}
                      </span>

                      <select
                        value={mapping[feature.key] || ""}
                        onChange={(event) => handleMappingChange(feature.key, event.target.value)}
                      >
                        <option value="">Select column</option>
                        {columns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </section>

              {quality && (
                <section className="adaptation-card">
                  <h2>Universal Data Quality</h2>
                  <div className="quality-score-row">
                    <span className={`card-value ${getScoreClass(quality.score)}`}>
                      {quality.score}
                    </span>
                    <span className="quality-score-label">/100</span>
                  </div>

                  <div className="quality-grid">
                    <span>Rows: {quality.totalRows}</span>
                    <span>Columns: {quality.totalColumns}</span>
                    <span>Missing: {quality.missingPercentage}%</span>
                    <span>Duplicates: {quality.duplicateRows}</span>
                    <span>Invalid numeric: {quality.invalidNumeric}</span>
                    <span>Outliers: {quality.outliers}</span>
                  </div>

                  <p className="card-meta">
                    Numeric {quality.typeSummary.numeric} | Text {quality.typeSummary.text} |
                    Mixed {quality.typeSummary.mixed} | Empty {quality.typeSummary.empty}
                  </p>

                  {quality.warnings.length > 0 && (
                    <div className="quality-warnings">
                      {quality.warnings.map((warning) => (
                        <span key={warning}>{warning}</span>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          <button type="submit" className="btn" disabled={loading || !file || !mappingComplete}>
            {loading ? "Processing..." : "Run Batch Prediction"}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Adapting dataset schema and running vectorized predictions...</p>
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

          <div className="panel dashboard-panel results-table-panel" style={{ marginTop: "20px" }}>
            <div className="table-header-actions">
              <h2>{summary.summary_mode ? "Top 10 Critical Threats" : "Prediction Results"}</h2>
              <div className="report-actions">
                <button type="button" className="btn logs-export-btn" onClick={handleDownloadReport}>
                  Export CSV
                </button>
                <button
                  type="button"
                  className="btn logs-export-btn"
                  onClick={generateExecutiveReport}
                  style={{
                    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.95))",
                    borderColor: "rgba(248, 113, 113, 0.5)",
                  }}
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div className="table-responsive" style={{ marginTop: "16px" }}>
              <table className="results-table logs-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Threat Type</th>
                    {summary.summary_mode && <th>Severity</th>}
                    <th>Confidence</th>
                    {summary.summary_mode && <th>Explanation Summary</th>}
                  </tr>
                </thead>
                <tbody>
                  {(summary.summary_mode ? summary.top_threats : summary.results)?.map((result, index) => (
                    <tr
                      key={index}
                      className={result.label === "Attack" ? "attack-row" : "normal-row"}
                    >
                      <td>{result.row}</td>
                      <td>
                        <span className={`badge ${result.label.toLowerCase()}`}>{result.label}</span>
                      </td>
                      {summary.summary_mode && (
                        <td>
                          <span className={`severity-badge ${result.severity.toLowerCase()}`}>
                            {result.severity}
                          </span>
                        </td>
                      )}
                      <td>{(result.confidence * 100).toFixed(1)}%</td>
                      {summary.summary_mode && (
                        <td style={{ fontSize: "13px", color: "#cbd5e1" }}>{result.summary}</td>
                      )}
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
