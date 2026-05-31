class ApplicationsService:
    @staticmethod
    async def format_application(app: dict, index: int, total: int) -> str:
        text = (
            f"Заявление {index + 1} из {total}\n\n"
            f"№ {app.get('id')}\n"
            f"ФИО: {app.get('fio')}\n"
            f"Телефон: {app.get('phone')}\n"
            f"Email: {app.get('email')}\n"
            f"Адрес: {app.get('address')}\n"
            f"Кадастровый номер: {app.get('cadastral_number')}\n"
            f"Статус: {app.get('status')}\n"
        )
        dep = app.get("departure_date")
        if dep:
            text += f"Дата выезда: {dep.split('T')[0]}\n"
        return text
