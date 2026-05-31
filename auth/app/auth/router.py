from fastapi import APIRouter, Depends, Request, Response

from app.auth.models import Users
from app.auth.schemas import (
    RequestAddUsers,
    RequestEditEmail,
    RequestEditFIO,
    RequestEditPassword,
    RequestLoginUsers,
    RequestRegisterUsers,
    RequestUpdateUsers,
    ResponseUsersDetail,
    ResponseUsers,
    ResponseUsersList,
    Token,
)
from app.auth.service import UsersService
from app.schemas.base import ResponseDetail
from app.utils.get_user import get_admin_user, get_current_user, get_employee_user

router = APIRouter(prefix="/auth", tags=["API users"])


@router.get("/me", response_model=ResponseUsers)
async def me_users_api(current_user: Users = Depends(get_current_user)):
    return await UsersService.me(current_user)


@router.get("/employee", response_model=ResponseUsersList)
async def employee_users_api(current_user: Users = Depends(get_employee_user)):
    return await UsersService.employee()


@router.get("/", response_model=ResponseUsersList)
async def all_users_api(current_user: Users = Depends(get_admin_user)):
    return await UsersService.all()


@router.get("/{id}", response_model=ResponseUsers)
async def detail_users_api(id: int, current_user: Users = Depends(get_admin_user)):
    return await UsersService.detail(id=id)


@router.post("/register", response_model=ResponseUsers)
async def register_users_api(users_data: RequestRegisterUsers):
    return await UsersService.register(
        users_data.login,
        users_data.password,
        users_data.fio,
        users_data.email,
    )


@router.post("/add", response_model=ResponseDetail)
async def add_users_api(
    users_data: RequestAddUsers,
    current_user: Users = Depends(get_admin_user),
):
    return await UsersService.add(
        login=users_data.login,
        password=users_data.password,
        role=users_data.role,
        fio=users_data.fio,
        email=users_data.email,
    )


@router.post("/login", response_model=Token)
async def login_users_api(
    users_data: RequestLoginUsers,
    request: Request,
    response: Response,
):
    return await UsersService.login(
        users_data.login,
        users_data.password,
        request,
        response,
    )


@router.post("/logout", response_model=ResponseDetail)
async def logout_users_api(request: Request, response: Response):
    return await UsersService.logout(request, response)


@router.patch("/", response_model=ResponseUsersDetail)
async def update_users_api(
    users_data: RequestUpdateUsers,
    current_user: Users = Depends(get_admin_user),
):
    return await UsersService.update(**users_data.model_dump())


@router.delete("/", response_model=ResponseUsersDetail)
async def delete_users_api(id: int, current_user: Users = Depends(get_admin_user)):
    return await UsersService.delete(id=id)


@router.patch("/edit-fio", response_model=ResponseDetail)
async def update_fio_api(
    user_data: RequestEditFIO,
    current_user: Users = Depends(get_current_user),
):
    return await UsersService.update_fio(current_user.id, user_data.fio)


@router.patch("/edit-email", response_model=ResponseDetail)
async def update_email_api(
    user_date: RequestEditEmail,
    current_user: Users = Depends(get_current_user),
):
    return await UsersService.update_email(current_user.id, user_date.email)


@router.patch("/edit-password", response_model=ResponseDetail)
async def update_password_api(
    user_date: RequestEditPassword,
    current_user: Users = Depends(get_current_user),
):
    return await UsersService.update_password(
        current_user.id,
        user_date.last_password,
        user_date.new_password,
    )
