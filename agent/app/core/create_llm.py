from langchain_gigachat import GigaChat
from loguru import logger
from app.config import settings


def get_llm_gigachat():
    llm = GigaChat(
        model=settings.MODEL,
        credentials=settings.GIGACHAT_CREDENTIALS,
        scope=settings.SCOPE,
        verify_ssl_certs=False,
        temperature=0.2,
        max_tokens=8000,
    )
    logger.success("llm успешно создана")
    return llm


llm = get_llm_gigachat()
