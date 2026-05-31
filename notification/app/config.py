from faststream.rabbit.fastapi import RabbitRouter
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    MODE: Literal["DEV", "TEST", "PROD"]

    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASS: str
    DB_NAME: str

    PUBLIC_KEY: str
    ALGORITHM: str

    RABBIT_HOST: str
    RABBIT_PORT: int

    @property
    def DATABASE_URL(self):
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

broker_router = RabbitRouter(host=settings.RABBIT_HOST, port=settings.RABBIT_PORT)
