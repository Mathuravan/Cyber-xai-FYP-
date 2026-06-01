from fastapi import (
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    Header,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from pydantic import BaseModel

import pandas as pd
import joblib
import hashlib
import jwt

from datetime import (
    datetime,
    timedelta,
)

from io import BytesIO
from pathlib import Path

# =====================================
# AUTH CONFIG
# =====================================
SECRET_KEY = (
    "cyberxai_super_secret_key"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

# =====================================
# TEMP USER DATABASE
# =====================================
users_db = {}

# =====================================
# MODEL PATH
# =====================================
BASE_DIR = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "nslkdd_4f_rf_model.joblib"
)

# =====================================
# LOAD MODEL
# =====================================
ml_model = None

try:

    if MODEL_PATH.exists():

        ml_model = joblib.load(
            MODEL_PATH
        )

        print(
            f"Model loaded: {MODEL_PATH}"
        )

    else:

        print(
            "Model file not found."
        )

except Exception as e:

    print(
        f"Model loading failed: {e}"
    )

# =====================================
# FASTAPI APP
# =====================================
app = FastAPI(
    title="CyberXAI API",
    version="1.0.0",
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
# REQUIRED FEATURES
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
# PASSWORD HASHING
# =====================================
def hash_password(
    password: str
) -> str:

    return hashlib.sha256(
        password.encode()
    ).hexdigest()

# =====================================
# VERIFY PASSWORD
# =====================================
def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:

    return (
        hash_password(
            plain_password
        )
        == hashed_password
    )

# =====================================
# CREATE JWT TOKEN
# =====================================
def create_access_token(
    data: dict
):

    to_encode = data.copy()

    expire = (
        datetime.utcnow()
        + timedelta(
            minutes=
            ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt

# =====================================
# VERIFY JWT TOKEN
# =====================================
def verify_token(authorization: str) -> str:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization token",
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid token format",
        )
    
    token = authorization.split("Bearer ")[1]
    
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

# =====================================
# THREAT LEVEL
# =====================================
def get_threat_level(
    confidence: float
):

    if confidence >= 0.85:
        return "High"

    elif confidence >= 0.60:
        return "Medium"

    return "Low"

# =====================================
# SHAP-STYLE FEATURE CONTRIBUTIONS
# (lightweight heuristic scores for UI)
# =====================================
def compute_shap_values(
    duration: float,
    src_bytes: float,
    dst_bytes: float,
    count: float,
) -> dict:

    # Short-lived flows often correlate with scans / floods
    if duration < 2:
        duration_score = 0.35
    elif duration < 10:
        duration_score = 0.08
    else:
        duration_score = -0.12

    # High outbound bytes can indicate exfiltration
    if src_bytes > 10000:
        src_score = 0.55
    elif src_bytes > 5000:
        src_score = 0.44
    elif src_bytes > 2000:
        src_score = 0.18
    else:
        src_score = -0.10

    # Elevated destination bytes add moderate risk
    if dst_bytes > 8000:
        dst_score = 0.28
    elif dst_bytes > 4000:
        dst_score = 0.18
    elif dst_bytes > 1500:
        dst_score = 0.06
    else:
        dst_score = -0.06

    # High connection counts are strongly suspicious
    if count > 80:
        count_score = 0.85
    elif count > 50:
        count_score = 0.71
    elif count > 30:
        count_score = 0.45
    elif count > 15:
        count_score = 0.20
    else:
        count_score = -0.15

    return {
        "duration": round(duration_score, 2),
        "src_bytes": round(src_score, 2),
        "dst_bytes": round(dst_score, 2),
        "count": round(count_score, 2),
    }

# =====================================
# HOME
# =====================================
@app.get("/")
def home():

    return {
        "message":
        "CyberXAI Backend Running"
    }

# =====================================
# HEALTH CHECK
# =====================================
@app.get("/health")
def health():

    return {
        "status": "ok",

        "service":
        "CyberXAI",

        "model_loaded":
        ml_model is not None,
    }

# =====================================
# SIGNUP
# =====================================
@app.post("/signup")
def signup(data: SignupData):

    if (
        data.username
        in users_db
    ):

        raise HTTPException(
            status_code=400,
            detail=
            "Username already exists",
        )

    hashed_password = (
        hash_password(
            data.password
        )
    )

    users_db[data.username] = {
        "username":
        data.username,

        "email":
        data.email,

        "password":
        hashed_password,
    }

    return {
        "message":
        "Signup successful",

        "username":
        data.username,
    }

# =====================================
# LOGIN
# =====================================
@app.post("/login")
def login(data: LoginData):

    user = users_db.get(
        data.username
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail=
            "Invalid username or password",
        )

    if not verify_password(
        data.password,
        user["password"],
    ):

        raise HTTPException(
            status_code=401,
            detail=
            "Invalid username or password",
        )

    token = (
        create_access_token({
            "sub":
            data.username
        })
    )

    return {
        "token": token,

        "user":
        data.username,
    }

# =====================================
# SINGLE PREDICTION
# =====================================
@app.post("/predict")
def predict(
    data: PredictData,
    authorization: str = Header(None)
):

    username = verify_token(authorization)

    if ml_model is None:

        raise HTTPException(
            status_code=500,
            detail=
            "ML model not loaded.",
        )

    try:

        input_df = pd.DataFrame([
            {
                "duration":
                data.duration,

                "src_bytes":
                data.src_bytes,

                "dst_bytes":
                data.dst_bytes,

                "count":
                data.count,
            }
        ])

        prediction = (
            ml_model.predict(
                input_df
            )[0]
        )

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

        shap_values = compute_shap_values(
            data.duration,
            data.src_bytes,
            data.dst_bytes,
            data.count,
        )

        return {
            "label":
            label,

            "confidence":
            round(
                confidence,
                4
            ),

            "threat_level":
            threat_level,

            "shap_values":
            shap_values,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,

            detail=
            f"Prediction failed: {str(e)}",
        )

# =====================================
# BATCH PREDICTION
# =====================================
@app.post("/predict/batch")
async def predict_batch(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):

    username = verify_token(authorization)

    if ml_model is None:

        raise HTTPException(
            status_code=500,
            detail=
            "ML model not loaded.",
        )

    if (
        not file.filename
        or
        not file.filename
        .lower()
        .endswith(".csv")
    ):

        raise HTTPException(
            status_code=400,

            detail=
            "Please upload a CSV file.",
        )

    try:

        contents = (
            await file.read()
        )

        df = pd.read_csv(
            BytesIO(contents)
        )

    except Exception:

        raise HTTPException(
            status_code=400,

            detail=
            "Could not read CSV file.",
        )

    # =====================================
    # CHECK REQUIRED COLUMNS
    # =====================================
    missing = [
        col
        for col in FEATURES
        if col not in df.columns
    ]

    if missing:

        raise HTTPException(
            status_code=400,

            detail=
            f"CSV missing columns: {', '.join(missing)}",
        )

    try:

        input_df = df[
            FEATURES
        ]

        predictions = (
            ml_model.predict(
                input_df
            )
        )

        probabilities = (
            ml_model.predict_proba(
                input_df
            )
        )

        results = []

        normal_count = 0

        attack_count = 0

        for index in range(
            len(df)
        ):

            pred_class = (
                predictions[index]
            )

            probs = (
                probabilities[index]
            )

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
                "row":
                int(index) + 1,

                "label":
                label,

                "confidence":
                round(
                    confidence,
                    4
                ),
            })

        return {
            "filename":
            file.filename,

            "total_rows":
            len(results),

            "columns":
            len(FEATURES),

            "normal_count":
            normal_count,

            "attack_count":
            attack_count,

            "results":
            results,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,

            detail=
            f"Batch prediction failed: {str(e)}",
        )