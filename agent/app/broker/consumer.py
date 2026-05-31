from loguru import logger
from pydantic import BaseModel
from app.application_agent.create_graph import create_graph
from pydantic import BaseModel
from app.config import router_rabbitmq


class AgentData(BaseModel):
    tg_id: int
    text: str


@router_rabbitmq.subscriber("input_agent")
async def consumer_text(data: AgentData) -> AgentData:
    """Получение данных из брокера по каналу input_agent

    Args:
        data (AgentData): Данные из брокера

    Returns:
        AgentData: Данные об ответе от агента
    """
    logger.info("Получение ответа от input_agent")
    try:
        graph = await create_graph()
        responce = await graph.ainvoke(
            {"input_messages": data.text, "tg_id": data.tg_id},
            config={"configurable": {"thread_id": str(data.tg_id)}},
        )
        data.text = responce.get(
            "output_messages", "Агент не смог обработать входящий запрос"
        )
        logger.info(
            f"Получение ответа для пользователя {data.tg_id} от агента: {data.text[100:]}"
        )
    except Exception as e:
        logger.error(f"Ошибка получения ответа: {e}")
        data.text = "Ошибка получения ответа"
        return None
    return data
