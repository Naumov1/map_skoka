from fastapi import APIRouter, Request, Response, status

from app.config import settings
from app.core.gw_route import gw_route

router = APIRouter()


@gw_route(
    request_method=router.post,
    path="/",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.refresh.RefreshResponse",
)
async def refresh_api(request: Request, response: Response):
    pass