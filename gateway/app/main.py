from fastapi import FastAPI
from fastapi.security import HTTPBearer
from app.api.api import api_router
from app.config import settings
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="API Gateway",
    openapi_url=f"{settings.API_STR}/openapi.json",
)

security = HTTPBearer()

app.include_router(api_router)


origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
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
