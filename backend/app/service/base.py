import asyncio
import os
import subprocess
import tempfile
from pathlib import Path
from app.utils.s3 import s3_client
from loguru import logger


class ServiceBase:
    @classmethod
    async def convert_to_pdf(cls, input_s3_key: str) -> str:
        """
        input_s3_key: ключ исходного файла в S3 (например: "statement.docx")
        return: ключ pdf в S3 (например: "statement.pdf")
        """
        # Ключ PDF в S3 (тот же путь/имя, но .pdf)
        pdf_s3_key = str(Path(input_s3_key).with_suffix(".pdf"))

        # 1) Скачать исходник из S3
        file_obj = await s3_client.get_file(input_s3_key)
        if file_obj is None:
            raise FileNotFoundError(f"Не удалось получить файл из S3: {input_s3_key}")

        # 2) Конвертировать во временной директории (LibreOffice работает с путями)
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)

            # сохраняем файл локально с исходным расширением (важно для LO)
            input_name = Path(input_s3_key).name  # statement.docx
            input_path = tmpdir_path / input_name
            input_path.write_bytes(file_obj.getvalue())

            # LibreOffice кладёт PDF в outdir, имя = stem + ".pdf"
            expected_pdf_path = tmpdir_path / (input_path.stem + ".pdf")

            cmd = [
                "libreoffice",
                "--headless",
                "--nologo",
                "--nofirststartwizard",
                "--convert-to",
                "pdf",
                "--outdir",
                str(tmpdir_path),
                str(input_path),
            ]

            try:
                await asyncio.to_thread(
                    subprocess.run,
                    cmd,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
            except subprocess.CalledProcessError as e:
                logger.error(
                    f"LibreOffice error: {e.stderr.decode('utf-8', errors='ignore')}"
                )
                raise

            if not expected_pdf_path.exists():
                pdf_files = list(tmpdir_path.glob("*.pdf"))
                if not pdf_files:
                    raise FileNotFoundError("PDF не был создан LibreOffice")
                expected_pdf_path = pdf_files[0]

            pdf_bytes = expected_pdf_path.read_bytes()

        # 3) Загрузить PDF в S3
        try:
            await s3_client.upload_bytes(url=pdf_s3_key, file=pdf_bytes)
        except Exception as e:
            logger.error(f"Не удалось загрузить PDF в S3: {pdf_s3_key}")
            return False

        return pdf_s3_key
