import {
  useEffect,
  useState,
} from "react";

import {
  getAttackLogs,
  clearAttackLogs,
} from "../services/storageService";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  // =======================
  // LOAD LOGS
  // =======================
  useEffect(() => {
    setLogs(getAttackLogs());
  }, []);

  // =======================
  // CLEAR LOGS
  // =======================
  const handleClearLogs = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all attack logs?"
    );

    if (!confirmed) return;

    clearAttackLogs();

    setLogs([]);
  };

  // =======================
  // TOTAL ATTACKS
  // =======================
  const totalLogs = logs.length;

  // =======================
  // LATEST ATTACK
  // =======================
  const latestAttack =
    logs.length > 0
      ? logs[0].timestamp
      : "No logs";

  return (
    <div className="predict-page">
      {/* =======================
          HEADER
      ======================= */}
      <div className="topbar logs-header">
        <div>
          <h1>Attack Logs</h1>

          <p>
            View saved prediction
            and batch analysis
            history.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            className="btn-danger"
            onClick={
              handleClearLogs
            }
          >
            Clear Logs
          </button>
        )}
      </div>

      {/* =======================
          SUMMARY CARDS
      ======================= */}
      <div className="summary-cards logs-summary">
        <div className="card warning">
          <h3>
            Total Attacks
          </h3>

          <p className="card-value attack">
            {totalLogs}
          </p>
        </div>

        <div className="card">
          <h3>
            Latest Detection
          </h3>

          <p className="timestamp-value">
            {latestAttack}
          </p>
        </div>
      </div>

      {/* =======================
          TABLE PANEL
      ======================= */}
      <div className="panel dashboard-panel results-table-panel">
        <h2>
          Recent Threats
        </h2>

        {logs.length === 0 ? (
          <div className="empty-state">
            <p>
              No attack logs found.
              The system is currently
              secure.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="results-table">
              <thead>
                <tr>
                  <th>
                    Timestamp
                  </th>

                  <th>Source</th>

                  <th>
                    Threat Type
                  </th>

                  <th>
                    Confidence
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.map(
                  (log, index) => (
                    <tr
                      key={index}
                    >
                      <td>
                        {
                          log.timestamp
                        }
                      </td>

                      <td>
                        {log.source}
                      </td>

                      <td>
                        <span
                          className={`badge ${log.label.toLowerCase()}`}
                        >
                          {
                            log.label
                          }
                        </span>
                      </td>

                      <td>
                        {(
                          log.confidence *
                          100
                        ).toFixed(1)}
                        %
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}