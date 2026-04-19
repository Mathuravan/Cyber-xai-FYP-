import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [backendMessage, setBackendMessage] = useState("Loading backend...");
  const [systemStatus, setSystemStatus] = useState("Checking system...");

  const [formData, setFormData] = useState({
    duration: "",
    src_bytes: "",
    dst_bytes: "",
    count: "",
  });

  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    fetchBackendMessage();
    fetchSystemStatus();

    const savedLogs = localStorage.getItem("cyberxai_logs");
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    const savedCsvResult = localStorage.getItem("cyberxai_csv_result");
    if (savedCsvResult) {
      setCsvResult(JSON.parse(savedCsvResult));
    }
  }, []);

  const fetchBackendMessage = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/");
      setBackendMessage(response.data.message);
    } catch (err) {
      setBackendMessage("Backend connection failed");
      console.error(err);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/system-status");
      setSystemStatus(response.data.status);
    } catch (err) {
      setSystemStatus("System check failed");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePredict = async () => {
    setError("");
    setResult(null);

    if (
      formData.duration === "" ||
      formData.src_bytes === "" ||
      formData.dst_bytes === "" ||
      formData.count === ""
    ) {
      setError("Please fill in all input fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/predict", {
        duration: Number(formData.duration),
        src_bytes: Number(formData.src_bytes),
        dst_bytes: Number(formData.dst_bytes),
        count: Number(formData.count),
      });

      const predictionResult = response.data;
      setResult(predictionResult);

      const newLog = {
        id: Date.now(),
        type: "single",
        time: new Date().toLocaleString(),
        prediction: predictionResult.prediction,
        confidence: predictionResult.confidence,
        top_features: predictionResult.top_features,
        received_input: predictionResult.received_input,
      };

      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("cyberxai_logs", JSON.stringify(updatedLogs));

      setActivePage("Explainability");
    } catch (err) {
      setError("Prediction request failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleCsvPredict = async () => {
    setCsvError("");
    setCsvResult(null);

    if (!csvFile) {
      setCsvError("Please choose a CSV file first.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", csvFile);

    setCsvLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/predict-csv",
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.error) {
        setCsvError(response.data.error);
        return;
      }

      setCsvResult(response.data);
      localStorage.setItem("cyberxai_csv_result", JSON.stringify(response.data));

      const newLog = {
        id: Date.now(),
        type: "csv",
        time: new Date().toLocaleString(),
        filename: response.data.filename,
        total_rows: response.data.total_rows,
        malicious_count: response.data.malicious_count,
        normal_count: response.data.normal_count,
      };

      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("cyberxai_logs", JSON.stringify(updatedLogs));

      setActivePage("Logs");
    } catch (err) {
      setCsvError("CSV prediction failed.");
      console.error(err);
    } finally {
      setCsvLoading(false);
    }
  };

  const clearLogs = () => {
    localStorage.removeItem("cyberxai_logs");
    localStorage.removeItem("cyberxai_csv_result");
    setLogs([]);
    setCsvResult(null);
  };

  const loadMaliciousExample = () => {
    setFormData({
      duration: "12",
      src_bytes: "7000",
      dst_bytes: "4000",
      count: "30",
    });
  };

  const loadNormalExample = () => {
    setFormData({
      duration: "2",
      src_bytes: "100",
      dst_bytes: "150",
      count: "3",
    });
  };

  const renderDashboard = () => {
    return (
      <>
        <header className="topbar">
          <h1>Cyber Attack Detection Dashboard</h1>
          <p>Day 4 - Manual and batch prediction connected to backend</p>
        </header>

        <section className="cards">
          <div className="card">
            <h3>Backend Message</h3>
            <p>{backendMessage}</p>
          </div>

          <div className="card">
            <h3>System Status</h3>
            <p>{systemStatus}</p>
          </div>

          <div className="card">
            <h3>Latest Prediction</h3>
            <p>{result ? result.prediction : "No prediction yet"}</p>
            <p>{result ? `Confidence: ${result.confidence}%` : ""}</p>
            <p>{result ? `Top Feature: ${result.top_features[0]}` : ""}</p>
          </div>

          <div className="card">
            <h3>Latest CSV Summary</h3>
            <p>{csvResult ? csvResult.filename : "No CSV analyzed yet"}</p>
            <p>{csvResult ? `Rows: ${csvResult.total_rows}` : ""}</p>
            <p>{csvResult ? `Malicious: ${csvResult.malicious_count}` : ""}</p>
          </div>
        </section>
      </>
    );
  };

  const renderPredictionPage = () => {
    return (
      <section className="panel">
        <h2 className="page-title">Prediction Page</h2>
        <p className="page-subtitle">
          Enter one traffic record manually or upload a CSV file.
        </p>

        <div className="result-box">
          <h3>Manual Prediction</h3>

          <div className="example-buttons">
            <button className="btn secondary-btn" onClick={loadMaliciousExample}>
              Load Malicious Example
            </button>
            <button className="btn secondary-btn" onClick={loadNormalExample}>
              Load Normal Example
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="Enter duration"
              />
            </div>

            <div className="form-group">
              <label>Source Bytes</label>
              <input
                type="number"
                name="src_bytes"
                value={formData.src_bytes}
                onChange={handleChange}
                placeholder="Enter source bytes"
              />
            </div>

            <div className="form-group">
              <label>Destination Bytes</label>
              <input
                type="number"
                name="dst_bytes"
                value={formData.dst_bytes}
                onChange={handleChange}
                placeholder="Enter destination bytes"
              />
            </div>

            <div className="form-group">
              <label>Count</label>
              <input
                type="number"
                name="count"
                value={formData.count}
                onChange={handleChange}
                placeholder="Enter count"
              />
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn" onClick={handlePredict} disabled={loading}>
            {loading ? "Analyzing..." : "Run Prediction"}
          </button>
        </div>

        <div className="result-box">
          <h3>Batch CSV Prediction</h3>
          <p>Upload a CSV with these columns: duration, src_bytes, dst_bytes, count</p>

          <input type="file" accept=".csv" onChange={handleCsvFileChange} />

          {csvError && <p className="error-text">{csvError}</p>}

          <button className="btn" onClick={handleCsvPredict} disabled={csvLoading}>
            {csvLoading ? "Analyzing CSV..." : "Run CSV Prediction"}
          </button>
        </div>
      </section>
    );
  };

  const renderExplainabilityPage = () => {
    return (
      <section className="panel">
        <h2 className="page-title">Explainability Page</h2>

        {!result ? (
          <div className="result-box">
            <p>No result available yet. Go to Prediction and run the model first.</p>
          </div>
        ) : (
          <>
            <div className="result-box">
              <h3>Prediction Result</h3>
              <p><strong>Prediction:</strong> {result.prediction}</p>
              <p><strong>Confidence:</strong> {result.confidence}%</p>
            </div>

            <div className="result-box">
              <h3>Top Features</h3>
              <ul className="feature-list">
                {result.top_features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="result-box">
              <h3>Feature Importance Scores</h3>
              <ul className="feature-list">
                {result.feature_importance_scores.map((item, index) => (
                  <li key={index}>
                    {item.feature}: {item.score}
                  </li>
                ))}
              </ul>
            </div>

            <div className="result-box">
              <h3>Input Sent to Backend</h3>
              <p><strong>Duration:</strong> {result.received_input.duration}</p>
              <p><strong>Source Bytes:</strong> {result.received_input.src_bytes}</p>
              <p><strong>Destination Bytes:</strong> {result.received_input.dst_bytes}</p>
              <p><strong>Count:</strong> {result.received_input.count}</p>
            </div>
          </>
        )}
      </section>
    );
  };

  const renderLogsPage = () => {
    return (
      <section className="panel">
        <div className="logs-header">
          <h2 className="page-title">Logs Page</h2>
          <button className="btn danger-btn" onClick={clearLogs}>
            Clear Logs
          </button>
        </div>

        {csvResult && (
          <div className="result-box">
            <h3>Latest CSV Analysis</h3>
            <p><strong>File:</strong> {csvResult.filename}</p>
            <p><strong>Total Rows:</strong> {csvResult.total_rows}</p>
            <p><strong>Malicious:</strong> {csvResult.malicious_count}</p>
            <p><strong>Normal:</strong> {csvResult.normal_count}</p>
          </div>
        )}

        {logs.length === 0 ? (
          <div className="result-box">
            <p>No logs yet. Run a prediction first.</p>
          </div>
        ) : (
          <div className="logs-container">
            {logs.map((log) => (
              <div className="log-card" key={log.id}>
                {log.type === "single" ? (
                  <>
                    <h3>{log.prediction}</h3>
                    <p><strong>Time:</strong> {log.time}</p>
                    <p><strong>Confidence:</strong> {log.confidence}%</p>
                    <p><strong>Top Features:</strong> {log.top_features.join(", ")}</p>
                    <p>
                      <strong>Input:</strong> Duration={log.received_input.duration},
                      Src={log.received_input.src_bytes},
                      Dst={log.received_input.dst_bytes},
                      Count={log.received_input.count}
                    </p>
                  </>
                ) : (
                  <>
                    <h3>CSV Batch Analysis</h3>
                    <p><strong>Time:</strong> {log.time}</p>
                    <p><strong>File:</strong> {log.filename}</p>
                    <p><strong>Total Rows:</strong> {log.total_rows}</p>
                    <p><strong>Malicious:</strong> {log.malicious_count}</p>
                    <p><strong>Normal:</strong> {log.normal_count}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderContent = () => {
    if (activePage === "Dashboard") return renderDashboard();
    if (activePage === "Prediction") return renderPredictionPage();
    if (activePage === "Explainability") return renderExplainabilityPage();
    if (activePage === "Logs") return renderLogsPage();
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">CyberXAI</h2>

        <nav>
          <p
            className={`menu ${activePage === "Dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("Dashboard")}
          >
            Dashboard
          </p>

          <p
            className={`menu ${activePage === "Prediction" ? "active" : ""}`}
            onClick={() => setActivePage("Prediction")}
          >
            Prediction
          </p>

          <p
            className={`menu ${activePage === "Explainability" ? "active" : ""}`}
            onClick={() => setActivePage("Explainability")}
          >
            Explainability
          </p>

          <p
            className={`menu ${activePage === "Logs" ? "active" : ""}`}
            onClick={() => setActivePage("Logs")}
          >
            Logs
          </p>
        </nav>
      </aside>

      <main className="main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;