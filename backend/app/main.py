from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.applications.router import router as applications_router
from app.conclusion.router import router as conclusion_router
from app.signature.router import router as signature_router

from app.config import broker_router
from app.applications.consumer import *
from app.conclusion.consumer import *

app = FastAPI()

app.include_router(applications_router)
app.include_router(conclusion_router)
app.include_router(signature_router)

app.include_router(broker_router)


origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PATCH", "PUT"],
    allow_headers=[
        "Content-Type",
        "Set-Cookie",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin",
        "Authorization",
    ],
)
