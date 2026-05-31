import random
from typing import Any

import aiohttp
from loguru import logger

from app.config import settings


class VKBotClient:
    def __init__(self) -> None:
        if not settings.VK_GROUP_TOKEN:
            raise ValueError("VK_GROUP_TOKEN is required when BOT_PLATFORM=vk")
        if not settings.VK_GROUP_ID:
            raise ValueError("VK_GROUP_ID is required when BOT_PLATFORM=vk")

        self.group_id = settings.VK_GROUP_ID
        self.token = settings.VK_GROUP_TOKEN
        self.api_version = settings.VK_API_VERSION
        self.wait = settings.VK_LONG_POLL_WAIT
        self.session: aiohttp.ClientSession | None = None

    async def __aenter__(self) -> "VKBotClient":
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, *args: object) -> None:
        if self.session:
            await self.session.close()

    async def api(self, method: str, **params: Any) -> dict[str, Any]:
        if not self.session:
            raise RuntimeError("VK session is not started")

        payload = {
            **params,
            "access_token": self.token,
            "v": self.api_version,
        }
        async with self.session.post(
            f"https://api.vk.com/method/{method}",
            data=payload,
            timeout=aiohttp.ClientTimeout(total=30),
        ) as response:
            data = await response.json()

        if "error" in data:
            logger.error(f"VK API error in {method}: {data['error']}")
            raise RuntimeError(data["error"])
        return data["response"]

    async def get_long_poll_server(self) -> dict[str, Any]:
        return await self.api(
            "groups.getLongPollServer",
            group_id=self.group_id,
        )

    async def poll(self, server: str, key: str, ts: str) -> dict[str, Any]:
        if not self.session:
            raise RuntimeError("VK session is not started")

        params = {
            "act": "a_check",
            "key": key,
            "ts": ts,
            "wait": self.wait,
        }
        async with self.session.get(
            server,
            params=params,
            timeout=aiohttp.ClientTimeout(total=self.wait + 10),
        ) as response:
            return await response.json()

    async def send_message(self, user_id: int, text: str) -> None:
        await self.api(
            "messages.send",
            peer_id=user_id,
            message=text,
            random_id=random.randint(1, 2_147_483_647),
        )
