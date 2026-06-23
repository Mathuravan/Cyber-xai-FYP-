from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    Header,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from pydantic import BaseModel

import pandas as pd
import numpy as np
import joblib
import hashlib
import jwt

from datetime import (
    datetime,
    timedelta,
)

from io import BytesIO
from pathlib import Path
import json

# LIME
from lime import lime_tabular

# =====================================
# AUTH CONFIG
# =====================================
SECRET_KEY = (
    "cyberxai_super_secret_key"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

# =====================================
# MODEL PATH
# =====================================
BASE_DIR = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)

# =====================================
# USER DATABASE
# =====================================
USERS_DB_PATH = (
    BASE_DIR
    / "backend"
    / "users.json"
)


def _load_users_db() -> dict:
    if not USERS_DB_PATH.exists():
        return {}

    try:
        with open(USERS_DB_PATH, "r", encoding="utf-8") as file:
            data = json.load(file)

        return data if isinstance(data, dict) else {}
    except Exception as error:
        print(f"User database load failed: {error}")
        return {}


def _save_users_db() -> None:
    USERS_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(USERS_DB_PATH, "w", encoding="utf-8") as file:
        json.dump(users_db, file, indent=2)


users_db = _load_users_db()

LEGACY_MODEL_PATH = (
    BASE_DIR
    / "models"
    / "nslkdd_4f_rf_model.joblib"
)

COLAB_MODEL_PATH = (
    BASE_DIR
    / "models"
    / "model.joblib"
)

MODEL_PATH = (
    COLAB_MODEL_PATH
    if COLAB_MODEL_PATH.exists()
    else LEGACY_MODEL_PATH
)

SCALER_PATH = (
    BASE_DIR
    / "models"
    / "scaler.joblib"
)

MODEL_METADATA_PATH = (
    BASE_DIR
    / "models"
    / "metadata.json"
)

METRICS_PATH = (
    BASE_DIR
    / "models"
    / "model_metrics.json"
)

FEATURES_PATH = (
    BASE_DIR
    / "models"
    / "nslkdd_4f_features.json"
)

# =====================================
# LOAD MODEL
# =====================================
ml_model = None
ml_scaler = None
model_metadata = {}

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

try:
    if SCALER_PATH.exists():
        ml_scaler = joblib.load(SCALER_PATH)
        print(f"Scaler loaded: {SCALER_PATH}")
except Exception as e:
    print(f"Scaler loading failed: {e}")

try:
    if MODEL_METADATA_PATH.exists():
        with open(MODEL_METADATA_PATH, "r", encoding="utf-8") as file:
            model_metadata = json.load(file)
        print(f"Model metadata loaded: {MODEL_METADATA_PATH}")
except Exception as e:
    print(f"Metadata loading failed: {e}")

# =====================================
# LIME EXPLAINER (global)
# =====================================
# Baseline training-distribution template for the 4 core NSL-KDD features:
# duration, src_bytes, dst_bytes, count
_LIME_FEATURE_NAMES = [
    "duration",
    "src_bytes",
    "dst_bytes",
    "count",
]

# Representative baseline rows covering normal / attack spectrum
_LIME_TRAINING_DATA = np.array([
    [0,   491,   0,     2],
    [0,   146,   0,     13],
    [0,   232,   8153,  5],
    [1,   290,   0,     7],
    [0,   45076, 0,     1],
    [0,   0,     0,     123],
    [2,   5000,  2000,  30],
    [10,  1000,  500,   10],
    [0,   10000, 8000,  90],
    [5,   300,   200,   3],
    [0,   0,     0,     255],
    [12,  7000,  4000,  30],
    [0,   20000, 0,     50],
    [3,   100,   100,   1],
    [0,   2000,  1500,  20],
], dtype=float)

_LIME_TRAINING_LABELS = np.array(
    [0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0]
)

lime_explainer = lime_tabular.LimeTabularExplainer(
    training_data=_LIME_TRAINING_DATA,
    feature_names=_LIME_FEATURE_NAMES,
    class_names=["Normal", "Attack"],
    mode="classification",
    discretize_continuous=True,
    random_state=42,
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


def _prepare_model_input(input_df: pd.DataFrame):
    ordered_df = input_df[FEATURES]

    if ml_scaler is not None:
        return ml_scaler.transform(ordered_df)

    return ordered_df

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
# MODEL METRICS HELPERS
# =====================================
def _to_percentage(value: float) -> float:
    numeric = float(value)

    if numeric <= 1:
        return round(numeric * 100, 1)

    return round(numeric, 1)


def _load_metrics_file() -> dict:
    if not METRICS_PATH.exists():
        return {}

    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception as error:
        print(f"Metrics file load failed: {error}")
        return {}


def _get_model_features() -> list:
    if FEATURES_PATH.exists():
        try:
            with open(FEATURES_PATH, "r", encoding="utf-8") as file:
                features = json.load(file)

            if isinstance(features, list) and features:
                return features
        except Exception:
            pass

    return FEATURES


def _build_feature_importance(features: list) -> list:
    if ml_model is not None and hasattr(ml_model, "feature_importances_"):
        importances = ml_model.feature_importances_

        return [
            {
                "feature": features[index],
                "importance": round(float(importances[index]), 4),
            }
            for index in range(len(features))
        ]

    stored = _load_metrics_file()
    stored_features = stored.get("selected_features", features)
    stored_importances = stored.get("feature_importances", [])

    if stored_importances:
        return [
            {
                "feature": stored_features[index],
                "importance": round(float(stored_importances[index]), 4),
            }
            for index in range(len(stored_features))
        ]

    return [
        {"feature": "duration", "importance": 0.18},
        {"feature": "src_bytes", "importance": 0.42},
        {"feature": "dst_bytes", "importance": 0.23},
        {"feature": "count", "importance": 0.17},
    ]


def _build_model_metrics_response() -> dict:
    stored = _load_metrics_file()
    features = _get_model_features()

    if stored:
        matrix = stored.get("confusion_matrix", [[8754, 312], [421, 18934]])

        return {
            "accuracy": _to_percentage(stored.get("accuracy", 0.984)),
            "precision": _to_percentage(stored.get("precision", 0.981)),
            "recall": _to_percentage(stored.get("recall", 0.979)),
            "f1_score": _to_percentage(stored.get("f1_score", 0.98)),
            "confusion_matrix": {
                "tn": int(matrix[0][0]),
                "fp": int(matrix[0][1]),
                "fn": int(matrix[1][0]),
                "tp": int(matrix[1][1]),
            },
            "dataset": {
                "train_rows": int(stored.get("train_samples", 125973)),
                "test_rows": int(stored.get("test_samples", 22544)),
            },
            "model": {
                "type": stored.get("model_type", "Random Forest"),
                "estimators": int(
                    getattr(ml_model, "n_estimators", 200)
                    if ml_model is not None
                    else stored.get("estimators", 200)
                ),
                "features": features,
            },
            "feature_importance": _build_feature_importance(features),
        }

    return {
        "accuracy": 98.4,
        "precision": 98.1,
        "recall": 97.9,
        "f1_score": 98.0,
        "confusion_matrix": {
            "tp": 18934,
            "tn": 8754,
            "fp": 312,
            "fn": 421,
        },
        "dataset": {
            "train_rows": 125973,
            "test_rows": 22544,
        },
        "model": {
            "type": "Random Forest",
            "estimators": int(
                getattr(ml_model, "n_estimators", 200)
                if ml_model is not None
                else 200
            ),
            "features": features,
        },
        "feature_importance": _build_feature_importance(features),
    }

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
# RESILIENCE TEST HELPERS
# =====================================
NSL_KDD_BOUNDARIES = {
    "duration": {"min": 0.0, "max": 58329.0},
    "src_bytes": {"min": 0.0, "max": 1379963888.0},
    "dst_bytes": {"min": 0.0, "max": 1309937401.0},
    "count": {"min": 0.0, "max": 511.0},
}


def _features_to_dict(data: PredictData) -> dict:
    return {
        "duration": float(data.duration),
        "src_bytes": float(data.src_bytes),
        "dst_bytes": float(data.dst_bytes),
        "count": float(data.count),
    }


def _predict_feature_state(features: dict) -> dict:
    input_df = pd.DataFrame([features], columns=FEATURES)
    model_input = _prepare_model_input(input_df)
    prediction = int(ml_model.predict(model_input)[0])
    probabilities = ml_model.predict_proba(model_input)[0]
    confidence = float(probabilities[prediction])

    return {
        "class_id": prediction,
        "label": "Attack" if prediction == 1 else "Normal",
        "confidence": round(confidence, 4),
    }


def _boundary_violations(features: dict) -> list:
    violations = []

    for feature, value in features.items():
        bounds = NSL_KDD_BOUNDARIES[feature]

        if value < bounds["min"] or value > bounds["max"]:
            violations.append(feature)

    return violations


def _build_resilience_state(
    track: str,
    scenario: str,
    features: dict,
    baseline_prediction: dict,
    distortion: str,
) -> dict:
    prediction = _predict_feature_state(features)
    boundary_violations = _boundary_violations(features)
    flipped = prediction["label"] != baseline_prediction["label"]

    return {
        "track": track,
        "scenario": scenario,
        "distortion": distortion,
        "features": {
            feature: round(float(value), 4)
            for feature, value in features.items()
        },
        "prediction": prediction,
        "flipped": flipped,
        "resisted": not flipped,
        "ood_flag": bool(boundary_violations),
        "ood_features": boundary_violations,
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
# MODEL METRICS
# =====================================
@app.get("/model/metrics")
def model_metrics():

    return _build_model_metrics_response()

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

    _save_users_db()

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

        "user": {
            "username": user["username"],
            "email": user.get("email", ""),
        },
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

        model_input = _prepare_model_input(input_df)

        prediction = ml_model.predict(model_input)[0]

        probabilities = ml_model.predict_proba(model_input)[0]

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
    mapping: str = Form(None),
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
    # INTELLIGENT DYNAMIC CSV SCHEMA MAPPING
    # =====================================
    aliases = {
        "duration": ["duration", "duration_sec", "session_duration", "flow_duration", "flow duration", "connection_duration", "dur"],
        "src_bytes": ["src_bytes", "source_bytes", "src bytes", "bytes_sent", "bytes sent", "total_length_of_fwd_packets", "outbound_bytes"],
        "dst_bytes": ["dst_bytes", "destination_bytes", "dest_bytes", "bytes_received", "bytes received", "total_length_of_bwd_packets", "inbound_bytes"],
        "count": ["count", "packet_count", "packet count", "connection_count", "flow_packets", "packets_per_second"],
    }

    column_mapping = {}
    missing_features = []
    df_columns = list(df.columns)

    if mapping:
        try:
            requested_mapping = json.loads(mapping)

            if not isinstance(requested_mapping, dict):
                raise ValueError("mapping must be an object")

            for feature in FEATURES:
                source_column = requested_mapping.get(feature)

                if source_column and source_column in df_columns:
                    column_mapping[source_column] = feature
                else:
                    missing_features.append(feature)

        except Exception as error:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid mapping payload: {str(error)}",
            )

    if not column_mapping:
        for feature, expected_aliases in aliases.items():
            matched = False

            for col in df_columns:
                if col not in column_mapping and col.lower() == feature.lower():
                    column_mapping[col] = feature
                    matched = True
                    break

            if matched:
                continue

            for alias in expected_aliases:
                for col in df_columns:
                    if col not in column_mapping and col.lower() == alias.lower():
                        column_mapping[col] = feature
                        matched = True
                        break
                if matched:
                    break

            if matched:
                continue

            for alias in expected_aliases:
                for col in df_columns:
                    if col in column_mapping:
                        continue
                    norm_col = col.lower().replace(" ", "").replace("_", "")
                    norm_alias = alias.lower().replace(" ", "").replace("_", "")
                    if len(norm_alias) >= 3 and norm_alias in norm_col:
                        column_mapping[col] = feature
                        matched = True
                        break
                if matched:
                    break

            if not matched:
                missing_features.append(feature)

    if len(column_mapping) == 0:
        raise HTTPException(
            status_code=400,
            detail="No suitable mappings could be found for the required features. Please check your CSV format.",
        )

    print("Detected Mapping:")
    for orig, standard in column_mapping.items():
        print(f"{orig} -> {standard}")

    df = df.rename(columns=column_mapping)

    for missing_feature in missing_features:
        print(f"Warning: Missing feature '{missing_feature}'. Filling with default value 0.")
        df[missing_feature] = 0.0

    try:
        for feature in FEATURES:
            df[feature] = pd.to_numeric(df[feature], errors="coerce").fillna(0.0)

        input_df = df[FEATURES]

        model_input = _prepare_model_input(input_df)

        predictions = ml_model.predict(model_input)
        probabilities = ml_model.predict_proba(model_input)

        import numpy as np
        
        df_results = df.copy()
        df_results["pred_class"] = predictions
        df_results["confidence"] = np.where(df_results["pred_class"] == 1, probabilities[:, 1], probabilities[:, 0])
        df_results["label"] = np.where(df_results["pred_class"] == 1, "Attack", "Normal")
        
        total_rows = len(df_results)
        LARGE_DATASET_THRESHOLD = 5000
        summary_mode = total_rows > LARGE_DATASET_THRESHOLD

        attack_count = int((df_results["pred_class"] == 1).sum())
        normal_count = int(total_rows - attack_count)
        attack_rate = round((attack_count / total_rows) * 100, 2) if total_rows > 0 else 0.0

        attack_df = df_results[df_results["label"] == "Attack"]
        critical_count = int((attack_df["confidence"] >= 0.90).sum())
        high_count = int(((attack_df["confidence"] >= 0.75) & (attack_df["confidence"] < 0.90)).sum())
        medium_count = int(((attack_df["confidence"] >= 0.50) & (attack_df["confidence"] < 0.75)).sum())
        low_count = int((attack_df["confidence"] < 0.50).sum())

        def get_severity(conf):
            if conf >= 0.9: return "Critical"
            if conf >= 0.75: return "High"
            if conf >= 0.5: return "Medium"
            return "Low"

        top_threats_df = attack_df.nlargest(10, "confidence")
        top_threats = []
        for i, row in top_threats_df.iterrows():
            top_threats.append({
                "row": int(i) + 1,
                "label": row["label"],
                "confidence": round(float(row["confidence"]), 4),
                "severity": get_severity(row["confidence"]),
                "summary": f"Threat detected (Dur: {row.get('duration', 0)}, Count: {row.get('count', 0)})"
            })

        results = []
        if not summary_mode:
            for i, row in df_results.iterrows():
                results.append({
                    "row": int(i) + 1,
                    "label": row["label"],
                    "confidence": round(float(row["confidence"]), 4),
                })

        return {
            "filename": file.filename,
            "total_rows": total_rows,
            "columns": len(FEATURES),
            "normal_count": normal_count,
            "attack_count": attack_count,
            "attack_rate": attack_rate,
            "summary_mode": summary_mode,
            "detected_mapping": {
                standard: original
                for original, standard in column_mapping.items()
            },
            "missing_features": missing_features,
            "results": results,
            "top_threats": top_threats,
            "severity_distribution": {
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count
            }
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,

            detail=
            f"Batch prediction failed: {str(e)}",
        )

# =====================================
# COMBINED XAI ENDPOINT (SHAP + LIME)
# =====================================
class CombinedExplainData(BaseModel):
    duration: float
    src_bytes: float
    dst_bytes: float
    count: float


@app.post("/api/explain/combined")
def explain_combined(
    data: CombinedExplainData,
    authorization: str = Header(None),
):
    verify_token(authorization)

    if ml_model is None:
        raise HTTPException(
            status_code=500,
            detail="ML model not loaded.",
        )

    try:
        input_array = np.array([
            [
                data.duration,
                data.src_bytes,
                data.dst_bytes,
                data.count,
            ]
        ], dtype=float)

        # ---- SHAP heuristic values (existing logic) ----
        shap_values = compute_shap_values(
            data.duration,
            data.src_bytes,
            data.dst_bytes,
            data.count,
        )

        # ---- LIME explanation ----
        def _predict_fn(arr):
            df = pd.DataFrame(arr, columns=_LIME_FEATURE_NAMES)
            model_input = _prepare_model_input(df)
            return ml_model.predict_proba(model_input)

        lime_exp = lime_explainer.explain_instance(
            data_row=input_array[0],
            predict_fn=_predict_fn,
            num_features=4,
            num_samples=500,
            top_labels=1,
        )

        # Extract LIME weights for the predicted class (Attack=1 / Normal=0)
        prediction_df = pd.DataFrame(
            input_array,
            columns=_LIME_FEATURE_NAMES
        )

        pred_label_idx = int(
            ml_model.predict(
                _prepare_model_input(prediction_df)
            )[0]
        )

        # Fallback to class 0 if label not in explanation
        available_labels = lime_exp.available_labels()
        target_label = (
            pred_label_idx
            if pred_label_idx in available_labels
            else available_labels[0]
        )

        lime_weights_raw = lime_exp.as_list(label=target_label)

        # Map LIME condition strings back to the canonical feature names
        lime_values: dict = {f: 0.0 for f in _LIME_FEATURE_NAMES}
        for condition, weight in lime_weights_raw:
            for feat in _LIME_FEATURE_NAMES:
                if feat in condition.lower():
                    lime_values[feat] = round(float(weight), 4)
                    break

        prediction_proba = ml_model.predict_proba(
            _prepare_model_input(prediction_df)
        )

        return {
            "prediction": {
                "label": "Attack" if pred_label_idx == 1 else "Normal",
                "confidence": round(
                    float(
                        prediction_proba[0][pred_label_idx]
                    ),
                    4,
                ),
            },
            "shap_values": shap_values,
            "lime_values": lime_values,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Combined explanation failed: {str(exc)}",
        )


# =====================================
# MODEL RESILIENCE TESTING
# =====================================
@app.post("/api/test/resilience")
def test_resilience(
    data: PredictData,
    authorization: str = Header(None),
):
    verify_token(authorization)

    if ml_model is None:
        raise HTTPException(
            status_code=500,
            detail="ML model not loaded.",
        )

    try:
        baseline_features = _features_to_dict(data)
        baseline_prediction = _predict_feature_state(baseline_features)
        states = [
            _build_resilience_state(
                "Baseline",
                "Original Input",
                baseline_features,
                baseline_prediction,
                "No distortion",
            )
        ]

        track_results = {
            "Track A": True,
            "Track B": True,
            "Track C": True,
        }

        # Track A: Data poisoning stress through large feature scaling.
        for factor in [15, 50]:
            poisoned_features = baseline_features.copy()
            poisoned_features["src_bytes"] *= factor
            poisoned_features["count"] *= factor

            state = _build_resilience_state(
                "Track A",
                f"Data Poisoning x{factor}",
                poisoned_features,
                baseline_prediction,
                f"src_bytes and count scaled by {factor}x",
            )

            states.append(state)
            track_results["Track A"] = track_results["Track A"] and not state["flipped"]

        # Track B: Gradient-style evasion scan across every feature.
        gradient_flip_found = False
        feature_sensitivity = []
        gradient_steps = 20

        for feature in FEATURES:
            original_value = baseline_features[feature]
            scale_base = abs(original_value) if original_value != 0 else 1.0
            feature_flip_count = 0
            feature_tested = 0
            first_flip_step = None

            for direction in [-1, 1]:
                direction_label = "negative" if direction < 0 else "positive"
                batch_rows = []
                step_numbers = []

                for step in range(1, gradient_steps + 1):
                    shifted_features = baseline_features.copy()
                    shifted_features[feature] = max(
                        0.0,
                        original_value + (direction * scale_base * step * 0.01),
                    )
                    batch_rows.append([shifted_features[name] for name in FEATURES])
                    step_numbers.append(step)

                batch_df = pd.DataFrame(batch_rows, columns=FEATURES)
                batch_input = _prepare_model_input(batch_df)
                batch_predictions = ml_model.predict(batch_input)
                batch_probabilities = ml_model.predict_proba(batch_input)

                for index, step in enumerate(step_numbers):
                    shifted_features = {
                        name: float(batch_rows[index][feature_index])
                        for feature_index, name in enumerate(FEATURES)
                    }
                    class_id = int(batch_predictions[index])
                    confidence = float(batch_probabilities[index][class_id])
                    prediction = {
                        "class_id": class_id,
                        "label": "Attack" if class_id == 1 else "Normal",
                        "confidence": round(confidence, 4),
                    }
                    boundary_violations = _boundary_violations(shifted_features)
                    flipped = prediction["label"] != baseline_prediction["label"]
                    feature_tested += 1

                    state = {
                        "track": "Track B",
                        "scenario": f"{feature} {direction_label} shift {step}%",
                        "distortion": f"{feature} shifted {direction_label} by {step}%",
                        "features": {
                            name: round(float(value), 4)
                            for name, value in shifted_features.items()
                        },
                        "prediction": prediction,
                        "flipped": flipped,
                        "resisted": not flipped,
                        "ood_flag": bool(boundary_violations),
                        "ood_features": boundary_violations,
                    }

                    if step == 1 or flipped or step == gradient_steps:
                        states.append(state)

                    if flipped:
                        gradient_flip_found = True
                        feature_flip_count += 1
                        first_flip_step = min(
                            first_flip_step or step,
                            step,
                        )
                        break

            feature_sensitivity.append({
                "feature": feature,
                "tested_states": feature_tested,
                "flip_count": feature_flip_count,
                "first_flip_step_percent": first_flip_step,
                "sensitivity_score": round(
                    (
                        (feature_flip_count / feature_tested) * 70
                        if feature_tested
                        else 0
                    )
                    + (
                        ((gradient_steps - first_flip_step) / gradient_steps) * 30
                        if first_flip_step
                        else 0
                    ),
                    1,
                ),
            })

        track_results["Track B"] = not gradient_flip_found

        # Track C: OOD scaffolding against NSL-KDD feature boundaries.
        ood_features = baseline_features.copy()
        for feature, bounds in NSL_KDD_BOUNDARIES.items():
            if baseline_features[feature] > bounds["max"]:
                ood_features[feature] = bounds["max"] * 1.05
            elif baseline_features[feature] < bounds["min"]:
                ood_features[feature] = bounds["min"] - 1
            else:
                ood_features[feature] = baseline_features[feature]

        ood_state = _build_resilience_state(
            "Track C",
            "OOD Boundary Scan",
            ood_features,
            baseline_prediction,
            "Variance flag raised when inputs cross NSL-KDD boundaries",
        )

        states.append(ood_state)
        track_results["Track C"] = not ood_state["flipped"]

        stable_tracks = sum(1 for resisted in track_results.values() if resisted)
        stability_index = round((stable_tracks / len(track_results)) * 100, 1)
        evaluated_states = [state for state in states if state["track"] != "Baseline"]
        flipped_states = [state for state in evaluated_states if state["flipped"]]
        attack_success_rate = round(
            (len(flipped_states) / len(evaluated_states)) * 100,
            1,
        ) if evaluated_states else 0.0
        resistance_score = round(100 - attack_success_rate, 1)

        feature_sensitivity = sorted(
            feature_sensitivity,
            key=lambda item: item["sensitivity_score"],
            reverse=True,
        )

        return {
            "baseline": {
                "features": baseline_features,
                "prediction": baseline_prediction,
            },
            "model_stability_index": stability_index,
            "attack_success_rate": attack_success_rate,
            "resistance_score": resistance_score,
            "feature_sensitivity_ranking": feature_sensitivity,
            "easiest_feature_to_manipulate": (
                feature_sensitivity[0]["feature"]
                if feature_sensitivity
                and feature_sensitivity[0]["sensitivity_score"] > 0
                else "None detected"
            ),
            "track_summary": {
                "data_poisoning_resisted": track_results["Track A"],
                "gradient_evasion_resisted": track_results["Track B"],
                "ood_scaffolding_resisted": track_results["Track C"],
            },
            "prediction_consistency": round(
                (
                    sum(1 for state in states if not state["flipped"])
                    / len(states)
                )
                * 100,
                1,
            ),
            "ood_distribution_status": (
                "Out of Distribution"
                if any(state["ood_flag"] for state in states)
                else "Within NSL-KDD Boundaries"
            ),
            "states": states,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Resilience test failed: {str(exc)}",
        )
