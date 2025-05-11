#!/bin/bash

# Скрипт для резервного копирования базы данных ЛИП

# Настройки
SERVER_HOST="username@your-server-ip"
SSH_KEY="~/.ssh/id_rsa"
DEPLOY_PATH="/home/username/lip-workshop"
BACKUP_DIR="$DEPLOY_PATH/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="lip_backup_$DATE"
KEEP_DAYS=30  # Сколько дней хранить резервные копии

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

# Начало резервного копирования
echo_c "💾 Начинаем резервное копирование базы данных ЛИП..." "$YELLOW"
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

# Проверка наличия директории для резервных копий
echo_c "Проверка наличия директории для резервных копий..." "$YELLOW"
ssh_command "mkdir -p $BACKUP_DIR"
echo_c "✅ Директория для резервных копий готова." "$GREEN"
echo

# Проверка работы Docker и контейнера MongoDB
echo_c "Проверка работы контейнера MongoDB..." "$YELLOW"
MONGO_CONTAINER=$(ssh_command "docker ps | grep lip-mongo")
if [[ -z "$MONGO_CONTAINER" ]]; then
  echo_c "❌ Контейнер lip-mongo не найден или не запущен. Проверьте статус приложения." "$RED"
  exit 1
else
  echo_c "✅ Контейнер MongoDB запущен и готов." "$GREEN"
fi
echo

# Создание резервной копии
echo_c "Создание резервной копии базы данных..." "$YELLOW"
ssh_command "docker exec lip-mongo mongodump --out /data/db/$BACKUP_NAME"
echo_c "✅ Резервная копия создана внутри контейнера." "$GREEN"
echo

# Копирование резервной копии из контейнера на сервер
echo_c "Копирование резервной копии из контейнера на сервер..." "$YELLOW"
ssh_command "docker cp lip-mongo:/data/db/$BACKUP_NAME $BACKUP_DIR/"
echo_c "✅ Резервная копия скопирована на сервер." "$GREEN"
echo

# Архивирование резервной копии
echo_c "Архивирование резервной копии..." "$YELLOW"
ssh_command "cd $BACKUP_DIR && tar -czf ${BACKUP_NAME}.tar.gz $BACKUP_NAME && rm -rf $BACKUP_NAME"
echo_c "✅ Резервная копия архивирована." "$GREEN"
echo

# Удаление старых резервных копий
echo_c "Удаление резервных копий старше $KEEP_DAYS дней..." "$YELLOW"
ssh_command "find $BACKUP_DIR -type f -name '*.tar.gz' -mtime +$KEEP_DAYS -delete"
echo_c "✅ Старые резервные копии удалены." "$GREEN"
echo

# Копирование последней резервной копии локально
echo_c "Загружаю последнюю резервную копию на локальный компьютер..." "$YELLOW"
if [[ ! -d "./backups" ]]; then
  mkdir -p "./backups"
fi

LOCAL_BACKUP_PATH="./backups/${BACKUP_NAME}.tar.gz"
scp -i $SSH_KEY "$SERVER_HOST:$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "$LOCAL_BACKUP_PATH"

if [[ -f "$LOCAL_BACKUP_PATH" ]]; then
  echo_c "✅ Резервная копия загружена локально: $LOCAL_BACKUP_PATH" "$GREEN"
else
  echo_c "❌ Не удалось загрузить резервную копию локально." "$RED"
fi
echo

# Список всех резервных копий на сервере
echo_c "Список резервных копий на сервере:" "$YELLOW"
ssh_command "ls -lh $BACKUP_DIR | grep .tar.gz"
echo

echo_c "🎉 Резервное копирование успешно завершено!" "$GREEN"
echo_c "Резервная копия сохранена на сервере: $BACKUP_DIR/${BACKUP_NAME}.tar.gz" "$GREEN"
echo_c "Локальная копия: $LOCAL_BACKUP_PATH" "$GREEN" 