from datetime import datetime
from typing import List
from pydantic import BaseModel, Field

from app.schemas.base import Users


class Conclusion(BaseModel):
    id: int
    applications_id: int
    create_date: datetime
    file_url: str


class AllConclusion(BaseModel):
    conclusion_id: int
    application_id: int
    fio: str
    cadastral_number: str
    phone: str
    address: str
    create_date: datetime
    signed: bool


class ResponseAllConclusion(BaseModel):
    count: int
    conclusions: list[AllConclusion]


class SCreateConclusion(BaseModel):
    applications_id: int = Field(..., description="Id заявление заявителя")
    date: datetime = Field(..., description="Дата заключения")
    chairman: Users = Field(..., description="ФИО председателя комиссии")
    members: List[Users] = Field(..., description="ФИО членов комиссии")
    justification: str = Field(..., description="Принятие заключения о ...")
    documents: str = Field(..., description="Рассмотренные документы")
    conclusion: str = Field(..., description="По результам обследования")


class ResponseCountConclusion(BaseModel):
    count: int
    conclusions: list[Conclusion]


class ResponseConclusion(BaseModel):
    conclusions: Conclusion
