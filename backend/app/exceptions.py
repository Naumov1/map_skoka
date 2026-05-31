from fastapi import HTTPException, status


class STException(HTTPException):
    status_code = 500
    detail = ""

    def __init__(self):
        super().__init__(status_code=self.status_code, detail=self.detail)


class InvalidNameFormat(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Неверный формат имени"


class ApplicationNotFound(STException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Заявление не найдено"


class ApplicationDeleteError(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Невозможно удалить заявление"


class FileUploadError(STException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Ошибка загрузки файла"


class FileNotFoundException(STException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Файл не найден"


class InvalidInputFormat(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Неверный формат ввода"


class PasswordsNotMatch(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Пароли не совпадают"


class WrongCurrentPassword(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Текущий пароль не верный"


class UserNotFound(STException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Пользователь не найден"


class StatementAlreadyReviewed(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "На данное заявление уже составлено заключение"


class DocumentAlreadySigned(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Документ уже подписан"


class CommissionStatementNotFound(STException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Заявление комиссии не найдено"


class FailedFormatNameExceptions(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Неверный формат имени"


class FailedConvertToPDFExceptions(STException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Ошибка конвертации в PDF"


class FailedSendNotificationExceptions(STException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Ошибка отправки уведомления"


class FailedCreateApplicationExceptions(STException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Ошибка создания заявления"


class FailedCreateConclusionExceptions(STException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Ошибка создания заключения комисси"


class InvalidFormatDepartureException(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Неверный формат даты выезда"


class ConclusionAlreadyCreatedException(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "На данное заявление уже составлено заключение"


class InvalidFormatStreetException(STException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Неверный формат улицы"


class AccessTokenMissingException(STException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Отсутствует токен доступа в cookies"


class InvalidTokenException(STException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Неверный токен"


class InvalidOrExpiredTokenException(STException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Неверный или не действительный токен"


class PermissionDeniedException(STException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Недостаточно прав для выполнения действия"
