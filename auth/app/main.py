from fastapi import FastAPI
from app.api import router as api_router

from contextlib import asynccontextmanager

from app.auth.default import default_create_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    await default_create_users()
    yield
    ...


app = FastAPI(lifespan=lifespan)


app.include_router(api_router)
