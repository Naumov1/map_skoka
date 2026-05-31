from fastapi import APIRouter
from app.auth.router import router as users_router
from app.refresh.router import router as refresh_router


router = APIRouter(prefix="/api")

router.include_router(users_router)
router.include_router(refresh_router)
