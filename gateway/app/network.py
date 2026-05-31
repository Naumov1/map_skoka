from typing import Any, List, Tuple
import aiohttp


async def make_request(
    url: str,
    method: str,
    headers: dict | None = None,
    data: dict | None = None,
) -> Tuple[Any, int, List[str], str | None, dict]:
    async with aiohttp.ClientSession() as session:
        async with session.request(
            method=method.upper(),
            url=url,
            json=data if method.upper() not in {"GET", "DELETE"} else None,
            headers=headers,
        ) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw_body = await resp.read()

            if "application/json" in content_type:
                try:
                    resp_data: Any = await resp.json()
                except Exception:
                    resp_data = raw_body
            elif content_type.startswith("text/"):
                charset = resp.charset or "utf-8"
                resp_data = raw_body.decode(charset, errors="replace")
            else:
                resp_data = raw_body

            set_cookie_headers = [
                value.decode("utf-8")
                for key, value in resp.raw_headers
                if key.decode("utf-8").lower() == "set-cookie"
            ]

            forwarded_headers = {}
            for header_name in [
                "Content-Type",
                "Content-Disposition",
                "Content-Length",
                "X-Content-Type-Options",
            ]:
                if header_name in resp.headers:
                    forwarded_headers[header_name] = resp.headers[header_name]

            return (
                resp_data,
                resp.status,
                set_cookie_headers,
                content_type,
                forwarded_headers,
            )