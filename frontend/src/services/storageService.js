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
// ANALYTICS HELPERS
// =======================
export const getTotalPredictions = () => {
  return getAttackLogs().length;
};

export const getAttackCount = () => {
  const logs = getAttackLogs();
  return logs.filter(log => log.label && log.label.toLowerCase() !== "normal").length;
};

export const getNormalCount = () => {
  const logs = getAttackLogs();
  return logs.filter(log => log.label && log.label.toLowerCase() === "normal").length;
};

export const getAttackRate = () => {
  const total = getTotalPredictions();
  if (total === 0) return 0;
  const attacks = getAttackCount();
  return ((attacks / total) * 100).toFixed(1);
};
