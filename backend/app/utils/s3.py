from io import BytesIO
from loguru import logger
from contextlib import asynccontextmanager
from aiobotocore.session import get_session
from botocore.exceptions import BotoCoreError, ClientError
from app.config import settings


class S3Client:
    def __init__(
        self,
        access_key: str,
        secret_key: str,
        endpoint_url: str,
        bucket_name: str,
    ):
        self.config = {
            "aws_access_key_id": access_key,
            "aws_secret_access_key": secret_key,
            "endpoint_url": endpoint_url,
            "verify": False,
        }
        self.bucket_name = bucket_name
        self.session = get_session()

    @asynccontextmanager
    async def get_client(self):
        async with self.session.create_client("s3", **self.config) as client:
            yield client

    async def upload_file(self, url: str, file):
        """Добавление файла в s3 хранилище

        Args:
            url (str): url
            file (_type_): Файл из FastApi (UploadFile)

        Returns:
            bool: Статус загрузки
        """
        try:
            file_obj = BytesIO(await file.read())
            async with self.get_client() as client:
                await client.put_object(
                    Bucket=self.bucket_name, Key=url, Body=file_obj.getvalue()
                )
            logger.info(f"Файл {url} загружен в {self.bucket_name}")
            return True
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Ошибка загрузки {url}: {e}")
            return False

    async def upload_bytes(self, url: str, file: bytes) -> bool:
        """Загрузка готовых байт в S3"""
        try:
            async with self.get_client() as client:
                await client.put_object(Bucket=self.bucket_name, Key=url, Body=file)
            logger.info(f"Файл {url} загружен в {self.bucket_name}")
            return True
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Ошибка загрузки {url}: {e}")
            return False

    async def delete_file(self, url: str):
        """Удаление файла из s3 хранилища

        Args:
            url (str): адрес файла
        """
        try:
            async with self.get_client() as client:
                await client.delete_object(Bucket=self.bucket_name, Key=url)
                logger.info(f"Файл {url} удален из {self.bucket_name}")
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Ошибка удаления файла {url}: {e}")

    async def get_file(self, url: str) -> BytesIO:
        """Возвращает файл из s3 как объект BytesIO

        Args:
            url (str): Ссылка на файл

        Returns:
            BytesIO: Файл
        """
        try:
            async with self.get_client() as client:
                response = await client.get_object(Bucket=self.bucket_name, Key=url)
                file_bytes = await response["Body"].read()
                logger.info(f"Файл {url} успешно получен из {self.bucket_name}")
                return BytesIO(file_bytes)
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Ошибка при получении файла {url}: {e}")
            return None

    async def get_text_from_file(self, url: str, encoding: str = "utf-8") -> str | None:
        """Возвращает текстовое содержимое файла из s3

        Args:
            url (str): Ссылка на файл
            encoding (str, optional): кодировка. Defaults to "utf-8".

        Returns:
            str | None: Содержимое файла
        """
        try:
            async with self.get_client() as client:
                response = await client.get_object(Bucket=self.bucket_name, Key=url)
                data = await response["Body"].read()
                text = data.decode(encoding)
                logger.info(f"Текст из файла {url} успешно прочитан")
                return text
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Ошибка чтения файла {url}: {e}")
            return None
        except UnicodeDecodeError as e:
            logger.error(f"Ошибка декодирования содержимого файла {url}: {e}")
            return None


s3_client = S3Client(
    access_key=settings.S3_ACCESS_KEY,
    secret_key=settings.S3_SECRET_KEY,
    endpoint_url=settings.S3_ENDPOINT_URL,
    bucket_name=settings.S3_BUCKET_NAME,
)
