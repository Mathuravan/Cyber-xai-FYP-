const KEYS = {
  latest: "cyberxai_latest_prediction",
  csv: "cyberxai_csv_summary",
  logs: "cyberxai_attack_logs",
};

// =======================
// LATEST PREDICTION
// =======================
export const getLatestPrediction = () => {
  try {
    return JSON.parse(
      localStorage.getItem(KEYS.latest) || "null"
    );
  } catch {
    return null;
  }
};

// =======================
// CSV SUMMARY
// =======================
export const getCsvSummary = () => {
  try {
    return JSON.parse(
      localStorage.getItem(KEYS.csv) || "null"
    );
  } catch {
    return null;
  }
};

// =======================
// ATTACK LOGS
// =======================
export const getAttackLogs = () => {
  try {
    return JSON.parse(
      localStorage.getItem(KEYS.logs) || "[]"
    );
  } catch {
    return [];
  }
};

// =======================
// SAVE PREDICTION
// =======================
export const saveLatestPrediction = (data) => {
  localStorage.setItem(
    KEYS.latest,
    JSON.stringify(data)
  );
};

// =======================
// SAVE CSV SUMMARY
// =======================
export const saveCsvSummary = (data) => {
  localStorage.setItem(
    KEYS.csv,
    JSON.stringify(data)
  );
};

// =======================
// ADD ATTACK LOG
// =======================
export const addAttackLog = (log) => {
  const logs = getAttackLogs();

  logs.unshift(log);

  localStorage.setItem(
    KEYS.logs,
    JSON.stringify(logs)
  );
};

// =======================
// ADD MULTIPLE ATTACK LOGS
// =======================
export const addMultipleAttackLogs = (newLogs) => {
  if (!newLogs || newLogs.length === 0) return;

  const logs = getAttackLogs();

  logs.unshift(...newLogs);

  localStorage.setItem(
    KEYS.logs,
    JSON.stringify(logs)
  );
};

// =======================
// CLEAR ATTACK LOGS
// =======================
export const clearAttackLogs = () => {
  localStorage.setItem(
    KEYS.logs,
    JSON.stringify([])
  );
};

// =======================
// PREDICTION HISTORY
// =======================

const HISTORY_KEY =
  "cyberxai_prediction_history";

export const getPredictionHistory = () => {
  try {
    return JSON.parse(
      localStorage.getItem(
        HISTORY_KEY
      ) || "[]"
    );
  } catch {
    return [];
  }
};

export const savePredictionHistory = (
  prediction
) => {
  const history =
    getPredictionHistory();

  history.unshift(prediction);

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history)
  );
};

export const clearPredictionHistory =
  () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([])
    );
  };

// =======================
// ANALYTICS HELPERS
// =======================

export const getTotalPredictions =
  () => {
    return getPredictionHistory()
      .length;
  };

export const getAttackCount = () => {
  const history =
    getPredictionHistory();

  return history.filter(
    (item) =>
      item.label &&
      item.label.toLowerCase() ===
        "attack"
  ).length;
};

export const getNormalCount = () => {
  const history =
    getPredictionHistory();

  return history.filter(
    (item) =>
      item.label &&
      item.label.toLowerCase() ===
        "normal"
  ).length;
};

export const getAttackRate = () => {
  const total =
    getTotalPredictions();

  if (total === 0) {
    return 0;
  }

  return (
    (getAttackCount() / total) *
    100
  ).toFixed(1);
};

// =======================
// THREAT SEVERITY HELPERS
// =======================

const UPTIME_KEY = "cyberxai_session_start";

function getThreatSeverityLevel(confidence) {
  const value = Number(confidence) || 0;

  if (value >= 0.9) {
    return "critical";
  }

  if (value >= 0.75) {
    return "high";
  }

  if (value >= 0.5) {
    return "medium";
  }

  return "low";
}

function countThreatsBySeverity(severityLevel) {
  return getAttackLogs().filter(
    (log) =>
      getThreatSeverityLevel(log.confidence) ===
      severityLevel
  ).length;
}

export const getCriticalThreatCount = () =>
  countThreatsBySeverity("critical");

export const getHighThreatCount = () =>
  countThreatsBySeverity("high");

export const getMediumThreatCount = () =>
  countThreatsBySeverity("medium");

export const getLowThreatCount = () =>
  countThreatsBySeverity("low");

export const getLatestThreat = () => {
  const logs = getAttackLogs();

  if (!logs.length) {
    return null;
  }

  return logs[0];
};

export const getActiveThreatCount = () =>
  getAttackLogs().length;

export const getRecentThreats = (limit = 5) => {
  return getAttackLogs().slice(0, limit);
};

export const getDetectionAccuracy = () => {
  const history = getPredictionHistory();

  if (!history.length) {
    return "100.0";
  }

  const averageConfidence =
    history.reduce(
      (sum, item) =>
        sum + (Number(item.confidence) || 0),
      0
    ) / history.length;

  return (averageConfidence * 100).toFixed(1);
};

export const getSystemUptime = () => {
  let startTime = localStorage.getItem(UPTIME_KEY);

  if (!startTime) {
    startTime = String(Date.now());
    localStorage.setItem(UPTIME_KEY, startTime);
  }

  const elapsedMs = Date.now() - Number(startTime);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

export const getThreatSeverityLabel = (confidence) => {
  const level = getThreatSeverityLevel(confidence);

  if (level === "critical") return "Critical";
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  return "Low";
};
