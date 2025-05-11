/**
 * ЛИП Воркшоп (Локер-Инсайт-Потенциал)
 * Основной файл для интеграции интерфейса с API
 */

// Импорт API
import lipApi from './api.js';

// Модуль для работы с приложением ЛИП
const lipApp = {
    // Конфигурация
    config: {
        // Замените на ваш bot_token, полученный от @BotFather
        botToken: 'YOUR_BOT_TOKEN',
        // Замените на ваш API URL
        apiUrl: 'https://your-backend-api.com',
    },

    // Текущий пользователь
    currentUser: null,

    // Инициализация приложения
    async init() {
        console.log('Инициализация приложения ЛИП');
        
        // Проверяем, есть ли сохраненный пользователь
        const savedUser = localStorage.getItem('lip_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateUserInterface();
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
                localStorage.removeItem('lip_user');
            }
        } else {
            // Если пользователь не авторизован, показываем модальное окно авторизации
            this.showLoginModal();
        }

        // Инициализируем обработчики Telegram Login Widget
        this.initTelegramLoginWidget();
    },

    // Инициализация Telegram Login Widget
    initTelegramLoginWidget() {
        // Добавляем обработчик сообщений от Telegram Login Widget
        window.onTelegramAuth = (user) => {
            this.handleTelegramLogin(user);
        };
    },

    // Обработка данных авторизации от Telegram
    async handleTelegramLogin(telegramUser) {
        try {
            console.log('Получены данные от Telegram:', telegramUser);
            
            // Проверка данных от Telegram (хеш и т.д.)
            if (!this.verifyTelegramData(telegramUser)) {
                throw new Error('Ошибка проверки данных Telegram');
            }

            // Отправляем данные на сервер для авторизации
            // В реальном приложении здесь будет запрос к API
            // const response = await fetch(`${this.config.apiUrl}/auth/telegram`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(telegramUser),
            // });
            
            // if (!response.ok) {
            //     throw new Error('Ошибка авторизации на сервере');
            // }
            
            // const userData = await response.json();
            
            // Для демонстрации используем данные напрямую от Telegram
            const userData = {
                id: telegramUser.id,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name || '',
                username: telegramUser.username || '',
                photo_url: telegramUser.photo_url || '',
                auth_date: telegramUser.auth_date,
                token: 'demo_token_' + Math.random().toString(36).substring(2),
            };
            
            // Сохраняем пользователя
            this.currentUser = userData;
            localStorage.setItem('lip_user', JSON.stringify(userData));
            
            // Обновляем интерфейс
            this.updateUserInterface();
            
            // Закрываем модальное окно авторизации
            this.hideLoginModal();
            
            console.log('Пользователь успешно авторизован:', userData);
        } catch (error) {
            console.error('Ошибка при авторизации через Telegram:', error);
            alert('Ошибка при авторизации: ' + error.message);
        }
    },

    // Проверка данных от Telegram
    verifyTelegramData(telegramUser) {
        // В реальном приложении здесь должна быть проверка хеша
        // https://core.telegram.org/widgets/login#checking-authorization
        
        // Для демонстрации всегда возвращаем true
        return true;
    },

    // Показать модальное окно авторизации
    showLoginModal() {
        // Создаем модальное окно, если его еще нет
        if (!document.getElementById('login-modal')) {
            const modalHtml = `
                <div id="login-modal" class="modal">
                    <div class="modal-content" style="max-width: 400px; text-align: center;">
                        <h2 style="margin-bottom: 1.5rem; color: var(--primary);">Вход в ЛИП</h2>
                        <p style="margin-bottom: 2rem;">Для начала работы, пожалуйста, авторизуйтесь через Telegram:</p>
                        <div id="telegram-login-container" style="display: flex; justify-content: center; margin-bottom: 1rem;">
                            <!-- Здесь будет размещен Telegram Login Widget -->
                            <script async src="https://telegram.org/js/telegram-widget.js?22" 
                                data-telegram-login="YOUR_BOT_NAME" 
                                data-size="large" 
                                data-radius="10" 
                                data-onauth="onTelegramAuth(user)" 
                                data-request-access="write">
                            </script>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        // Показываем модальное окно
        document.getElementById('login-modal').classList.remove('hidden');
    },

    // Скрыть модальное окно авторизации
    hideLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('hidden');
        }
    },

    // Обновление пользовательского интерфейса
    updateUserInterface() {
        if (!this.currentUser) return;
        
        // Обновляем имя пользователя
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.first_name;
        }
        
        // Обновляем аватар пользователя
        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) {
            if (this.currentUser.photo_url) {
                // Если есть фото, заменяем содержимое на изображение
                userAvatarElement.innerHTML = '';
                userAvatarElement.style.backgroundImage = `url(${this.currentUser.photo_url})`;
                userAvatarElement.style.backgroundSize = 'cover';
                userAvatarElement.style.backgroundPosition = 'center';
            } else {
                // Если нет фото, используем первую букву имени
                const initial = this.currentUser.first_name.charAt(0).toUpperCase();
                userAvatarElement.textContent = initial;
                userAvatarElement.style.backgroundImage = '';
            }
        }
    },

    // Выход из аккаунта
    async logout() {
        // Удаляем данные пользователя
        this.currentUser = null;
        localStorage.removeItem('lip_user');
        
        // Обновляем интерфейс
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = 'Гость';
        }
        
        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) {
            userAvatarElement.textContent = 'Г';
            userAvatarElement.style.backgroundImage = '';
        }
        
        // Показываем окно авторизации
        this.showLoginModal();
        
        console.log('Пользователь вышел из системы');
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    lipApp.init();
});

// Экспортируем модуль для использования в других скриптах
window.lipApp = lipApp; 