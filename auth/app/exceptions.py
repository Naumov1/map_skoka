from fastapi import HTTPException, status


class AppException(HTTPException):
    status_code = 500
    detail = ""

    def __init__(self):
        super().__init__(status_code=self.status_code, detail=self.detail)


class ServerErrorException(AppException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Ошибка сервера"


class InvalidCredentialsException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Неверный логин или пароль"


class UserAlreadyExistsException(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Пользователь уже зарегистрирован"


class UserNotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Пользователь не найден"


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


class RefreshTokenExpiredException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Refresh токен истек"


class RefreshSessionInvalidException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Неверный сеанс"


class InvalidFingerprintException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Неверный fingerprint"


class MissingRefreshException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Отсутствует refresh-токен"
