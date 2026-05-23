from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pandas as pd

from io import BytesIO


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
# DUMMY PREDICTION LOGIC
# =====================================
def dummy_predict(count: float) -> dict:

    if count > 50:

        return {
            "label": "Attack",
            "confidence": 0.85,
        }

    return {
        "label": "Normal",
        "confidence": 0.92,
    }


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
        "prediction_mode": "dummy",
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

    result = dummy_predict(data.count)

    return {
        "label": result["label"],
        "confidence": result["confidence"],
    }


# =====================================
# BATCH CSV PREDICTION API
# =====================================
@app.post("/predict/batch")
async def predict_batch(
    file: UploadFile = File(...)
):

    """
    Dummy batch prediction logic.
    """

    if (
        not file.filename or
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

    missing = [
        col for col in FEATURES
        if col not in df.columns
    ]

    if missing:

        raise HTTPException(
            status_code=400,
            detail=f"CSV missing columns: {', '.join(missing)}",
        )

    results = []

    normal_count = 0

    attack_count = 0

    for index, row in df.iterrows():

        prediction = dummy_predict(
            float(row["count"])
        )

        label = prediction["label"]

        confidence = prediction["confidence"]

        if label == "Normal":

            normal_count += 1

        else:

            attack_count += 1

        results.append({
            "row": int(index) + 1,
            "label": label,
            "confidence": confidence,
        })

    return {
        "filename": file.filename,
        "total_rows": len(results),
        "columns": len(FEATURES),
        "normal_count": normal_count,
        "attack_count": attack_count,
        "results": results,
    }