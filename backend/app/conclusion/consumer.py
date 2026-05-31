from loguru import logger
from pydantic import BaseModel
from app.conclusion.service import ConclusionService
from app.config import broker_router


class ConclusionDetail(BaseModel):
    user_id: int
    conclusion_id: int


@broker_router.subscriber("detail_conclusion")
async def detail_conclusion(conclusion_data: ConclusionDetail):
    logger.debug(f"Запрос на получение детально заявления пользователя")
    user_id = int(conclusion_data.user_id)
    conclusion_id = int(conclusion_data.conclusion_id)
    conclusions = await ConclusionService.detail_conclusions(conclusion_id)
    logger.info(f"Заявление №{conclusion_id} для: {user_id}, успешно отправлено")
    return conclusions
