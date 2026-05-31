from cryptography.fernet import Fernet
from app.config import settings


class Encryption(Fernet):
    _fernet = Fernet(settings.ENCRYPTION_KEY)

    @classmethod
    def encrypt_value(cls, value: str) -> str:
        """Шифрование данных

        Args:
            value (str): данные для шифрования

        Returns:
            str: зашифрованные данные
        """
        if value is None:
            return None
        return cls._fernet.encrypt(value.encode()).decode()

    @classmethod
    def decrypt_value(cls, value: str) -> str:
        """Расшифровка данных

        Args:
            value (str): зашифрованные данные

        Returns:
            str: расшифрованные данные
        """
        if value is None:
            return None
        return cls._fernet.decrypt(value.encode()).decode()


encryption = Encryption(settings.ENCRYPTION_KEY)
