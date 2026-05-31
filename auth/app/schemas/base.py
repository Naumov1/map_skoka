from pydantic import BaseModel


class ResponseDetail(BaseModel):
    detail: str


class RequestUpdate(BaseModel):
    id: int
