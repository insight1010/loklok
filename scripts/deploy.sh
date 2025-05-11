#!/bin/bash

# Скрипт для автоматического деплоя ЛИП на сервер

# Настройки
SERVER_HOST="root@2a03:6f00:a::9409"
SSH_KEY="~/.ssh/id_rsa"
DEPLOY_PATH="/root/lip-workshop"
REPOSITORY="https://github.com/yourusername/lip-workshop.git"

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

# Начало деплоя
echo_c "🚀 Начинаем деплой ЛИП на сервер $SERVER_HOST..." "$YELLOW"
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

# Проверка наличия Git на сервере
echo_c "Проверка наличия Git на сервере..." "$YELLOW"
if ssh_command "which git" > /dev/null; then
  echo_c "✅ Git установлен на сервере." "$GREEN"
else
  echo_c "❌ Git не обнаружен на сервере. Установка Git..." "$RED"
  ssh_command "sudo apt-get update && sudo apt-get install -y git"
fi
echo

# Проверка наличия Docker и Docker Compose
echo_c "Проверка наличия Docker на сервере..." "$YELLOW"
if ssh_command "which docker" > /dev/null; then
  echo_c "✅ Docker установлен на сервере." "$GREEN"
else
  echo_c "❌ Docker не обнаружен на сервере. Установка Docker..." "$RED"
  ssh_command "sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - && \
    sudo add-apt-repository \"deb [arch=amd64] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable\" && \
    sudo apt-get update && sudo apt-get install -y docker-ce && \
    sudo usermod -aG docker \$USER"
fi
echo

echo_c "Проверка наличия Docker Compose на сервере..." "$YELLOW"
if ssh_command "which docker-compose" > /dev/null; then
  echo_c "✅ Docker Compose установлен на сервере." "$GREEN"
else
  echo_c "❌ Docker Compose не обнаружен на сервере. Установка Docker Compose..." "$RED"
  ssh_command "sudo curl -L \"https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && \
    sudo chmod +x /usr/local/bin/docker-compose"
fi
echo

# Проверка наличия директории проекта на сервере
echo_c "Проверка наличия директории проекта на сервере..." "$YELLOW"
if ssh_command "test -d $DEPLOY_PATH && echo exists" | grep -q "exists"; then
  echo_c "✅ Директория проекта существует. Обновление репозитория..." "$GREEN"
  ssh_command "cd $DEPLOY_PATH && git pull"
else
  echo_c "Директория проекта не найдена. Клонирование репозитория..." "$YELLOW"
  ssh_command "git clone $REPOSITORY $DEPLOY_PATH"
fi
echo

# Проверка наличия файла .env
echo_c "Проверка наличия файла .env..." "$YELLOW"
if ssh_command "test -f $DEPLOY_PATH/.env && echo exists" | grep -q "exists"; then
  echo_c "✅ Файл .env существует." "$GREEN"
else
  echo_c "Файл .env не найден. Создание файла .env..." "$YELLOW"
  echo "Пожалуйста, введите токен Telegram бота:"
  read -r bot_token
  echo "Пожалуйста, введите секретный ключ для JWT (оставьте пустым для генерации случайного):"
  read -r jwt_secret
  
  if [ -z "$jwt_secret" ]; then
    jwt_secret=$(openssl rand -hex 32)
    echo_c "Сгенерирован случайный JWT секретный ключ." "$GREEN"
  fi
  
  ssh_command "echo \"TELEGRAM_BOT_TOKEN=$bot_token\" > $DEPLOY_PATH/.env && \
    echo \"JWT_SECRET=$jwt_secret\" >> $DEPLOY_PATH/.env"
  echo_c "✅ Файл .env создан." "$GREEN"
fi
echo

# Запуск приложения
echo_c "Запуск Docker контейнеров..." "$YELLOW"
ssh_command "cd $DEPLOY_PATH && docker-compose down && docker-compose up -d --build"
echo_c "✅ Docker контейнеры запущены." "$GREEN"
echo

# Проверка статуса контейнеров
echo_c "Проверка статуса контейнеров:" "$YELLOW"
ssh_command "docker ps | grep lip"
echo

echo_c "🎉 Деплой успешно завершен!" "$GREEN"
echo_c "Ваше приложение ЛИП доступно по адресу http://<server-ip>:3000" "$GREEN"
echo_c "Рекомендуется настроить Nginx и SSL для вашего домена." "$YELLOW" 