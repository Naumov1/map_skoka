from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from datetime import datetime, timezone

from app.schemas.base import ResponseDetail


class Applications(BaseModel):
    id: int
    user_id: int
    fio: str
    phone: str
    email: str
    cadastral_number: str
    address: str
    street: str
    problem: str | None = None
    commission_analysis: str | None = None
    file_url: str
    status: str
    departure_date: datetime | None = None


class CommissionAnalysis(BaseModel):
    applicant: str
    address: str
    category: str
    urgency: str
    what_happened: str
    who_needed: list[str]
    recommended_actions: list[str]
    commission_focus: list[str]
    risks: list[str]


class ResponseCommissionAnalysis(BaseModel):
    analysis: CommissionAnalysis


class ResponseApplications(BaseModel):
    applications: list[Applications]


class ResponseCountApplications(BaseModel):
    count: int
    applications: list[Applications]


class RiskMapApplication(BaseModel):
    id: int
    address: str
    street: str
    problem: str | None = None
    commission_analysis: str | None = None
    status: str
    departure_date: datetime | None = None


class ResponseRiskMapApplications(BaseModel):
    count: int
    applications: list[RiskMapApplication]


class ResponseDetailApplications(ResponseDetail):
    applications: Applications


class ResponseApplication(BaseModel):
    applications: Applications


class ResponseApplicationDetail(ResponseDetail):
    applications: Applications


class Streets(BaseModel):
    street: str


class ResponseStreetsApplications(BaseModel):
    streets: list[Streets]


class SCreateApplications(BaseModel):
    fio: str = Field(..., description="ФИО гражданина")
    phone: str = Field(..., description="Номер телефона гражданина")
    email: str = Field(..., description="Почта гражданина")
    cadastral_number: str = Field(..., description="Кадастровый номер")
    problem: str = Field(..., description="Проблема гражданина")
    address: str = Field(..., description="Адрес гражданина")


class SApplicationsDeparture(BaseModel):
    applications_id: str = Field(...)
    departure_date: datetime = Field(...)

    @field_validator("departure_date", mode="before")
    @classmethod
    def parse_iso_datetime(cls, v):
        if isinstance(v, str):
            # Z заменяем на +00:00, чтобы fromisoformat понял
            if v.endswith("Z"):
                v = v[:-1] + "+00:00"
            dt = datetime.fromisoformat(v)
            # Если нет tzinfo — добавляем UTC
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            # Конвертируем в UTC
            return dt.astimezone(timezone.utc)
        return v
