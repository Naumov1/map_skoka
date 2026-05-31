from fastapi import APIRouter, Body, Depends, Request, Response, status

from app.config import settings
from app.core.gw_route import gw_route
from app.schemas.auth import (
    RequestAddUsers,
    RequestEditEmail,
    RequestEditFIO,
    RequestEditPassword,
    RequestLoginUsers,
    RequestRegisterUsers,
    RequestUpdateUsers,
)

router = APIRouter()


@gw_route(
    request_method=router.get,
    path="/me",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.auth.ResponseUsers",
)
async def me_users_api(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.get,
    path="/employee",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.auth.ResponseUsersList",
)
async def employee_users_api(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.get,
    path="/",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.auth.ResponseUsersList",
)
async def all_users_api(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.get,
    path="/{id}",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.auth.ResponseUsers",
)
async def detail_users_api(
    request: Request,
    response: Response,
    id: int,
):
    pass


@gw_route(
    request_method=router.post,
    path="/register",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.auth.ResponseUsers",
)
async def register_users_api(
    request: Request,
    response: Response,
    users_data: RequestRegisterUsers = Body(...),
):
    pass


@gw_route(
    request_method=router.post,
    path="/add",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def add_users_api(
    request: Request,
    response: Response,
    users_data: RequestAddUsers = Body(...),
):
    pass


@gw_route(
    request_method=router.post,
    path="/login",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.auth.Token",
)
async def login_users_api(
    request: Request,
    response: Response,
    users_data: RequestLoginUsers = Body(...),
):
    pass


@gw_route(
    request_method=router.post,
    path="/logout",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def logout_users_api(
    request: Request,
    response: Response,
):
    pass


@gw_route(
    request_method=router.patch,
    path="/",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.auth.ResponseUsersDetail",
)
async def update_users_api(
    request: Request,
    response: Response,
    users_data: RequestUpdateUsers = Body(...),
):
    pass


@gw_route(
    request_method=router.delete,
    path="/",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.auth.ResponseUsersDetail",
)
async def delete_users_api(
    request: Request,
    response: Response,
    id: int,
):
    pass


@gw_route(
    request_method=router.patch,
    path="/edit-fio",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def update_fio_api(
    request: Request,
    response: Response,
    user_data: RequestEditFIO = Body(...),
):
    pass


@gw_route(
    request_method=router.patch,
    path="/edit-email",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def update_email_api(
    request: Request,
    response: Response,
    user_data: RequestEditEmail = Body(...),
):
    pass


@gw_route(
    request_method=router.patch,
    path="/edit-password",
    status_code=status.HTTP_200_OK,
    service_url=settings.AUTH_SERVICE_URL,
    response_model="app.schemas.base.ResponseDetail",
)
async def update_password_api(
    request: Request,
    response: Response,
    user_data: RequestEditPassword = Body(...),
):
    pass
