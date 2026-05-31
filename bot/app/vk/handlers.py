from loguru import logger

from app.applications.service import ApplicationsService
from app.broker.producer import (
    create_application,
    detail_applications,
    detail_conclusion,
    my_applications,
    send_input_agent,
)
from app.commission_analyzer import (
    analyze_statement,
    format_analysis,
    should_analyze_text,
    strip_analysis_command,
)
from app.config import settings
from app.vk.client import VKBotClient
from app.vk.questionnaire import (
    QUESTIONNAIRE_CANCEL_COMMANDS,
    QUESTIONNAIRE_SKIP_COMMANDS,
    cancel_questionnaire,
    handle_questionnaire_answer,
    is_questionnaire_active,
    is_questionnaire_command,
    pop_completed_application_data,
    should_start_questionnaire,
    start_questionnaire,
)


START_TEXT = (
    "Добро пожаловать в AI-агента ЖКХ!\n\n"
    "Я помогу подготовить заявление о пригодности жилья.\n\n"
    "Для списка команд напишите /help"
)

HELP_TEXT = (
    "Доступные команды:\n\n"
    "/start - начать работу\n"
    "/help - список команд\n"
    "/info - информация о боте\n"
    "/support - контакты поддержки\n"
    "/my - список всех поданных заявлений\n"
    "/end id - результат комиссии по заявлению\n"
    "/current id - информация по заявлению\n\n"
    "Обычным сообщением можно отправить данные AI-агенту."
)

HELP_TEXT += (
    "\n\n/anketa - заполнить анкету по шагам"
    "\n/agent текст - отправить текст старому AI-агенту"
    "\n\n/itog текст - разобрать заявление для комиссии"
    "\n/analysis текст - то же самое"
    "\n\nМожно написать коротко: протекла крыша. Я начну анкету и подскажу, что заполнить дальше."
    "\n\nМожно просто прислать длинный текст заявления, и я попробую сразу дать итог для комиссии."
)

INFO_TEXT = (
    "Бот помогает жителям подготовить заявление на оценку пригодности жилых помещений.\n\n"
    "Как это работает:\n"
    "1. Вы вводите данные: ФИО, адрес, контакты и описание проблемы.\n"
    "2. AI-агент формирует заявление по шаблону.\n"
    "3. Вы получаете уведомления о статусе заявления."
)

SUPPORT_TEXT = (
    "Контакты поддержки\n\n"
    "Email: support@example.com\n"
    "Телефон: +7 (999) 123-45-67"
)

DEMO_APPLICATION = {
    "id": 1,
    "fio": "Иванов Иван Иванович",
    "phone": "+7 (999) 123-45-67",
    "email": "ivanov@example.com",
    "address": "г. Москва, ул. Тестовая, д. 1, кв. 10",
    "cadastral_number": "77:01:0000000:1001",
    "status": "Заявление принято",
    "departure_date": None,
}

DEMO_CONCLUSION = {
    "applications_id": 1,
    "file_url": "Демо-файл будет доступен после подключения хранилища",
}


def _parse_id(text: str) -> int | None:
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        return None
    return int(parts[1])


async def handle_vk_message(client: VKBotClient, user_id: int, text: str) -> None:
    text = text.strip()
    command = text.split()[0].lower() if text else ""

    logger.info(f"VK message from {user_id}: {text}")

    if command == "/start":
        await client.send_message(user_id, START_TEXT)
        return

    if command == "/help":
        await client.send_message(user_id, HELP_TEXT)
        return

    if command == "/info":
        await client.send_message(user_id, f"Ваш VK id: {user_id}\n\n{INFO_TEXT}")
        return

    if command == "/support":
        await client.send_message(user_id, SUPPORT_TEXT)
        return

    if command == "/agent":
        await _send_to_ai_agent(client, user_id, text)
        return

    if command == "/my":
        await _send_my_applications(client, user_id)
        return

    if command == "/current":
        await _send_current_application(client, user_id, text)
        return

    if command == "/end":
        await _send_conclusion(client, user_id, text)
        return

    if is_questionnaire_command(command):
        await client.send_message(user_id, start_questionnaire(user_id))
        return

    if command in QUESTIONNAIRE_CANCEL_COMMANDS:
        await client.send_message(user_id, cancel_questionnaire(user_id))
        return

    if is_questionnaire_active(user_id) and (
        not text.startswith("/") or command in QUESTIONNAIRE_SKIP_COMMANDS
    ):
        answer = handle_questionnaire_answer(user_id, text)
        application_data = pop_completed_application_data(user_id)
        if application_data:
            if await create_application(user_id, application_data):
                answer += (
                    "\n\nЗаявление отправлено в систему. "
                    "Через несколько секунд проверьте список командой /my."
                )
            else:
                answer += (
                    "\n\nЧерновик собран, но отправить заявление в систему не получилось. "
                    "Попробуйте позже или отправьте данные через /agent."
                )
        await client.send_message(user_id, answer)
        return

    if should_analyze_text(text):
        await _send_commission_analysis(client, user_id, text)
        return

    if should_start_questionnaire(text):
        await client.send_message(user_id, start_questionnaire(user_id, text))
        return

    if text.startswith("/"):
        await client.send_message(user_id, "Команда не найдена. Напишите /help.")
        return

    await client.send_message(
        user_id,
        (
            "Я могу помочь заполнить анкету по шагам.\n\n"
            "Напишите /anketa или коротко опишите проблему, например: протекла крыша."
        ),
    )


async def _send_commission_analysis(client: VKBotClient, user_id: int, text: str) -> None:
    statement = strip_analysis_command(text)
    if not statement:
        await client.send_message(
            user_id,
            (
                "Пришлите текст заявления после команды.\n\n"
                "Пример:\n"
                "/itog В подъезде не работает освещение, перегорели лампы..."
            ),
        )
        return

    analysis = analyze_statement(statement)
    await client.send_message(user_id, format_analysis(analysis))


async def _send_to_ai_agent(client: VKBotClient, user_id: int, text: str) -> None:
    prompt = text.split(maxsplit=1)[1].strip() if len(text.split(maxsplit=1)) > 1 else ""
    if not prompt:
        await client.send_message(user_id, "Напишите текст после команды. Пример: /agent протекла крыша")
        return

    status = await send_input_agent(tg_id=user_id, text=prompt)
    if not status:
        await client.send_message(user_id, "Произошла ошибка при отправке сообщения. Попробуйте позже.")
        return
    await client.send_message(user_id, "Данные отправлены AI-агенту, ожидайте ответ...")


async def _send_my_applications(client: VKBotClient, user_id: int) -> None:
    applications = await my_applications(user_id)
    if not applications and settings.VK_DEMO_MODE:
        applications = {"applications": [DEMO_APPLICATION]}

    if not applications:
        await client.send_message(
            user_id,
            "Ошибка при получении списка заявлений. Попробуйте позже.",
        )
        return

    data = applications.get("applications") or []
    if not data:
        await client.send_message(user_id, "У вас нет заявлений.")
        return

    parts = [
        await ApplicationsService.format_application(app, index, len(data))
        for index, app in enumerate(data[:10])
    ]
    if len(data) > 10:
        parts.append(f"Показаны первые 10 заявлений из {len(data)}.")
    await client.send_message(user_id, "\n\n".join(parts))


async def _send_current_application(client: VKBotClient, user_id: int, text: str) -> None:
    app_id = _parse_id(text)
    if app_id is None:
        await client.send_message(user_id, "Укажите ID заявления. Пример: /current 3")
        return

    applications = await detail_applications(user_id, app_id)
    if not applications and settings.VK_DEMO_MODE and app_id == DEMO_APPLICATION["id"]:
        applications = {"applications": DEMO_APPLICATION}

    if not applications:
        await client.send_message(user_id, "Не удалось загрузить заявление.")
        return

    app = applications.get("applications") or {}
    await client.send_message(
        user_id,
        (
            f"Заявление #{app_id}\n\n"
            f"ФИО: {app.get('fio', 'Не найдено')}\n"
            f"Адрес: {app.get('address', 'Не найдено')}\n"
            f"Телефон: {app.get('phone', 'Не найдено')}\n"
            f"Email: {app.get('email', 'Не найдено')}\n\n"
            f"Статус: {app.get('status', 'Не найдено')}"
        ),
    )


async def _send_conclusion(client: VKBotClient, user_id: int, text: str) -> None:
    app_id = _parse_id(text)
    if app_id is None:
        await client.send_message(user_id, "Укажите ID заявления. Пример: /end 3")
        return

    conclusions = await detail_conclusion(user_id, app_id)
    if not conclusions and settings.VK_DEMO_MODE and app_id == DEMO_APPLICATION["id"]:
        conclusions = {"conclusions": DEMO_CONCLUSION}

    if not conclusions:
        await client.send_message(user_id, "Не удалось загрузить результат комиссии.")
        return

    conclusion = conclusions.get("conclusions") or {}
    file_url = conclusion.get("file_url")
    message = (
        f"Заявление №{conclusion.get('applications_id', app_id)}\n\n"
        "Статус: результат комиссии готов"
    )
    if file_url:
        message += f"\nФайл: {file_url}"
    await client.send_message(user_id, message)
