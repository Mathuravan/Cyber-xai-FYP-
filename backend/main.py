from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def home():
    return {"message": "CyberXAI Backend Running"}

@app.post("/signup")
def signup(data: SignupData):
    return {"message": "Signup successful"}

@app.post("/login")
def login(data: LoginData):
    return {
        "token": "fake-jwt-token",
        "user": data.username
    }

@app.post("/predict")
def predict(data: PredictData):
    """
    Dummy prediction (replace with ML model later)
    """
    if data.count > 50:
        label = "Attack"
        confidence = 0.85
    else:
        label = "Normal"
        confidence = 0.92

    return {
        "label": label,
        "confidence": confidence
    }