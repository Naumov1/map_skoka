import json
from loguru import logger
from aiogram import F, Bot, Router
from aiogram.types import CallbackQuery, BufferedInputFile
from app.applications.keyboard import applications_keyboard
from app.applications.service import ApplicationsService
from app.broker.producer import my_applications
from app.config import redis
from app.utils.s3 import s3_client

router = Router()


async def load_apps(tg_id: int) -> list[dict] | None:
    raw = await redis.get(f"my_applications_{tg_id}")
    if not raw:
        applications = await my_applications(tg_id)
        if not applications:
            return None
        await redis.set(f"my_applications_{tg_id}", json.dumps(applications), ex=600)
        return applications
    else:
        await redis.expire(f"my_applications_{tg_id}", 600)
    return json.loads(raw)


@router.callback_query(F.data.startswith("apps_next"))
async def apps_next(callback: CallbackQuery):
    current_page = int(callback.data.split(":")[1])
    tg_id = callback.from_user.id

    data = await load_apps(tg_id)
    apps = data.get("applications") if data else None
    if not apps:
        await callback.answer("Список устарел. Запросите заявления заново.")
        return

    total = len(apps)
    new_page = min(current_page + 1, total - 1)

    if new_page == current_page:
        return

    app = apps[new_page]
    text = await ApplicationsService.format_application(app, new_page, total)

    await callback.message.edit_text(
        text,
        reply_markup=applications_keyboard(new_page, total, app.get("id")),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("apps_prev"))
async def apps_prev(callback: CallbackQuery):
    current_page = int(callback.data.split(":")[1])
    tg_id = callback.from_user.id

    data = await load_apps(tg_id)
    apps = data.get("applications") if data else None
    if not apps:
        await callback.answer("Список устарел. Запросите заявления заново.")
        return

    total = len(apps)
    new_page = max(current_page - 1, 0)

    if new_page == current_page:
        return

    app = apps[new_page]
    text = await ApplicationsService.format_application(app, new_page, total)

    await callback.message.edit_text(
        text,
        reply_markup=applications_keyboard(new_page, total, app.get("id")),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("apps_delete"))
async def apps_delete(callback: CallbackQuery):
    _, app_id_str, page_str = callback.data.split(":")
    app_id = int(app_id_str)
    page = int(page_str)
    tg_id = callback.from_user.id

    apps = await load_apps(tg_id)
    apps = apps.get("applications")
    if not apps:
        await callback.answer("Список устарел. Запросите заявления заново.")
        return

    # 1) удалить в БД
    # реализуй в себя

    # 2) обновить список
    apps = [a for a in apps if int(a.get("id")) != app_id]

    if not apps:
        await redis.delete(f"my_applications_{tg_id}")
        await callback.message.edit_text("Все заявления удалены.")
        await callback.answer("Удалено")
        return

    # 3) скорректировать страницу (если удалили последнюю)
    page = min(page, len(apps) - 1)

    await redis.set(f"my_applications_{tg_id}", json.dumps(apps), ex=600)

    total = len(apps)
    app = apps[page]

    formate_text = await ApplicationsService.format_application(app, page, total)
    await callback.message.edit_text(
        formate_text, reply_markup=applications_keyboard(page, total, app.get("id"))
    )
    await callback.answer("Удалено")


async def conclusions_download(callback: CallbackQuery, bot: Bot):
    try:
        _, file_url = callback.data.split(":")
        tg_id = callback.from_user.id

        # Получаем файл из S3
        file_obj = await s3_client.get_file(file_url)

        if not file_obj:
            await callback.answer("Файл не найден", show_alert=True)
            return

        file_obj.seek(0)

        # Имя файла можно взять из url
        filename = file_url.split("/")[-1]

        # Оборачиваем в BufferedInputFile для Telegram
        telegram_file = BufferedInputFile(
            file=file_obj.read(),
            filename=filename,
        )

        # Отправляем документ пользователю
        await bot.send_document(
            chat_id=tg_id,
            document=telegram_file,
            caption="Ваш файл 📄",
        )

        await callback.answer()

    except Exception as e:
        logger.exception(f"Ошибка при скачивании файла {callback.data}: {e}")
        await callback.answer("Ошибка при скачивании файла", show_alert=True)
