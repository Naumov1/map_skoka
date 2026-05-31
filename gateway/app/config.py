from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    API_STR: str
    GATEWAY_TIMEOUT: int

    MAIN_SERVICE_URL: str
    AUTH_SERVICE_URL: str
    NOTIFICATION_SERVICE_URL: str
    AGENT_URL: str

    SERVICE_ERROR_RESPONSE_DETAIL_KEY: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
