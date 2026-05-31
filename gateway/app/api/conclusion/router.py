from datetime import datetime

from fastapi import APIRouter, Body, Query, Request, Response, status

from app.config import settings
from app.core.gw_route import gw_route
from app.schemas.conclusion import SCreateConclusion

router = APIRouter()


@gw_route(
    request_method=router.post,
    path="/create",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def create_conclusions_api(
    request: Request,
    response: Response,
    conclusion_data: SCreateConclusion = Body(...),
):
    pass


@gw_route(
    request_method=router.get,
    path="/all",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.conclusion.ResponseAllConclusion",
)
async def all_conclusions_api(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.get,
    path="/my",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.conclusion.ResponseCountConclusion",
)
async def my_conclusions_api(
    request: Request,
    response: Response,
):
    pass

@gw_route(
    request_method=router.get,
    path="/detail/{id}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.conclusion.ResponseConclusion",
)
async def detail_conclusions_api(
    request: Request,
    response: Response,
    id: int,
):
    pass


@gw_route(
    request_method=router.get,
    path="/search/{text}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.conclusion.ResponseCountConclusion",
)
async def search_conclusions_api(
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
    response_model="app.schemas.conclusion.ResponseCountConclusion",
)
async def filter_conclusions_api(
    request: Request,
    response: Response,
    street: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    signed: bool | None = Query(None),
):
    pass


@gw_route(
    request_method=router.get,
    path="/download/{id}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
)
async def download_conclusions_api(
    request: Request,
    response: Response,
    id: int,
):
    pass


@gw_route(
    request_method=router.get,
    path="/view/{id}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
)
async def view_conclusions_api(
    request: Request,
    response: Response,
    id: int,
):
    pass