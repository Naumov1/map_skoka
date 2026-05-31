import asyncio

from loguru import logger

from app.agent.router import router as agent_router
from app.applications.callback import router as applications_callback
from app.applications.router import router as applications_router
from app.broker import consumer
from app.config import broker, bot, dp, settings
from app.system.router import router as system_router
from app.vk.runner import run_vk_bot


async def main() -> None:
    if settings.BOT_PLATFORM.lower() == "vk":
        try:
            await asyncio.wait_for(broker.start(), timeout=settings.BROKER_START_TIMEOUT)
            logger.success("Broker started")
        except Exception as exc:
            logger.warning(f"Broker is unavailable, VK bot starts without broker: {exc}")

        try:
            await run_vk_bot()
        finally:
            await broker.close()
        return

    async with broker:
        await broker.start()
        logger.success("Broker started")

        if bot is None:
            raise RuntimeError("Telegram bot is not configured")

        logger.success("Telegram bot started")
        dp.include_router(system_router)
        dp.include_router(agent_router)
        dp.include_router(applications_callback)
        dp.include_router(applications_router)
        await dp.start_polling(bot)

    logger.info("Bot stopped")


if __name__ == "__main__":
    asyncio.run(main())
