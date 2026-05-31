from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def applications_keyboard(page: int, total: int, app_id: int):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="◀️", callback_data=f"apps_prev:{page}"),
                InlineKeyboardButton(text=f"{page+1}/{total}", callback_data="noop"),
                InlineKeyboardButton(text="▶️", callback_data=f"apps_next:{page}"),
            ],
            [
                InlineKeyboardButton(
                    text="⬇ Скачать", callback_data=f"apps_download:{app_id}:{page}"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🗑 Удалить", callback_data=f"apps_delete:{app_id}:{page}"
                )
            ],
        ]
    )


def conclusions_download_keyboard(conclusions_id: int):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="⬇ Скачать",
                    callback_data=f"conclusions_download:{conclusions_id}",
                )
            ]
        ]
    )
