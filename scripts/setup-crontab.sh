#!/bin/bash

# Скрипт для настройки crontab для автоматического мониторинга и резервного копирования

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
echo_c "⏰ Настройка автоматических задач для приложения ЛИП..." "$YELLOW"
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

# Проверка наличия скриптов мониторинга и резервного копирования на сервере
echo_c "Проверка наличия скриптов на сервере..." "$YELLOW"
MONITORING_EXISTS=$(ssh_command "test -f $DEPLOY_PATH/scripts/monitoring.sh && echo 1 || echo 0")
BACKUP_EXISTS=$(ssh_command "test -f $DEPLOY_PATH/scripts/backup.sh && echo 1 || echo 0")

if [[ "$MONITORING_EXISTS" == "0" || "$BACKUP_EXISTS" == "0" ]]; then
  echo_c "❌ Некоторые скрипты отсутствуют на сервере. Копирую их..." "$RED"
  
  # Создаем директорию для скриптов на сервере, если её нет
  ssh_command "mkdir -p $DEPLOY_PATH/scripts"
  
  # Копируем скрипты на сервер
  scp -i $SSH_KEY ./scripts/monitoring.sh "$SERVER_HOST:$DEPLOY_PATH/scripts/"
  scp -i $SSH_KEY ./scripts/backup.sh "$SERVER_HOST:$DEPLOY_PATH/scripts/"
  
  # Делаем скрипты исполняемыми
  ssh_command "chmod +x $DEPLOY_PATH/scripts/monitoring.sh"
  ssh_command "chmod +x $DEPLOY_PATH/scripts/backup.sh"
fi

# Проверяем, что скрипты теперь есть на сервере
MONITORING_EXISTS=$(ssh_command "test -f $DEPLOY_PATH/scripts/monitoring.sh && echo 1 || echo 0")
BACKUP_EXISTS=$(ssh_command "test -f $DEPLOY_PATH/scripts/backup.sh && echo 1 || echo 0")

if [[ "$MONITORING_EXISTS" == "1" && "$BACKUP_EXISTS" == "1" ]]; then
  echo_c "✅ Все необходимые скрипты присутствуют на сервере." "$GREEN"
else
  echo_c "❌ Не удалось обеспечить наличие всех скриптов на сервере." "$RED"
  exit 1
fi
echo

# Настройка crontab
echo_c "Настройка crontab для автоматических задач..." "$YELLOW"

# Создаем временный файл crontab
TEMP_CRONTAB=$(mktemp)

# Получаем текущие задания crontab с сервера
ssh_command "crontab -l 2>/dev/null" > $TEMP_CRONTAB

# Добавляем комментарии для ЛИП
echo "# ЛИП - Автоматические задачи" >> $TEMP_CRONTAB

# Добавляем задание для мониторинга (каждый час)
echo "0 * * * * $DEPLOY_PATH/scripts/monitoring.sh > /dev/null 2>&1" >> $TEMP_CRONTAB

# Добавляем задание для резервного копирования (ежедневно в 2:00)
echo "0 2 * * * $DEPLOY_PATH/scripts/backup.sh > /dev/null 2>&1" >> $TEMP_CRONTAB

# Загружаем обновленный crontab на сервер
cat $TEMP_CRONTAB | ssh -i $SSH_KEY $SERVER_HOST "crontab -"

# Удаляем временный файл
rm $TEMP_CRONTAB

# Проверяем, что задания добавлены
CRONTAB_CHECK=$(ssh_command "crontab -l | grep -c 'ЛИП'")
if [[ "$CRONTAB_CHECK" -gt 0 ]]; then
  echo_c "✅ Задания crontab успешно настроены." "$GREEN"
  ssh_command "crontab -l | grep 'ЛИП' -A3"
else
  echo_c "❌ Не удалось настроить задания crontab." "$RED"
  exit 1
fi
echo

echo_c "🎉 Настройка автоматических задач успешно завершена!" "$GREEN"
echo_c "Мониторинг будет выполняться каждый час." "$GREEN"
echo_c "Резервное копирование будет выполняться ежедневно в 2:00." "$GREEN" 