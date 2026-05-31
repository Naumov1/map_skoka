from fastapi import APIRouter, Query, Request, Response, UploadFile, status

from app.config import settings
from app.core.gw_route import gw_route
from app.schemas.applications import SApplicationsDeparture, SCreateApplications


router = APIRouter()


@gw_route(
    request_method=router.get,
    path="/",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.applications.ResponseApplications",
)
async def all_api(request: Request, response: Response):
    pass


@gw_route(
    request_method=router.get,
    path="/my",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.applications.ResponseCountApplications",
)
async def my_applications_api(request: Request, response: Response):
    pass


@gw_route(
    request_method=router.post,
    path="/create",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.applications.ResponseDetailApplications",
)
async def create_applications_api(
    request: Request,
    response: Response,
    applications_data: SCreateApplications,
):
    pass


@gw_route(
    request_method=router.patch,
    path="/departure",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def update_departure_api(
    request: Request,
    response: Response,
    application_data: SApplicationsDeparture,
):
    pass


@gw_route(
    request_method=router.delete,
    path="/delete/{id}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.applications.ResponseApplicationDetail",
)
async def delete_applications_api(
    request: Request,
    response: Response,
    id: int,
):
    pass


@gw_route(
    request_method=router.get,
    path="/all",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.applications.ResponseCountApplications",
)
async def all_applications_api(request: Request, response: Response):
    pass


@gw_route(
    request_method=router.get,
    path="/detail/{id}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.applications.ResponseApplication",
)
async def detail_applications_api(
    request: Request,
    response: Response,
    id: int,
):
    pass


@gw_route(
    request_method=router.post,
    path="/analyze/{id}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.applications.ResponseCommissionAnalysis",
)
async def analyze_for_commission_api(
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
    response_model="app.schemas.applications.ResponseCountApplications",
)
async def search_applications_api(
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
    response_model="app.schemas.applications.ResponseCountApplications",
)
async def filter_applications_api(
    request: Request,
    response: Response,
    street: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    is_departure: bool | None = Query(None),
):
    pass


@gw_route(
    request_method=router.get,
    path="/street",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
    response_model="app.schemas.applications.ResponseStreetsApplications",
)
async def addres_api(
    request: Request,
    response: Response,
    search: str | None = Query(None),
):
    pass


@gw_route(
    request_method=router.get,
    path="/download/{id}",
    status_code=status.HTTP_200_OK,
    service_url=settings.MAIN_SERVICE_URL,
)
async def download_application_api(
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
async def view_application_api(
    request: Request,
    response: Response,
    id: int,
):
    pass
