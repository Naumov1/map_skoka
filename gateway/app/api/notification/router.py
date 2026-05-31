from fastapi import APIRouter, Body, Request, Response, status

from app.config import settings
from app.core.gw_route import gw_route
from app.schemas.base import RequestUpdate

router = APIRouter()


@gw_route(
    request_method=router.get,
    path="/",
    status_code=status.HTTP_200_OK,
    service_url=settings.NOTIFICATION_SERVICE_URL,
    response_model="app.schemas.notification.ResponseNotificationList",
)
async def all_notification_api(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.post,
    path="/read",
    status_code=status.HTTP_200_OK,
    service_url=settings.NOTIFICATION_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def read_notification_api(
    request: Request,
    response: Response,
    notification_data: RequestUpdate = Body(...),
):
    pass


@gw_route(
    request_method=router.get,
    path="/read-all",
    status_code=status.HTTP_200_OK,
    service_url=settings.NOTIFICATION_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def read_all_notification_api(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.delete,
    path="/delete",
    status_code=status.HTTP_200_OK,
    service_url=settings.NOTIFICATION_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def delete_notification_api(
    request: Request,
    response: Response,
    id: int,
):
    pass
