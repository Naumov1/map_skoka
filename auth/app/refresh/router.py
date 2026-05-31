from fastapi import APIRouter, Request, Response

from app.refresh.schemas import RefreshResponse
from app.refresh.service import refresh


router = APIRouter(prefix="/refresh", tags=["API Refresh"])


@router.post("/", response_model=RefreshResponse)
async def refresh_api(request: Request, response: Response):
    return await refresh(request, response)
