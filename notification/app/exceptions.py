from fastapi import HTTPException, status


class AppException(HTTPException):
    status_code = 500
    detail = ""

    def __init__(self):
        super().__init__(status_code=self.status_code, detail=self.detail)


class AccessTokenMissingException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Отсутствует токен доступа в cookies"


class InvalidTokenException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Неверный токен"


class InvalidOrExpiredTokenException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Неверный или не действительный токен"


class PermissionDeniedException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Недостаточно прав для выполнения действия"
