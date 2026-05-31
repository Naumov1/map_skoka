import enum

from pydantic import BaseModel


class Role(str, enum.Enum):
    ADMIN = "Администратор"
    EMPLOYEE = "Сотрудник"
    USERS = "Пользователь"


class Users(BaseModel):
    id: int
    fio: str
    role: Role


class ResponseDetail(BaseModel):
    detail: str
