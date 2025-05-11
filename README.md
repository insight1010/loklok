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

## Настройка авторизации через Telegram

### 1. Создание бота в Telegram

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания нового бота:
   - Укажите имя бота (например, "ЛИП Бот")
   - Укажите username для бота (например, "lip_workshop_bot")
4. После создания бота вы получите токен бота (bot token). Сохраните его, он понадобится для настройки.
5. Отправьте команду `/setdomain` и укажите домен вашего сайта (например, `lip-workshop.ru`)

### 2. Настройка приложения

#### Клиентская часть (app.js)

1. Откройте файл `app.js`
2. Найдите блок конфигурации:
   ```javascript
   config: {
       botToken: 'YOUR_BOT_TOKEN',
       apiUrl: 'https://your-backend-api.com',
   },
   ```
3. Замените `YOUR_BOT_TOKEN` на токен вашего бота
4. Замените `https://your-backend-api.com` на URL вашего API

#### Серверная часть (server.js)

1. Установите необходимые зависимости:
   ```bash
   npm install express cors crypto body-parser
   ```
2. Настройте переменные окружения:
   - `TELEGRAM_BOT_TOKEN` - токен вашего бота

3. Запустите сервер:
   ```bash
   node server.js
   ```

#### HTML (index.html)

1. Откройте файл `index.html`
2. Найдите блок с Telegram Login Widget:
   ```html
   <script async src="https://telegram.org/js/telegram-widget.js?22" 
       data-telegram-login="YOUR_BOT_NAME" 
       data-size="large" 
       data-radius="10" 
       data-onauth="onTelegramAuth(user)" 
       data-request-access="write">
   </script>
   ```
3. Замените `YOUR_BOT_NAME` на username вашего бота (без символа @)

### 3. Проверка работоспособности

1. Откройте ваш сайт
2. Нажмите на кнопку входа через Telegram
3. Авторизуйтесь через Telegram
4. Проверьте, что данные пользователя отображаются корректно

## Безопасность

При использовании Telegram Login Widget в рабочем окружении необходимо обязательно проверять хеш данных на сервере, чтобы убедиться, что данные действительно пришли от Telegram. Эта проверка реализована в функции `verifyTelegramData` в файле `server.js`.

## Дополнительные ресурсы

- [Официальная документация Telegram Login Widget](https://core.telegram.org/widgets/login)
- [Проверка данных авторизации](https://core.telegram.org/widgets/login#checking-authorization)

## Лицензия

MIT

## Деплой на сервере

### Подготовка сервера

1. Подключитесь к серверу по SSH:
   ```bash
   ssh username@your-server-ip
   ```

2. Установите Docker и Docker Compose:
   ```bash
   # Обновите пакеты
   sudo apt update
   sudo apt upgrade -y

   # Установите необходимые пакеты
   sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

   # Добавьте Docker GPG ключ
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

   # Добавьте Docker репозиторий
   sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

   # Установите Docker
   sudo apt update
   sudo apt install -y docker-ce

   # Установите Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Добавьте вашего пользователя в группу docker, чтобы не использовать sudo
   sudo usermod -aG docker $USER
   # Перезайдите в систему, чтобы изменения вступили в силу
   ```

### Деплой приложения

1. Клонируйте репозиторий на сервер:
   ```bash
   git clone https://github.com/yourusername/lip-workshop.git
   cd lip-workshop
   ```

2. Создайте файл .env с настройками окружения:
   ```bash
   echo "TELEGRAM_BOT_TOKEN=your_bot_token" > .env
   echo "JWT_SECRET=your_secure_jwt_secret" >> .env
   ```

3. Запустите приложение:
   ```bash
   docker-compose up -d
   ```

4. Проверьте, что контейнеры запущены:
   ```bash
   docker ps
   ```

5. Настройте Nginx как обратный прокси (по необходимости):
   ```bash
   sudo apt install -y nginx
   
   # Конфигурация для Nginx
   sudo nano /etc/nginx/sites-available/lip-workshop
   ```

   Содержимое файла:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Активируйте конфигурацию:
   ```bash
   sudo ln -s /etc/nginx/sites-available/lip-workshop /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. Настройте SSL с помощью Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Обслуживание

1. Просмотр логов:
   ```bash
   docker logs lip-app
   docker logs lip-mongo
   ```

2. Обновление приложения:
   ```bash
   git pull
   docker-compose down
   docker-compose up -d --build
   ```

3. Создание резервной копии базы данных:
   ```bash
   docker exec lip-mongo mongodump --out /data/backup
   docker cp lip-mongo:/data/backup ./backup
   ```

4. Мониторинг приложения:
   ```bash
   docker stats
   ``` 