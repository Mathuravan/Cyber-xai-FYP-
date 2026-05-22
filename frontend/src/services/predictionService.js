import { API_BASE } from "./authService";

// =======================
// HEALTH CHECK
// =======================
export const checkHealth = async () => {

  const res = await fetch(
    `${API_BASE}/health`
  );

  if (!res.ok) {
    throw new Error("Health check failed");
  }

  return res.json();

};

// =======================
// SINGLE PREDICTION
// =======================
export const predictSingle = async (data) => {

  const res = await fetch(
    `${API_BASE}/predict`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );

  if (!res.ok) {
    throw new Error("Prediction failed");
  }

  return res.json();

};

// =======================
// BATCH PREDICTION
// =======================
export const predictBatch = async (formData) => {

  const res = await fetch(
    `${API_BASE}/predict/batch`,
    {
      method: "POST",
      body: formData
    }
  );

  if (!res.ok) {
    throw new Error("Batch prediction failed");
  }

  return res.json();

};