from aiogram import Bot, Dispatcher
from redis import asyncio as aioredis
from pydantic_settings import BaseSettings, SettingsConfigDict
from faststream.rabbit import RabbitBroker
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties


class Settings(BaseSettings):
    BOT_PLATFORM: str = "telegram"
    BOT_TOKEN: str | None = None

    VK_GROUP_TOKEN: str | None = None
    VK_GROUP_ID: int | None = None
    VK_API_VERSION: str = "5.199"
    VK_LONG_POLL_WAIT: int = 25
    BROKER_START_TIMEOUT: int = 5
    VK_DEMO_MODE: bool = False

    RABBIT_HOST: str
    RABBIT_PORT: int

    REDIS_HOST: str
    REDIS_PORT: int

    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_ENDPOINT_URL: str
    S3_BUCKET_NAME: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

broker = RabbitBroker(host=settings.RABBIT_HOST, port=settings.RABBIT_PORT)

redis = aioredis.from_url(
    f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}",
    encoding="utf8",
    decode_responses=True,
)

bot: Bot | None = None
if settings.BOT_PLATFORM.lower() == "telegram":
    if not settings.BOT_TOKEN:
        raise ValueError("BOT_TOKEN is required when BOT_PLATFORM=telegram")
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

dp = Dispatcher()
