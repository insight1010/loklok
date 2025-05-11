#!/bin/bash

# Скрипт для настройки переменных окружения на сервере

# Настройки
SERVER_HOST="root@2a03:6f00:a::9409"
SSH_KEY="~/.ssh/id_rsa"
DEPLOY_PATH="/root/lip-workshop"

# Пароль для root
ROOT_PASSWORD="yfu4MemdN+o-6M"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
echo_c() {
  echo -e "${2}${1}${NC}"
}

# Функция для выполнения команд на сервере
ssh_command() {
  ssh -i $SSH_KEY $SERVER_HOST "$1"
}

# Начало настройки
echo_c "⚙️ Настройка переменных окружения для ЛИП..." "$YELLOW"
echo

# Проверка соединения с сервером
echo_c "Проверка соединения с сервером..." "$YELLOW"
if ssh -i $SSH_KEY -q $SERVER_HOST exit; then
  echo_c "✅ Соединение с сервером установлено." "$GREEN"
else
  echo_c "❌ Не удалось подключиться к серверу. Проверьте настройки подключения." "$RED"
  exit 1
fi
echo

# Запрос токена бота Telegram
echo_c "Настройка переменных окружения..." "$YELLOW"
echo "Введите токен бота Telegram (или нажмите Enter для использования значения по умолчанию):"
read -r BOT_TOKEN

if [ -z "$BOT_TOKEN" ]; then
  BOT_TOKEN="ваш_реальный_токен_бота"
  echo_c "Используется значение по умолчанию для токена бота." "$YELLOW"
fi

# Генерация JWT секрета
JWT_SECRET=$(openssl rand -hex 32)
echo_c "Сгенерирован JWT секрет: $JWT_SECRET" "$GREEN"

# Создание .env файла
ENV_CONTENT="TELEGRAM_BOT_TOKEN=$BOT_TOKEN
JWT_SECRET=$JWT_SECRET
MONGODB_URI=mongodb://mongo:27017/lip-workshop
PORT=3000"

# Отправка .env файла на сервер
echo "$ENV_CONTENT" | ssh -i $SSH_KEY $SERVER_HOST "cat > $DEPLOY_PATH/.env"

# Проверка, что файл создан
if ssh_command "test -f $DEPLOY_PATH/.env && echo yes" | grep -q "yes"; then
  echo_c "✅ Файл .env успешно создан на сервере." "$GREEN"
  echo_c "Содержимое файла .env:" "$YELLOW"
  ssh_command "cat $DEPLOY_PATH/.env"
else
  echo_c "❌ Не удалось создать файл .env на сервере." "$RED"
  exit 1
fi

echo_c "🎉 Настройка переменных окружения успешно завершена!" "$GREEN" 