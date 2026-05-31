from loguru import logger
from fastapi import HTTPException


class BaseService:
    dao = None
    model = None

    @classmethod
    async def all(cls):
        """Получение всех данных"""
        logger.info(f"Получение списка {cls.model.__tablename__}")
        return {cls.model.__tablename__: await cls.dao.find_all()}

    @classmethod
    async def detail(cls, id: int):
        """Получение данных по id"""
        obj = await cls.dao.find_by_id(id)
        if not obj:
            logger.warning(f"Не найдено {cls.model.__tablename__} с id {id}")
            raise HTTPException(status_code=404, detail="Не найден")
        logger.info(f"Получение {cls.model.__tablename__} №{id}")
        return {cls.model.__tablename__: await cls.dao.find_by_id(id=id)}

    @classmethod
    async def add(cls, **data):
        """Добавление данных"""
        obj = await cls.dao.add(**data)
        logger.info(f"Добавление {cls.model.__tablename__} {obj.id}")
        return {
            "detail": "Добавление прошло успешно",
            cls.model.__tablename__: obj,
        }

    @classmethod
    async def update(cls, **data):
        """Изменение данных"""
        data = {k: v for k, v in data.items() if v is not None}
        obj = await cls.dao.update(**data)
        if not obj:
            logger.warning(
                f"Не найдено {cls.model.__tablename__} с id {data.get("id")}"
            )
            raise HTTPException(status_code=404, detail="Не найден")
        logger.info(f"Изменение {cls.model.__tablename__} {obj.id}")
        return {
            "detail": "Изменения успешно применены",
            cls.model.__tablename__: obj,
        }

    @classmethod
    async def delete(cls, id: int):
        """Удаление данных"""
        obj = await cls.dao.find_by_id(id)
        if not obj:
            logger.warning(f"Не найдено {cls.model.__tablename__} с id {id}")
            raise HTTPException(status_code=404, detail="Не найден")
        logger.info(f"Удаление {cls.model.__tablename__} №{id}")
        return {
            "detail": "Успешно удалено",
            cls.model.__tablename__: await cls.dao.delete(id=id),
        }
