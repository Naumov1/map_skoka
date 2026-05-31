from datetime import datetime

from fastapi import APIRouter, Body, Query, Request, Response, status

from app.config import settings
from app.core.gw_route import gw_route
from app.schemas.signature import SAddSignature

router = APIRouter()


@gw_route(
    request_method=router.get,
    path="/",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
)
async def all(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.get,
    path="/all",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
)
async def all_signature_api(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.post,
    path="/subscribe",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
)
async def create_signature_api(
    request: Request,
    response: Response,
    signature_data: SAddSignature = Body(...),
):
    pass


@gw_route(
    request_method=router.get,
    path="/search/{text}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
)
async def search_signature_api(
    request: Request,
    response: Response,
    text: str,
):
    pass


@gw_route(
    request_method=router.get,
    path="/filter",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
)
async def filter_signature_api(
    request: Request,
    response: Response,
    street: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
):
    pass
