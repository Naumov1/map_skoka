from loguru import logger
from langchain.tools import tool


@tool
def create_applications(
    fio: str,
    phone: str,
    email: str,
    cadastral_number: str,
    address: str,
    problem: str,
):
    """
    Создание заявления от гражданина
    fio: Фамилия Имя Отчество собственника
    phone: Номер телефома для связи
    email: Почта для связи
    cadastral_number: кадастровый номер участка
    address: адрес здания (Пример: г. Воронеж, ул. Ленина, д. 15, кв. 10)
    problem: текст проблемы или ситуации заявителя
    """
    if not email:
        return "Не указана почта"
    if email.count("@") != 1:
        return "Не верный формат почты"
    logger.info(f"{fio}, {phone}, {email}, {cadastral_number}, {address}, {problem}")
    return "Заявление успешно отправлено"


tools = [create_applications]
