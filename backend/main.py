from pathlib import Path
from io import StringIO
import json
import joblib
import pandas as pd
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --------------------------------------------------
# App setup
# --------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Paths
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

MODEL_PATH = MODELS_DIR / "nslkdd_4f_rf_model.joblib"
FEATURES_PATH = MODELS_DIR / "nslkdd_4f_features.json"

# --------------------------------------------------
# Load model and feature list
# --------------------------------------------------
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

if not FEATURES_PATH.exists():
    raise FileNotFoundError(f"Feature file not found: {FEATURES_PATH}")

model = joblib.load(MODEL_PATH)

with open(FEATURES_PATH, "r") as f:
    selected_features = json.load(f)

# --------------------------------------------------
# Input schema
# --------------------------------------------------
class TrafficInput(BaseModel):
    duration: float
    src_bytes: float
    dst_bytes: float
    count: float

# --------------------------------------------------
# Helper function
# --------------------------------------------------
def build_prediction_response(input_df: pd.DataFrame):
    prediction_nums = model.predict(input_df)
    prediction_probas = model.predict_proba(input_df)

    feature_importances = model.feature_importances_
    ranked_features = sorted(
        zip(selected_features, feature_importances),
        key=lambda x: x[1],
        reverse=True
    )

    top_features = [feature for feature, _ in ranked_features[:3]]

    prediction_results = []
    for i in range(len(input_df)):
        prediction_label = "Malicious" if int(prediction_nums[i]) == 1 else "Normal"
        confidence = round(float(max(prediction_probas[i]) * 100), 2)

        prediction_results.append({
            "prediction": prediction_label,
            "confidence": confidence,
            "top_features": top_features,
            "feature_importance_scores": [
                {"feature": feature, "score": round(float(score), 4)}
                for feature, score in ranked_features
            ],
            "received_input": input_df.iloc[i].to_dict()
        })

    return prediction_results

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.get("/")
def home():
    return {"message": "CyberXAI backend is running with real NSL-KDD model"}

@app.get("/system-status")
def system_status():
    return {"status": "CyberXAI system is active"}

@app.get("/model-info")
def model_info():
    return {
        "model_name": "NSL-KDD 4-feature Random Forest",
        "features": selected_features
    }

@app.post("/predict")
def predict(data: TrafficInput):
    input_dict = {
        "duration": data.duration,
        "src_bytes": data.src_bytes,
        "dst_bytes": data.dst_bytes,
        "count": data.count,
    }

    input_df = pd.DataFrame([input_dict], columns=selected_features)
    prediction_results = build_prediction_response(input_df)

    return prediction_results[0]

@app.post("/predict-csv")
async def predict_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        return {"error": "Please upload a CSV file."}

    content = await file.read()

    try:
        df = pd.read_csv(StringIO(content.decode("utf-8")))
    except Exception:
        return {"error": "Could not read CSV file."}

    missing_columns = [col for col in selected_features if col not in df.columns]
    if missing_columns:
        return {
            "error": "CSV is missing required columns.",
            "missing_columns": missing_columns,
            "required_columns": selected_features
        }

    input_df = df[selected_features].copy()
    prediction_results = build_prediction_response(input_df)

    malicious_count = sum(1 for item in prediction_results if item["prediction"] == "Malicious")
    normal_count = sum(1 for item in prediction_results if item["prediction"] == "Normal")

    sample_results = prediction_results[:10]

    return {
        "filename": file.filename,
        "total_rows": len(prediction_results),
        "malicious_count": malicious_count,
        "normal_count": normal_count,
        "sample_results": sample_results,
        "used_features": selected_features
    }