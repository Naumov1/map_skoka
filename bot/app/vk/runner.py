import asyncio

from loguru import logger

from app.broker.consumer import set_vk_client
from app.vk.client import VKBotClient
from app.vk.handlers import handle_vk_message


async def run_vk_bot() -> None:
    async with VKBotClient() as client:
        set_vk_client(client)
        server_data = await client.get_long_poll_server()
        server = server_data["server"]
        key = server_data["key"]
        ts = server_data["ts"]

        logger.success("VK bot started")

        while True:
            try:
                data = await client.poll(server, key, ts)
                if data.get("failed"):
                    server_data = await client.get_long_poll_server()
                    server = server_data["server"]
                    key = server_data["key"]
                    ts = server_data["ts"]
                    continue

                ts = data["ts"]
                for update in data.get("updates", []):
                    if update.get("type") != "message_new":
                        continue

                    message = update.get("object", {}).get("message", {})
                    user_id = message.get("from_id")
                    text = message.get("text", "")
                    if user_id and text:
                        await handle_vk_message(client, int(user_id), text)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.exception(f"VK long poll error: {exc}")
                await asyncio.sleep(3)
