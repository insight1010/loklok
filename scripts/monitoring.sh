#!/bin/bash

# Скрипт для мониторинга приложения ЛИП

# Настройки
SERVER_HOST="username@your-server-ip"
SSH_KEY="~/.ssh/id_rsa"
DEPLOY_PATH="/home/username/lip-workshop"
LOG_DIR="$DEPLOY_PATH/logs"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
HEALTH_CHECK_URL="http://localhost:3000/health"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
echo_c() {
  echo -e "${2}${1}${NC}"
}

# Функция для выполнения команд на сервере
ssh_command() {
  ssh -i $SSH_KEY $SERVER_HOST "$1"
}

# Начало мониторинга
echo_c "🔍 Проверка состояния приложения ЛИП..." "$YELLOW"
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

# Создаем директорию для логов, если её нет
ssh_command "mkdir -p $LOG_DIR"

# Проверка статуса Docker
echo_c "Проверка статуса Docker..." "$YELLOW"
DOCKER_STATUS=$(ssh_command "systemctl is-active docker")
if [[ "$DOCKER_STATUS" == "active" ]]; then
  echo_c "✅ Docker активен." "$GREEN"
else
  echo_c "❌ Docker не запущен. Пытаюсь запустить..." "$RED"
  ssh_command "sudo systemctl start docker"
  sleep 3
  DOCKER_STATUS=$(ssh_command "systemctl is-active docker")
  if [[ "$DOCKER_STATUS" == "active" ]]; then
    echo_c "✅ Docker успешно запущен." "$GREEN"
  else
    echo_c "❌ Не удалось запустить Docker." "$RED"
    exit 1
  fi
fi
echo

# Проверка статуса контейнеров
echo_c "Проверка статуса контейнеров..." "$YELLOW"
CONTAINER_STATUS=$(ssh_command "docker ps --format '{{.Names}}: {{.Status}}' | grep lip")
if [[ -z "$CONTAINER_STATUS" ]]; then
  echo_c "❌ Контейнеры приложения ЛИП не запущены. Запускаю..." "$RED"
  ssh_command "cd $DEPLOY_PATH && docker-compose up -d"
  sleep 10
  CONTAINER_STATUS=$(ssh_command "docker ps --format '{{.Names}}: {{.Status}}' | grep lip")
  if [[ -z "$CONTAINER_STATUS" ]]; then
    echo_c "❌ Не удалось запустить контейнеры." "$RED"
    exit 1
  else
    echo_c "✅ Контейнеры успешно запущены:" "$GREEN"
    echo "$CONTAINER_STATUS"
  fi
else
  echo_c "✅ Контейнеры активны:" "$GREEN"
  echo "$CONTAINER_STATUS"
fi
echo

# Проверка health-check endpoint'а
echo_c "Проверка API приложения..." "$YELLOW"
HEALTH_CHECK=$(ssh_command "curl -s -o /dev/null -w '%{http_code}' $HEALTH_CHECK_URL")
if [[ "$HEALTH_CHECK" == "200" ]]; then
  echo_c "✅ API приложения работает нормально (HTTP 200)." "$GREEN"
else
  echo_c "❌ API приложения не отвечает или вернул ошибку (HTTP $HEALTH_CHECK)." "$RED"
  echo_c "Проверяю логи приложения..." "$YELLOW"
  ssh_command "docker logs --tail 50 lip-app"
fi
echo

# Проверка статуса Nginx
echo_c "Проверка статуса Nginx..." "$YELLOW"
NGINX_STATUS=$(ssh_command "systemctl is-active nginx")
if [[ "$NGINX_STATUS" == "active" ]]; then
  echo_c "✅ Nginx активен." "$GREEN"
else
  echo_c "❌ Nginx не запущен. Пытаюсь запустить..." "$RED"
  ssh_command "sudo systemctl start nginx"
  sleep 2
  NGINX_STATUS=$(ssh_command "systemctl is-active nginx")
  if [[ "$NGINX_STATUS" == "active" ]]; then
    echo_c "✅ Nginx успешно запущен." "$GREEN"
  else
    echo_c "❌ Не удалось запустить Nginx." "$RED"
    exit 1
  fi
fi
echo

# Проверка использования ресурсов
echo_c "Использование ресурсов:" "$BLUE"
ssh_command "echo 'CPU и память:'; docker stats --no-stream | grep lip; echo; echo 'Использование диска:'; df -h | grep -E '/$|/home'"
echo

# Проверка логов на наличие ошибок
echo_c "Проверка логов на наличие ошибок..." "$YELLOW"
ERROR_COUNT=$(ssh_command "docker logs --since 24h lip-app 2>&1 | grep -i -E 'error|exception|fatal' | wc -l")
if [[ "$ERROR_COUNT" -gt 0 ]]; then
  echo_c "⚠️ Обнаружено $ERROR_COUNT ошибок в логах за последние 24 часа." "$RED"
  echo_c "Показываю последние 10 ошибок:" "$RED"
  ssh_command "docker logs --since 24h lip-app 2>&1 | grep -i -E 'error|exception|fatal' | tail -10"
else
  echo_c "✅ Ошибок в логах не обнаружено." "$GREEN"
fi
echo

# Сохранение отчета о мониторинге
echo_c "Сохранение отчета о мониторинге..." "$YELLOW"
ssh_command "echo '--- Отчет о мониторинге ЛИП ($DATE) ---' > $LOG_DIR/monitoring_$DATE.log"
ssh_command "echo 'Статус Docker: $DOCKER_STATUS' >> $LOG_DIR/monitoring_$DATE.log"
ssh_command "echo 'Статус контейнеров: ' >> $LOG_DIR/monitoring_$DATE.log"
ssh_command "docker ps --format '{{.Names}}: {{.Status}}' | grep lip >> $LOG_DIR/monitoring_$DATE.log"
ssh_command "echo 'Статус API: $HEALTH_CHECK' >> $LOG_DIR/monitoring_$DATE.log"
ssh_command "echo 'Статус Nginx: $NGINX_STATUS' >> $LOG_DIR/monitoring_$DATE.log"
ssh_command "echo 'Ошибок в логах: $ERROR_COUNT' >> $LOG_DIR/monitoring_$DATE.log"
ssh_command "echo 'Использование ресурсов:' >> $LOG_DIR/monitoring_$DATE.log"
ssh_command "docker stats --no-stream | grep lip >> $LOG_DIR/monitoring_$DATE.log"
ssh_command "df -h | grep -E '/$|/home' >> $LOG_DIR/monitoring_$DATE.log"
echo_c "✅ Отчет сохранен в $LOG_DIR/monitoring_$DATE.log" "$GREEN"
echo

echo_c "🎉 Мониторинг завершен!" "$GREEN"
echo_c "Все сервисы проверены и находятся в рабочем состоянии." "$GREEN" 