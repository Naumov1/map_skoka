import re
import json
from loguru import logger


async def check_data(templates_data: dict):
    fio = templates_data["fio"]
    cadastral_number = templates_data["cadastral_number"]
    address = templates_data["address"]

    logger.debug(f"Проверка данных с егрн: {fio} | {cadastral_number} | {address}")


async def safe_parse_agent_response(response: str) -> dict:
    try:
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if not match:
            raise ValueError("JSON не найден в ответе")
        return json.loads(match.group(0))
    except Exception as e:
        raise ValueError(f"Ошибка при парсинге ответа агента: {e}")
