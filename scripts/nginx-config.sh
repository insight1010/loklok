#!/bin/bash

# Скрипт для настройки Nginx как обратного прокси для ЛИП

# Настройки
SERVER_HOST="root@2a03:6f00:a::9409"
SSH_KEY="~/.ssh/id_rsa"
DOMAIN="lip-workshop.ru" # Замените на свой домен
APP_PORT=3000

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
echo_c "🔄 Начинаем настройку Nginx для ЛИП на домене $DOMAIN..." "$YELLOW"
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

# Проверка наличия Nginx
echo_c "Проверка наличия Nginx на сервере..." "$YELLOW"
if ssh_command "which nginx" > /dev/null; then
  echo_c "✅ Nginx установлен на сервере." "$GREEN"
else
  echo_c "❌ Nginx не обнаружен на сервере. Установка Nginx..." "$RED"
  ssh_command "sudo apt-get update && sudo apt-get install -y nginx"
fi
echo

# Создание конфигурации Nginx
echo_c "Создание конфигурации Nginx для $DOMAIN..." "$YELLOW"

NGINX_CONFIG="server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}"

ssh_command "echo '$NGINX_CONFIG' | sudo tee /etc/nginx/sites-available/lip-workshop"
ssh_command "sudo ln -sf /etc/nginx/sites-available/lip-workshop /etc/nginx/sites-enabled/"
echo_c "✅ Конфигурация Nginx создана." "$GREEN"
echo

# Проверка конфигурации Nginx
echo_c "Проверка конфигурации Nginx..." "$YELLOW"
NGINX_TEST=$(ssh_command "sudo nginx -t 2>&1")
if [[ $NGINX_TEST == *"successful"* ]]; then
  echo_c "✅ Конфигурация Nginx прошла проверку." "$GREEN"
  ssh_command "sudo systemctl restart nginx"
  echo_c "✅ Nginx перезапущен." "$GREEN"
else
  echo_c "❌ Ошибка в конфигурации Nginx:" "$RED"
  echo "$NGINX_TEST"
  exit 1
fi
echo

# Установка Certbot и получение SSL-сертификата
echo_c "Проверка наличия Certbot на сервере..." "$YELLOW"
if ssh_command "which certbot" > /dev/null; then
  echo_c "✅ Certbot установлен на сервере." "$GREEN"
else
  echo_c "❌ Certbot не обнаружен на сервере. Установка Certbot..." "$RED"
  ssh_command "sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx"
fi
echo

# Запрос SSL-сертификата
echo_c "Запрос SSL-сертификата для $DOMAIN..." "$YELLOW"

echo "Хотите ли вы настроить SSL-сертификат для $DOMAIN? (y/n)"
read -r setup_ssl

if [[ $setup_ssl == "y" || $setup_ssl == "Y" ]]; then
  echo "Введите ваш email для регистрации в Let's Encrypt:"
  read -r email
  
  # Запускаем Certbot для получения сертификата
  CERTBOT_RESULT=$(ssh_command "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $email 2>&1")
  
  if [[ $CERTBOT_RESULT == *"Congratulations"* ]]; then
    echo_c "✅ SSL-сертификат успешно получен и установлен." "$GREEN"
  else
    echo_c "❌ Ошибка при получении SSL-сертификата:" "$RED"
    echo "$CERTBOT_RESULT"
    echo_c "Продолжаем без SSL-сертификата. Вы можете настроить его позже вручную." "$YELLOW"
  fi
else
  echo_c "Настройка SSL-сертификата пропущена." "$YELLOW"
fi
echo

echo_c "🎉 Настройка Nginx завершена!" "$GREEN"
if [[ $setup_ssl == "y" || $setup_ssl == "Y" ]]; then
  echo_c "Ваше приложение ЛИП доступно по адресу https://$DOMAIN" "$GREEN"
else
  echo_c "Ваше приложение ЛИП доступно по адресу http://$DOMAIN" "$GREEN"
fi
echo_c "Убедитесь, что ваш домен указывает на IP-адрес сервера через DNS-записи A или CNAME." "$YELLOW" 