import { useState } from "react"

import {
  predictSingle
} from "../services/predictionService"

import {
  saveLatestPrediction,
  addAttackLog,
} from "../services/storageService"


const FEATURES = [
  {
    name: "duration",
    label: "Duration",
    placeholder: "12",
  },
  {
    name: "src_bytes",
    label: "Source bytes",
    placeholder: "7000",
  },
  {
    name: "dst_bytes",
    label: "Destination bytes",
    placeholder: "4000",
  },
  {
    name: "count",
    label: "Count",
    placeholder: "30",
  },
]


const EMPTY_FORM = {
  duration: "",
  src_bytes: "",
  dst_bytes: "",
  count: "",
}


// =====================================
// THREAT LEVEL LOGIC
// =====================================
function getThreatLevel(
  label,
  confidence
) {

  if (label === "Normal") {

    return {
      level: "Low",
      className: "ok",
    }

  }

  if (confidence >= 0.8) {

    return {
      level: "High",
      className: "bad",
    }

  }

  return {
    level: "Medium",
    className: "pending",
  }

}


// =====================================
// COMPONENT
// =====================================
export default function SinglePredict() {

  const [form, setForm] =
    useState(EMPTY_FORM)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [result, setResult] =
    useState(null)


  // =====================================
  // INPUT CHANGE
  // =====================================
  const handleChange = (e) => {

    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setError("")

  }


  // =====================================
  // SAMPLE VALUES
  // =====================================
  const loadSampleValues = () => {

    setForm({
      duration: "12",
      src_bytes: "7000",
      dst_bytes: "4000",
      count: "30",
    })

    setError("")

  }


  // =====================================
  // SUBMIT FORM
  // =====================================
  const handleSubmit = async (e) => {

    e.preventDefault()

    setError("")

    setResult(null)

    setLoading(true)

    try {

      const payload = {
        duration: Number(form.duration),
        src_bytes: Number(form.src_bytes),
        dst_bytes: Number(form.dst_bytes),
        count: Number(form.count),
      }

      if (
        Object.values(payload).some(
          (value) => Number.isNaN(value)
        )
      ) {

        throw new Error(
          "Please enter valid numbers."
        )

      }

      const data =
        await predictSingle(payload)

      const threat =
        getThreatLevel(
          data.label,
          data.confidence
        )

      const timestamp =
        new Date().toLocaleString()

      const displayResult = {
        label: data.label,
        confidence: data.confidence,
        threatLevel: threat.level,
        threatClass: threat.className,
        timestamp,
      }

      setResult(displayResult)

      const logEntry = {
        label: data.label,
        confidence: data.confidence,
        timestamp,
        source: "Single predict",
        features: payload,
      }

      saveLatestPrediction(logEntry)

      addAttackLog(logEntry)

    } catch (err) {

      setError(
        err.message ||
        "Prediction failed."
      )

    } finally {

      setLoading(false)

    }

  }


  const labelClass =
    result?.label?.toLowerCase() || ""


  return (

    <div className="predict-page">

      <div className="topbar">

        <h1>Single prediction</h1>

        <p>
          Analyze one network flow
          using NSL-KDD features.
        </p>

      </div>

    </div>

  )

}