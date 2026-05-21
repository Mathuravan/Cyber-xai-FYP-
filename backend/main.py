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