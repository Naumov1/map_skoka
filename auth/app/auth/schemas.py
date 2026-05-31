from typing import List
from pydantic import BaseModel, EmailStr, Field

from app.auth.models import Role
from app.schemas.base import RequestUpdate, ResponseDetail


class SUsers(BaseModel):
    id: int
    login: str
    role: Role
    fio: str
    email: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RequestAddUsers(BaseModel):
    login: str
    password: str
    role: Role
    fio: str
    email: str


class RequestRegisterUsers(BaseModel):
    login: str
    password: str
    fio: str
    email: str


class RequestUpdateUsers(RequestUpdate):
    role: Role


class RequestLoginUsers(BaseModel):
    login: str = Field(...)
    password: str = Field(...)


class RequestEditFIO(BaseModel):
    fio: str = Field(...)


class RequestEditEmail(BaseModel):
    email: EmailStr = Field(...)


class RequestEditPassword(BaseModel):
    last_password: str = Field(...)
    new_password: str = Field(...)


class ResponseUsersList(BaseModel):
    users: List[SUsers]


class ResponseUsers(BaseModel):
    users: SUsers


class ResponseUsersDetail(ResponseDetail):
    users: SUsers
