from pydantic_settings import BaseSettings, SettingsConfigDict
from faststream.rabbit.fastapi import RabbitRouter


class Settings(BaseSettings):
    GIGACHAT_CREDENTIALS: str
    MODEL: str
    SCOPE: str

    RABBIT_HOST: str
    RABBIT_PORT: int

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

router_rabbitmq = RabbitRouter(host=settings.RABBIT_HOST, port=settings.RABBIT_PORT)
