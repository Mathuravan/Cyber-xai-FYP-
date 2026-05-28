from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pandas as pd
import joblib

from io import BytesIO
from pathlib import Path


# =====================================
# PATH SETUP & MODEL LOADING
# =====================================
BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "nslkdd_4f_rf_model.joblib"
)

ml_model = None

try:

    if MODEL_PATH.exists():

        ml_model = joblib.load(
            MODEL_PATH
        )

        print(
            f"Successfully loaded model: {MODEL_PATH}"
        )

    else:

        print(
            f"Model not found: {MODEL_PATH}"
        )

except Exception as e:

    print(
        f"Error loading model: {e}"
    )


# =====================================
# FASTAPI APP
# =====================================
app = FastAPI(
    title="CyberXAI API",
    version="1.0.0"
)


# =====================================
# CORS
# =====================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================
# FEATURE LIST
# =====================================
FEATURES = [
    "duration",
    "src_bytes",
    "dst_bytes",
    "count",
]


# =====================================
# REQUEST MODELS
# =====================================
class SignupData(BaseModel):

    username: str
    email: str
    password: str


class LoginData(BaseModel):

    username: str
    password: str


class PredictData(BaseModel):

    duration: float
    src_bytes: float
    dst_bytes: float
    count: float


# =====================================
# HELPER FUNCTIONS
# =====================================
def get_threat_level(confidence: float):

    if confidence >= 0.85:
        return "High"

    elif confidence >= 0.60:
        return "Medium"

    return "Low"


# =====================================
# ROOT ROUTE
# =====================================
@app.get("/")
def home():

    return {
        "message": "CyberXAI Backend Running"
    }


# =====================================
# HEALTH CHECK
# =====================================
@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "CyberXAI",
        "model_loaded": ml_model is not None,
    }


# =====================================
# SIGNUP API
# =====================================
@app.post("/signup")
def signup(data: SignupData):

    return {
        "message": "Signup successful",
        "username": data.username,
    }


# =====================================
# LOGIN API
# =====================================
@app.post("/login")
def login(data: LoginData):

    return {
        "token": "fake-jwt-token",
        "user": data.username,
    }


# =====================================
# SINGLE PREDICTION API
# =====================================
@app.post("/predict")
def predict(data: PredictData):

    if ml_model is None:

        raise HTTPException(
            status_code=500,
            detail="ML model not loaded."
        )

    try:

        input_df = pd.DataFrame([{
            "duration": data.duration,
            "src_bytes": data.src_bytes,
            "dst_bytes": data.dst_bytes,
            "count": data.count,
        }])

        prediction = ml_model.predict(
            input_df
        )[0]

        probabilities = (
            ml_model.predict_proba(
                input_df
            )[0]
        )

        if prediction == 1:

            label = "Attack"

            confidence = float(
                probabilities[1]
            )

            threat_level = (
                get_threat_level(
                    confidence
                )
            )

        else:

            label = "Normal"

            confidence = float(
                probabilities[0]
            )

            threat_level = "Safe"

        return {
            "label": label,
            "confidence": round(
                confidence,
                4
            ),
            "threat_level": threat_level,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# =====================================
# BATCH CSV PREDICTION API
# =====================================
@app.post("/predict/batch")
async def predict_batch(
    file: UploadFile = File(...)
):

    if ml_model is None:

        raise HTTPException(
            status_code=500,
            detail="ML model not loaded."
        )

    if (
        not file.filename
        or
        not file.filename.lower().endswith(".csv")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    try:

        contents = await file.read()

        df = pd.read_csv(
            BytesIO(contents)
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Could not read CSV file.",
        )

    # =====================================
    # VALIDATE REQUIRED FEATURES
    # =====================================
    missing = [
        col for col in FEATURES
        if col not in df.columns
    ]

    if missing:

        raise HTTPException(
            status_code=400,
            detail=f"CSV missing columns: {', '.join(missing)}",
        )

    try:

        # =====================================
        # EXTRACT MODEL FEATURES
        # =====================================
        input_df = df[FEATURES]

        # =====================================
        # BULK ML PREDICTION
        # =====================================
        predictions = ml_model.predict(
            input_df
        )

        probabilities = (
            ml_model.predict_proba(
                input_df
            )
        )

        results = []

        normal_count = 0
        attack_count = 0

        # =====================================
        # FORMAT RESULTS
        # =====================================
        for index in range(len(df)):

            pred_class = predictions[index]

            probs = probabilities[index]

            if pred_class == 1:

                label = "Attack"

                confidence = float(
                    probs[1]
                )

                attack_count += 1

            else:

                label = "Normal"

                confidence = float(
                    probs[0]
                )

                normal_count += 1

            results.append({
                "row": int(index) + 1,
                "label": label,
                "confidence": round(
                    confidence,
                    4
                ),
            })

        return {
            "filename": file.filename,
            "total_rows": len(results),
            "columns": len(FEATURES),
            "normal_count": normal_count,
            "attack_count": attack_count,
            "results": results,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction failed: {str(e)}"
        )