from datetime import datetime
from typing import List
from pydantic import BaseModel

from app.schemas.base import RequestUpdate, ResponseDetail


class SNotification(BaseModel):
    id: int
    user_id: int
    text: str
    created_at: datetime
    is_read: bool


class RequestAddNotification(BaseModel):
    user_id: int
    text: str
    created_at: datetime
    is_read: bool


class RequestUpdateNotification(RequestUpdate):
    user_id: int
    text: str
    created_at: datetime
    is_read: bool


class ResponseNotificationList(BaseModel):
    count: int
    notification: List[SNotification]


class ResponseNotification(BaseModel):
    notification: SNotification


class ResponseNotificationDetail(ResponseDetail):
    notification: SNotification


class ConsumerSendNotification(BaseModel):
    user_id: int
    text: str
