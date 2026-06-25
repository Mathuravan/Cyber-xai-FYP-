import { API_BASE, getToken } from "./authService"


// =====================================
// PARSE API ERRORS
// =====================================
async function parseError(res) {

  try {

    const data = await res.json()

    if (typeof data.detail === "string") {
      return data.detail
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => item.msg)
        .join(", ")
    }

    return "Request failed"

  } catch {

    return "Request failed"

  }

}


// =====================================
// HEALTH CHECK
// =====================================
export const checkHealth = async () => {

  const res = await fetch(
    `${API_BASE}/health`
  )

  if (!res.ok) {

    throw new Error(
      "Backend health check failed"
    )

  }

  return res.json()

}


// =====================================
// SINGLE PREDICTION
// =====================================
export const predictSingle = async (
  features
) => {

  const token = getToken()
  if (!token) {
    throw new Error("Authentication required")
  }

  const res = await fetch(
    `${API_BASE}/predict`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(features),
    }
  )

  if (!res.ok) {

    throw new Error(
      await parseError(res)
    )

  }

  return res.json()

}


// =====================================
// BATCH PREDICTION
// =====================================
export const predictBatch = async (
  file,
  mapping = null
) => {

  const token = getToken()
  if (!token) {
    throw new Error("Authentication required")
  }

  const formData = new FormData()

  formData.append("file", file)

  if (mapping) {
    formData.append(
      "mapping",
      JSON.stringify(mapping)
    )
  }

  const res = await fetch(
    `${API_BASE}/predict/batch`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    }
  )

  if (!res.ok) {

    throw new Error(
      await parseError(res)
    )

  }

  return res.json()

}


// =====================================
// MODEL METRICS
// =====================================
export const fetchModelMetrics = async () => {

  const res = await fetch(
    `${API_BASE}/model/metrics`
  )

  if (!res.ok) {
    throw new Error(
      await parseError(res)
    )
  }

  return res.json()

}


// =====================================
// USER PREDICTION LOGS
// =====================================
export const fetchPredictionLogs = async (limit = 100) => {

  const token = getToken()
  if (!token) {
    throw new Error("Authentication required")
  }

  const res = await fetch(
    `${API_BASE}/api/logs?limit=${limit}`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  )

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  const data = await res.json()

  if (!data || !Array.isArray(data.logs)) {
    throw new Error("Unexpected logs response")
  }

  return data.logs

}


// =====================================
// COMBINED XAI EXPLANATION (SHAP + LIME)
// =====================================
export const explainCombined = async (features) => {

  const token = getToken()
  if (!token) {
    throw new Error("Authentication required")
  }

  const res = await fetch(
    `${API_BASE}/api/explain/combined`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(features),
    }
  )

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  return res.json()

}


// =====================================
// MODEL RESILIENCE TEST
// =====================================
export const testResilience = async (features) => {

  const token = getToken()
  if (!token) {
    throw new Error("Authentication required")
  }

  const res = await fetch(
    `${API_BASE}/api/test/resilience`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(features),
    }
  )

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  return res.json()

}
