# Документация сервиса авторизации

## Общая информация

Сервис предоставляет API для регистрации, аутентификации, управления пользователями и обновления токенов.

**OpenAPI version:** 3.1.0
**Service version:** 0.1.0

---

## Назначение сервиса

Сервис авторизации предназначен для:
- регистрации пользователей;
- входа и выхода из системы;
- получения и обновления данных пользователя;
- управления пользователями;
- обновления JWT-токенов доступа.

---

## Основные сущности

### Role
Роль пользователя. Возможные значения:
- `Администратор`
- `Сотрудник`
- `Пользователь`

### SUsers
Модель пользователя.

```json
{
  "id": 1,
  "login": "ivanov",
  "role": "Пользователь",
  "fio": "Иванов Иван Иванович",
  "email": "ivanov@example.com"
}
```

### Token
Токены авторизации, возвращаемые при входе в систему.

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

### RefreshResponse
Ответ при обновлении токенов.

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

### ResponseDetail
Стандартный ответ с сообщением о результате операции.

```json
{
  "detail": "string"
}
```

---

## API endpoints

## 1. Получить текущего пользователя

**GET** `/api/users/me`

Возвращает данные текущего авторизованного пользователя.

### Response 200
```json
{
  "users": {
    "id": 1,
    "login": "ivanov",
    "role": "Пользователь",
    "fio": "Иванов Иван Иванович",
    "email": "ivanov@example.com"
  }
}
```

---

## 2. Получить список всех пользователей

**GET** `/api/users/`

Возвращает список всех пользователей.

### Response 200
```json
{
  "users": [
    {
      "id": 1,
      "login": "ivanov",
      "role": "Пользователь",
      "fio": "Иванов Иван Иванович",
      "email": "ivanov@example.com"
    }
  ]
}
```

---

## 3. Обновить пользователя

**PATCH** `/api/users/`

Обновляет данные пользователя.

### Request body
```json
{
  "id": 1,
  "login": "ivanov",
  "password": "new_password",
  "role": "Пользователь",
  "fio": "Иванов Иван Иванович",
  "email": "ivanov@example.com"
}
```

### Response 200
```json
{
  "detail": "Пользователь обновлен",
  "users": {
    "id": 1,
    "login": "ivanov",
    "role": "Пользователь",
    "fio": "Иванов Иван Иванович",
    "email": "ivanov@example.com"
  }
}
```

### Response 422
Ошибка валидации входных данных.

---

## 4. Удалить пользователя

**DELETE** `/api/users/?id={id}`

Удаляет пользователя по идентификатору.

### Query params
- `id` — идентификатор пользователя

### Response 200
```json
{
  "detail": "Пользователь удален",
  "users": {
    "id": 1,
    "login": "ivanov",
    "role": "Пользователь",
    "fio": "Иванов Иван Иванович",
    "email": "ivanov@example.com"
  }
}
```

### Response 422
Ошибка валидации.

---

## 5. Получить пользователя по ID

**GET** `/api/users/{id}`

Возвращает информацию о пользователе по идентификатору.

### Path params
- `id` — идентификатор пользователя

### Response 200
```json
{
  "users": {
    "id": 1,
    "login": "ivanov",
    "role": "Пользователь",
    "fio": "Иванов Иван Иванович",
    "email": "ivanov@example.com"
  }
}
```

### Response 422
Ошибка валидации.

---

## 6. Регистрация пользователя

**POST** `/api/users/register`

Регистрирует нового пользователя.

### Request body
```json
{
  "login": "ivanov",
  "password": "secure_password",
  "fio": "Иванов Иван Иванович",
  "email": "ivanov@example.com"
}
```

### Response 200
```json
{
  "users": {
    "id": 1,
    "login": "ivanov",
    "role": "Пользователь",
    "fio": "Иванов Иван Иванович",
    "email": "ivanov@example.com"
  }
}
```

### Response 422
Ошибка валидации.

---

## 7. Добавление пользователя

**POST** `/api/users/add`

Создает нового пользователя с указанием роли.

### Request body
```json
{
  "login": "ivanov",
  "password": "secure_password",
  "role": "Администратор",
  "fio": "Иванов Иван Иванович",
  "email": "ivanov@example.com"
}
```

### Response 200
```json
{
  "detail": "Пользователь успешно добавлен"
}
```

### Response 422
Ошибка валидации.

---

## 8. Вход пользователя

**POST** `/api/users/login`

Аутентификация пользователя.

### Request body
```json
{
  "login": "ivanov",
  "password": "secure_password"
}
```

### Response 200
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

### Response 422
Ошибка валидации.

---

## 9. Выход пользователя

**POST** `/api/users/logout`

Завершает пользовательскую сессию.

### Response 200
```json
{
  "detail": "Выход выполнен успешно"
}
```

---

## 10. Изменение ФИО

**PATCH** `/api/users/edit-fio`

Изменяет ФИО текущего пользователя.

### Request body
```json
{
  "fio": "Новое ФИО"
}
```

### Response 200
```json
{
  "detail": "ФИО успешно обновлено"
}
```

### Response 422
Ошибка валидации.

---

## 11. Изменение email

**PATCH** `/api/users/edit-email`

Изменяет email текущего пользователя.

### Request body
```json
{
  "email": "new_email@example.com"
}
```

### Response 200
```json
{
  "detail": "Email успешно обновлен"
}
```

### Response 422
Ошибка валидации.

---

## 12. Изменение пароля

**PATCH** `/api/users/edit-password`

Изменяет пароль текущего пользователя.

### Request body
```json
{
  "last_password": "old_password",
  "new_password": "new_password",
  "confirm_password": "new_password"
}
```

### Response 200
```json
{
  "detail": "Пароль успешно обновлен"
}
```

### Response 422
Ошибка валидации.

---

## 13. Обновление токенов

**POST** `/api/refresh/`

Обновляет access token и refresh token.

### Response 200
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

---

## Модели запросов

### RequestRegisterUsers
```json
{
  "login": "string",
  "password": "string",
  "fio": "string",
  "email": "string"
}
```

### RequestAddUsers
```json
{
  "login": "string",
  "password": "string",
  "role": "Администратор",
  "fio": "string",
  "email": "string"
}
```

### RequestLoginUsers
```json
{
  "login": "string",
  "password": "string"
}
```

### RequestEditFIO
```json
{
  "fio": "string"
}
```

### RequestEditEmail
```json
{
  "email": "user@example.com"
}
```

### RequestEditPassword
```json
{
  "last_password": "string",
  "new_password": "string",
  "confirm_password": "string"
}
```

### RequestUpdateUsers
```json
{
  "id": 1,
  "login": "string",
  "password": "string",
  "role": "Пользователь",
  "fio": "string",
  "email": "string"
}
```

---

## Модели ответов

### ResponseDetail
```json
{
  "detail": "string"
}
```

### ResponseUsers
```json
{
  "users": {
    "id": 1,
    "login": "string",
    "role": "Пользователь",
    "fio": "string",
    "email": "string"
  }
}
```

### ResponseUsersList
```json
{
  "users": [
    {
      "id": 1,
      "login": "string",
      "role": "Пользователь",
      "fio": "string",
      "email": "string"
    }
  ]
}
```

### ResponseUsersDetail
```json
{
  "detail": "string",
  "users": {
    "id": 1,
    "login": "string",
    "role": "Пользователь",
    "fio": "string",
    "email": "string"
  }
}
```

### Token
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

### RefreshResponse
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

---

## Ошибки валидации

### HTTPValidationError
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "string",
      "type": "string",
      "input": "any",
      "ctx": {}
    }
  ]
}
```

### ValidationError
```json
{
  "loc": ["body", "field_name"],
  "msg": "string",
  "type": "string",
  "input": "any",
  "ctx": {}
}
```

---

## Пример типового сценария работы

### Регистрация
1. Пользователь отправляет запрос на `POST /api/users/register`.
2. Сервис создает учетную запись.
3. В ответ возвращаются данные созданного пользователя.

### Вход
1. Пользователь отправляет логин и пароль на `POST /api/users/login`.
2. Сервис проверяет учетные данные.
3. В ответ возвращаются `access_token` и `refresh_token`.

### Обновление токена
1. Клиент вызывает `POST /api/refresh/`.
2. Сервис выдает новую пару токенов.

### Выход
1. Пользователь вызывает `POST /api/users/logout`.
2. Сессия завершается, клиент удаляет локально сохраненные токены.

---

## Примечания

1. Методы `/api/users/me`, `/api/users/edit-fio`, `/api/users/edit-email`, `/api/users/edit-password`, `/api/users/logout` и `/api/refresh/` обычно используются в контексте уже авторизованного пользователя.
2. Метод `/api/users/add` предполагает создание пользователя, как правило, со стороны администратора.
3. Метод `/api/users/` с `PATCH` и `DELETE` предназначен для административного управления пользователями.
4. В `Token` и `RefreshResponse` поле `token_type` по умолчанию имеет значение `bearer`.
