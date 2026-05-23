import { API_BASE } from "./authService"


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

  const res = await fetch(
    `${API_BASE}/predict`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
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
  file
) => {

  const formData = new FormData()

  formData.append("file", file)

  const res = await fetch(
    `${API_BASE}/predict/batch`,
    {
      method: "POST",
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