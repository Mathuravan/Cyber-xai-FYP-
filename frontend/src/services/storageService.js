const KEYS = {

  latest: "cyberxai_latest_prediction",

  csv: "cyberxai_csv_summary",

  logs: "cyberxai_attack_logs"

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