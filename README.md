# ЛИП API (Локер-Инсайт-Потенциал)

API для интерактивного воркшопа ЛИП, где участники помогают друг другу находить инсайты из проблем в бизнесе.

## Концепция

ЛИП (Локер-Инсайт-Потенциал) — это структурированный подход к решению проблем:

1. **Локер** — определение проблемы и выявление противоречий
2. **Инсайт** — поиск неочевидных решений
3. **Потенциал** — составление плана реализации инсайта

## Структура проекта

- `index.html` — интерфейс воркшопа
- `api.js` — клиентская часть API
- `server.js` — серверная часть API на Node.js
- `package.json` — зависимости проекта

## Установка и запуск

### Предварительные требования

- Node.js (версия 14.x или выше)
- MongoDB (версия 4.x или выше)

### Шаги установки

1. Клонировать репозиторий:

```bash
git clone https://github.com/yourusername/lip-workshop.git
cd lip-workshop
```

2. Установить зависимости:

```bash
npm install
```

3. Настроить переменные окружения:

Создайте файл `.env` в корне проекта со следующим содержимым:

```
MONGODB_URI=mongodb://localhost:27017/lip-workshop
JWT_SECRET=your_secret_key
PORT=3000
```

4. Запустить сервер:

```bash
# Для разработки (с автоматической перезагрузкой)
npm run dev

# Для продакшена
npm start
```

5. Приложение будет доступно по адресу:
   - Интерфейс воркшопа: `http://localhost:3000`
   - API: `http://localhost:3000/api`

## Использование API

### Аутентификация

#### Регистрация пользователя

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "password": "секретный_пароль"
}
```

#### Авторизация

```http
POST /auth/login
Content-Type: application/json

{
  "email": "ivan@example.com",
  "password": "секретный_пароль"
}
```

### Работа с сессиями

#### Создание сессии

```http
POST /sessions
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Решение проблем в маркетинге",
  "description": "Воркшоп по поиску новых идей для маркетинговых кампаний",
  "participantEmails": ["user1@example.com", "user2@example.com"]
}
```

#### Получение списка сессий

```http
GET /sessions
Authorization: Bearer YOUR_TOKEN
```

#### Присоединение к сессии по коду

```http
POST /sessions/join
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "sessionCode": "ABC123"
}
```

### Работа с локерами (проблемами)

#### Создание локера

```http
POST /sessions/{sessionId}/lockers
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Низкая конверсия",
  "description": "На сайте очень низкая конверсия из посетителей в клиентов",
  "contradiction": "Хочу увеличить конверсию, но не могу изменить дизайн сайта",
  "attempts": "Пробовали A/B тесты, но без значительных результатов"
}
```

#### Получение локеров в сессии

```http
GET /sessions/{sessionId}/lockers
Authorization: Bearer YOUR_TOKEN
```

### Работа с инсайтами

#### Создание инсайта для локера

```http
POST /sessions/{sessionId}/lockers/{lockerId}/insights
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "content": "А что если использовать геймификацию и создать систему достижений для пользователей?"
}
```

#### Получение инсайтов для локера

```http
GET /sessions/{sessionId}/lockers/{lockerId}/insights
Authorization: Bearer YOUR_TOKEN
```

#### Лайк инсайта

```http
POST /sessions/{sessionId}/insights/{insightId}/like
Authorization: Bearer YOUR_TOKEN
```

### Работа с потенциалом (планы действий)

#### Создание плана действий

```http
POST /sessions/{sessionId}/potentials
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "lockerId": "lockerId",
  "insightId": "insightId",
  "goal": "Увеличить конверсию на 15% за 2 месяца",
  "steps": [
    {
      "description": "Разработать систему достижений для пользователей",
      "deadline": "2023-12-01"
    },
    {
      "description": "Тестирование на фокус-группе",
      "deadline": "2023-12-15"
    },
    {
      "description": "Полный запуск на сайте",
      "deadline": "2024-01-01"
    }
  ],
  "obstacles": "Сложности с интеграцией в текущую архитектуру сайта",
  "supportNeeded": "Нужна помощь с дизайном геймифицированных элементов"
}
```

#### Получение планов действий в сессии

```http
GET /sessions/{sessionId}/potentials
Authorization: Bearer YOUR_TOKEN
```

#### Обновление статуса шага плана

```http
PUT /sessions/{sessionId}/potentials/{potentialId}/steps/{stepIndex}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "completed": true
}
```

### Работа с уведомлениями

#### Получение уведомлений

```http
GET /notifications
Authorization: Bearer YOUR_TOKEN
```

#### Отметка уведомления как прочитанного

```http
PUT /notifications/{notificationId}/read
Authorization: Bearer YOUR_TOKEN
```

## Лицензия

MIT 