## Bot service

Сервис может работать в двух режимах:

- `BOT_PLATFORM=telegram` - Telegram bot через aiogram.
- `BOT_PLATFORM=vk` - VK community bot через VK Long Poll.

Для VK:

1. Создайте сообщество ВКонтакте.
2. Включите сообщения сообщества.
3. Включите Long Poll API и событие `message_new`.
4. Создайте ключ доступа сообщества с правами на сообщения.
5. Скопируйте `bot/.env.example` в `bot/.env-non-dev` или `bot/.env` и заполните `VK_GROUP_TOKEN`, `VK_GROUP_ID`.

Запуск локально:

```bash
python -m app.main
```

Запуск через Docker Compose:

```bash
docker compose up -d --build bot_app_doc
```
