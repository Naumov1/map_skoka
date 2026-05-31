from fastapi import FastAPI
from app.api import router as api_router
from app.config import broker_router
from app.notification.consumer import *


app = FastAPI()


app.include_router(api_router)

app.include_router(broker_router)
