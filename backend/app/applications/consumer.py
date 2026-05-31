from loguru import logger
from pydantic import BaseModel
from app.applications.service import ApplicationsService
from app.config import broker_router


class ApplicationsData(BaseModel):
    user_id: int
    data: dict


class ApplicationsId(BaseModel):
    user_id: int


class ApplicationsDetail(BaseModel):
    user_id: int
    applications_id: int


@broker_router.subscriber("applications")
async def process_order(application_data: ApplicationsData):
    user_id = application_data.user_id
    data = application_data.data
    await ApplicationsService.create_applications(
        user_id,
        data.get("fio", ""),
        data.get("phone", ""),
        data.get("email", ""),
        data.get("cadastral_number", ""),
        data.get("problem", ""),
        data.get("address", ""),
    )
    logger.debug(f"Заявление от: {user_id}, успешно сохранено")


@broker_router.subscriber("my_applications")
async def my_applications(application_data: ApplicationsId):
    logger.debug(f"Запрос на получение заявлений пользователя")
    user_id = int(application_data.user_id)
    applications = await ApplicationsService.my_applications(user_id)
    logger.info(f"Заявления для: {user_id}, успешно отправлены")
    return applications


@broker_router.subscriber("detail_applications")
async def detail_applications(application_data: ApplicationsDetail):
    logger.debug(f"Запрос на получение детально заявления пользователя")
    user_id = int(application_data.user_id)
    applications_id = int(application_data.applications_id)
    applications = await ApplicationsService.detail_applications(applications_id)
    logger.info(f"Заявление №{applications_id} для: {user_id}, успешно отправлено")
    return applications
