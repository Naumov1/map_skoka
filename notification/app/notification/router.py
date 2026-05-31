from fastapi import APIRouter, Depends

from app.notification.schemas import ResponseNotificationList
from app.notification.service import NotificationService
from app.schemas.base import RequestUpdate, ResponseDetail, Users
from app.utils.get_user import get_current_user

router = APIRouter(prefix="/notification", tags=["API notification"])


@router.get("/", response_model=ResponseNotificationList)
async def all_notification_api(current_user: Users = Depends(get_current_user)):
    return await NotificationService.all_notification(current_user.id)


@router.post("/read", response_model=ResponseDetail)
async def read_notification_api(notification_data: RequestUpdate):
    return await NotificationService.update(notification_data.id)


@router.get("/read-all", response_model=ResponseDetail)
async def read_all_notification_api(current_user: Users = Depends(get_current_user)):
    return await NotificationService.read_all(current_user.id)


@router.delete("/delete", response_model=ResponseDetail)
async def delete_notification_api(id: int):
    return await NotificationService.delete(id=id)
