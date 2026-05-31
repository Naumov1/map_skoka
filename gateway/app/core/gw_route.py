import functools
from json import JSONDecodeError
from typing import Any, List

from aiohttp.client_exceptions import ClientConnectorError
from fastapi import HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from app.network import make_request
from app.config import settings
from app.core.errors import GWRouteError
from app.core.utils import import_function


def gw_route(
    request_method,
    path: str,
    status_code: int,
    service_url: str,
    post_processing_func: str = None,
    response_model: str = None,
    is_response_list: bool = False,
) -> Any:
    if response_model:
        response_model = import_function(response_model)
        if is_response_list:
            response_model = List[response_model]

    app_any = request_method(
        path,
        status_code=status_code,
        response_model=response_model,
    )

    def wrapper(func: Any) -> Any:
        @app_any
        @functools.wraps(func)
        async def inner(request: Request, response: Response, **kwargs) -> Any:
            scope = request.scope
            method = scope["method"].lower()
            url = f"{service_url}{scope['path']}"
            query_string = scope.get("query_string", b"").decode("utf-8")
            if query_string:
                url = f"{url}?{query_string}"

            headers = {}

            if auth_header := request.headers.get("authorization"):
                headers["authorization"] = auth_header

            if fingerprint := request.headers.get("X-Device-Fingerprint"):
                headers["X-Device-Fingerprint"] = fingerprint

            if user_agent := request.headers.get("user-agent"):
                headers["user-agent"] = user_agent

            if cookie_header := request.headers.get("cookie"):
                headers["cookie"] = cookie_header

            try:
                data = await request.json()
            except (JSONDecodeError, UnicodeDecodeError):
                data = {}
            except Exception:
                data = {}

            try:
                (
                    resp_data,
                    status_code_from_service,
                    set_cookie_headers,
                    content_type,
                    forwarded_headers,
                ) = await make_request(
                    url=url,
                    method=method,
                    headers=headers,
                    data=data,
                )
            except ClientConnectorError:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=GWRouteError.SERVICE_UNAVAILABLE,
                )

            if status_code_from_service != status_code:
                detail = (
                    resp_data.get(settings.SERVICE_ERROR_RESPONSE_DETAIL_KEY)
                    if isinstance(resp_data, dict)
                    else str(resp_data)
                )
                raise HTTPException(
                    status_code=status_code_from_service,
                    detail=detail,
                )

            for cookie_header in set_cookie_headers:
                response.headers.append("set-cookie", cookie_header)

            if post_processing_func and isinstance(resp_data, (dict, list)):
                post_processing_f = import_function(post_processing_func)
                resp_data = post_processing_f(resp_data)

            # Бинарный/не-JSON ответ проксируем как есть
            if isinstance(resp_data, bytes):
                proxy_response = Response(
                    content=resp_data,
                    status_code=status_code_from_service,
                    media_type=content_type,
                )
                for key, value in forwarded_headers.items():
                    proxy_response.headers[key] = value
                for cookie_header in set_cookie_headers:
                    proxy_response.headers.append("set-cookie", cookie_header)
                return proxy_response

            # Текстовый не-JSON ответ
            if isinstance(resp_data, str) and (
                content_type and "application/json" not in content_type
            ):
                proxy_response = Response(
                    content=resp_data,
                    status_code=status_code_from_service,
                    media_type=content_type,
                )
                for key, value in forwarded_headers.items():
                    proxy_response.headers[key] = value
                for cookie_header in set_cookie_headers:
                    proxy_response.headers.append("set-cookie", cookie_header)
                return proxy_response

            response.status_code = status_code_from_service
            return resp_data

        return inner

    return wrapper
