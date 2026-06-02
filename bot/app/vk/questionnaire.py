import re
from dataclasses import dataclass, field

from app.commission_analyzer import analyze_statement


@dataclass(frozen=True)
class QuestionStep:
    key: str
    question: str
    required: bool = True


@dataclass
class QuestionnaireSession:
    answers: dict[str, str] = field(default_factory=dict)
    step_index: int = 0
    pending_address: str | None = None


QUESTIONNAIRE_COMMANDS = ("/anketa", "/анкета", "/zayavka", "/заявка")
QUESTIONNAIRE_CANCEL_COMMANDS = ("/cancel", "/отмена")
QUESTIONNAIRE_SKIP_COMMANDS = ("/skip", "/пропустить", "-")
ADDRESS_CONFIRM_YES = ("да", "верно", "правильно", "ок", "ok", "yes", "y", "+")
ADDRESS_CONFIRM_NO = ("нет", "не", "неверно", "ошибка", "исправить", "no", "n", "-")

ADDRESS_MARKERS = (
    "ул",
    "улица",
    "проспект",
    "пр-т",
    "пер",
    "переулок",
    "бульвар",
    "бул",
    "шоссе",
    "площадь",
    "пл",
    "набережная",
    "наб",
    "микрорайон",
    "мкр",
)

ISSUE_MARKERS = (
    "аварийн",
    "балкон",
    "вода",
    "горяч",
    "громко",
    "залив",
    "затоп",
    "крыша",
    "кровл",
    "ламп",
    "лифт",
    "мусор",
    "музык",
    "ночью",
    "окн",
    "освещ",
    "отоп",
    "подъезд",
    "прорв",
    "протек",
    "сосед",
    "свет",
    "телевизор",
    "тишин",
    "стояк",
    "фасад",
    "шум",
)

STEPS = (
    QuestionStep(
        "problem",
        "Что случилось? Напишите коротко, например: протекла крыша, затопило квартиру, нет горячей воды.",
    ),
    QuestionStep("applicant", "Напишите ФИО заявителя."),
    QuestionStep(
        "address",
        "Укажите адрес: город, улица, дом, квартира. Если проблема в подъезде, добавьте подъезд и этаж.",
    ),
    QuestionStep("phone", "Укажите телефон для связи. Если телефона нет, напишите /skip.", required=False),
    QuestionStep("email", "Укажите email для связи. Если email нет, напишите /skip.", required=False),
    QuestionStep("cadastral_number", "Укажите кадастровый номер, если знаете. Если нет, напишите /skip.", required=False),
    QuestionStep(
        "date",
        "Когда обнаружили проблему? Например: 30.01.2026, вчера, сегодня.",
        required=False,
    ),
    QuestionStep(
        "details",
        "Добавьте детали: где именно проблема, что повреждено, есть ли опасность или ущерб.",
        required=False,
    ),
    QuestionStep(
        "request",
        "Что просите сделать? Можно написать авто, и я подставлю подходящую просьбу.",
        required=False,
    ),
    QuestionStep("attachments", "Есть приложения: фото, акт, квитанция? Если нет, напишите /skip.", required=False),
)

_sessions: dict[int, QuestionnaireSession] = {}
_completed: dict[int, dict[str, str]] = {}


def is_questionnaire_command(command: str) -> bool:
    return command in QUESTIONNAIRE_COMMANDS


def is_questionnaire_active(user_id: int) -> bool:
    return user_id in _sessions


def should_start_questionnaire(text: str) -> bool:
    stripped = text.strip()
    lowered = stripped.lower()
    if not stripped or stripped.startswith("/"):
        return False
    if len(stripped) > 140:
        return False
    return any(marker in lowered for marker in ISSUE_MARKERS)


def start_questionnaire(user_id: int, initial_problem: str | None = None) -> str:
    session = QuestionnaireSession()
    _sessions[user_id] = session
    _completed.pop(user_id, None)

    if initial_problem:
        session.answers["problem"] = initial_problem.strip()
        session.step_index = 1
        return (
            f"Понял проблему: {session.answers['problem']}\n\n"
            f"{_format_question(session)}\n\n"
            "Чтобы отменить анкету, напишите /cancel."
        )

    return (
        "Начнем анкету для заявления.\n\n"
        f"{_format_question(session)}\n\n"
        "Чтобы отменить анкету, напишите /cancel."
    )


def cancel_questionnaire(user_id: int) -> str:
    _completed.pop(user_id, None)
    if _sessions.pop(user_id, None):
        return "Анкета отменена. Можно начать заново командой /anketa."
    return "Активной анкеты сейчас нет. Чтобы начать, напишите /anketa или коротко опишите проблему."


def handle_questionnaire_answer(user_id: int, text: str) -> str:
    session = _sessions.get(user_id)
    if session is None:
        return start_questionnaire(user_id)

    lowered = text.strip().lower()
    if lowered in QUESTIONNAIRE_CANCEL_COMMANDS:
        return cancel_questionnaire(user_id)

    if session.pending_address is not None:
        confirmation = _parse_address_confirmation(text)
        if confirmation is True:
            session.answers["address"] = session.pending_address
            session.pending_address = None
            session.step_index += 1
            return _format_question(session)
        if confirmation is False:
            session.pending_address = None
            return "Хорошо, адрес не сохраняю. Напишите его еще раз.\n\n" + _format_question(session)
        return (
            "Ответьте, пожалуйста: да или нет.\n\n"
            f"Адрес верный?\n{session.pending_address}\n\n"
            "Если адрес неверный, напишите нет, и я попрошу ввести его заново."
        )

    current_step = STEPS[session.step_index]
    if lowered in QUESTIONNAIRE_SKIP_COMMANDS:
        if current_step.required:
            return "Этот пункт нужен для заявления.\n\n" + _format_question(session)
        value = ""
    else:
        value = text.strip()

    if not value and current_step.required:
        return "Ответ пустой, напишите данные текстом.\n\n" + _format_question(session)

    if current_step.key == "applicant" and len(value.split()) < 3:
        return (
            "Для создания заявления нужно полное ФИО: фамилия, имя и отчество.\n\n"
            + _format_question(session)
        )

    if current_step.key == "address" and _address_needs_confirmation(value):
        session.pending_address = value
        return _format_address_confirmation(value)

    if current_step.key == "request" and value.lower() in ("авто", "auto"):
        value = _suggest_request(session.answers)

    session.answers[current_step.key] = value
    session.step_index += 1

    if session.step_index >= len(STEPS):
        answers = session.answers.copy()
        _sessions.pop(user_id, None)
        _completed[user_id] = answers
        return _format_result(answers)

    return _format_question(session)


def _parse_address_confirmation(text: str) -> bool | None:
    answer = re.sub(r"[.!?]+$", "", text.strip().lower())
    if answer in ADDRESS_CONFIRM_YES or answer.startswith(("да ", "верно", "правильно")):
        return True
    if answer in ADDRESS_CONFIRM_NO or answer.startswith(("нет ", "невер", "исправ")):
        return False
    return None


def _address_needs_confirmation(address: str) -> bool:
    normalized = re.sub(r"\s+", " ", address.strip().lower())
    if len(normalized) < 8:
        return True

    has_house_number = bool(re.search(r"\d", normalized))
    if not has_house_number:
        return True

    tokens = [token.strip(".,:;()[]") for token in normalized.split()]
    has_address_marker = any(token in ADDRESS_MARKERS for token in tokens)
    word_count = sum(1 for token in tokens if re.search(r"[а-яa-z]", token))

    return not (has_address_marker or word_count >= 2)


def _format_address_confirmation(address: str) -> str:
    return (
        "Не смог уверенно распознать адрес:\n"
        f"{address}\n\n"
        "Адрес верный? Напишите да, чтобы продолжить, или нет, чтобы ввести адрес заново.\n"
        "Можно отменить анкету командой /cancel."
    )


def _format_question(session: QuestionnaireSession) -> str:
    step = STEPS[session.step_index]
    hint = "\nМожно написать /skip, если данных нет." if not step.required else ""
    return f"Шаг {session.step_index + 1}/{len(STEPS)}\n{step.question}{hint}"


def _suggest_request(answers: dict[str, str]) -> str:
    analysis = analyze_statement(_build_source_text(answers))
    actions = analysis.recommended_actions[:2]
    return " ".join(actions)


def _build_source_text(answers: dict[str, str]) -> str:
    parts = [
        answers.get("problem", ""),
        answers.get("details", ""),
        answers.get("request", ""),
        answers.get("address", ""),
    ]
    return " ".join(part for part in parts if part).strip()


def _build_statement(answers: dict[str, str]) -> str:
    request = answers.get("request") or _suggest_request(answers)
    lines = [
        "Черновик заявления",
        "",
        f"От: {answers.get('applicant', 'не указано')}",
        f"Адрес: {answers.get('address', 'не указан')}",
    ]
    if answers.get("phone"):
        lines.append(f"Телефон: {answers['phone']}")
    if answers.get("email"):
        lines.append(f"Email: {answers['email']}")
    if answers.get("cadastral_number"):
        lines.append(f"Кадастровый номер: {answers['cadastral_number']}")
    if answers.get("date"):
        lines.append(f"Дата обнаружения: {answers['date']}")

    lines.extend(
        [
            "",
            "Описание проблемы:",
            answers.get("problem", "не указано"),
        ]
    )
    if answers.get("details"):
        lines.append(answers["details"])

    lines.extend(["", "Прошу:", request])
    if answers.get("attachments"):
        lines.extend(["", f"Приложения: {answers['attachments']}"])
    return "\n".join(lines)


def pop_completed_application_data(user_id: int) -> dict | None:
    answers = _completed.pop(user_id, None)
    if not answers:
        return None
    return _build_application_data(answers)


def _build_application_data(answers: dict[str, str]) -> dict:
    request = answers.get("request") or _suggest_request(answers)
    problem_parts = [answers.get("problem", "")]
    if answers.get("date"):
        problem_parts.append(f"Дата обнаружения: {answers['date']}")
    if answers.get("details"):
        problem_parts.append(answers["details"])
    if request:
        problem_parts.append(f"Просьба: {request}")
    if answers.get("attachments"):
        problem_parts.append(f"Приложения: {answers['attachments']}")

    return {
        "fio": answers.get("applicant", "").strip(),
        "phone": answers.get("phone", "").strip() or "не указан",
        "email": answers.get("email", "").strip() or "не указан",
        "cadastral_number": answers.get("cadastral_number", "").strip() or "не указан",
        "address": answers.get("address", "").strip(),
        "problem": "\n".join(part for part in problem_parts if part).strip(),
    }


def _format_list(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def _format_result(answers: dict[str, str]) -> str:
    statement = _build_statement(answers)
    analysis = analyze_statement(statement)
    return (
        "Анкета собрана.\n\n"
        f"{statement}\n\n"
        "Итог для комиссии:\n"
        f"Категория: {analysis.category}\n"
        f"Срочность: {analysis.urgency}\n\n"
        f"Кто нужен:\n{_format_list(analysis.who_needed)}\n\n"
        f"Как действовать:\n{_format_list(analysis.recommended_actions)}\n\n"
        f"Риски:\n{_format_list(analysis.risks)}"
    )
