from fastapi import APIRouter

from app.config import settings
from app.api.auth.router import router as auth_router
from app.api.refresh.router import router as refresh_router
from app.api.applications.router import router as applications_router
from app.api.conclusion.router import router as conclusion_router
from app.api.signature.router import router as signature_router
from app.api.notification.router import router as notification_router


api_router = APIRouter()


api_router.include_router(
    auth_router,
    prefix=f"{settings.API_STR}/auth",
    tags=["API Авторизации"],
)
api_router.include_router(
    refresh_router,
    prefix=f"{settings.API_STR}/refresh",
    tags=["API Refresh"],
)
api_router.include_router(
    applications_router,
    prefix=f"{settings.API_STR}/applications",
    tags=["API Заявлений"],
)
api_router.include_router(
    conclusion_router,
    prefix=f"{settings.API_STR}/conclusion",
    tags=["API Заключений комиссии"],
)
api_router.include_router(
    signature_router,
    prefix=f"{settings.API_STR}/signature",
    tags=["API Подписей"],
)
api_router.include_router(
    notification_router,
    prefix=f"{settings.API_STR}/notification",
    tags=["API Уведомлений"],
)
