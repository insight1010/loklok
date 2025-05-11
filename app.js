/**
 * ЛИП Воркшоп (Локер-Инсайт-Потенциал)
 * Основной файл для интеграции интерфейса с API
 */

// Импорт API
import lipApi from './api.js';

// Состояние приложения
const appState = {
    user: null,
    currentSession: null,
    currentLocker: null,
    currentStage: 'locker', // 'locker', 'insight', 'potential'
    timer: {
        minutes: 14,
        seconds: 59,
        intervalId: null
    },
    participants: []
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Проверка наличия токена
    const token = localStorage.getItem('lip_token');
    if (token) {
        try {
            // Загрузка данных пользователя
            await loadUserData();
            
            // Если пользователь авторизован, показываем основной интерфейс
            showMainInterface();
        } catch (error) {
            // Если токен недействителен, показываем форму авторизации
            showAuthForm();
        }
    } else {
        // Если токена нет, показываем форму авторизации
        showAuthForm();
    }

    // Инициализация обработчиков событий
    initEventHandlers();
});

// Загрузка данных пользователя
async function loadUserData() {
    try {
        // Здесь должен быть запрос к API для получения данных пользователя
        // Для примера используем моковые данные
        appState.user = {
            id: '123',
            name: 'Андрей М.',
            email: 'andrey@example.com'
        };

        // Загрузка участников (в реальном приложении это будет из API)
        appState.participants = [
            { id: '123', name: 'Андрей М.', initials: 'АМ' },
            { id: '456', name: 'Елена К.', initials: 'ЕК' },
            { id: '789', name: 'Сергей П.', initials: 'СП' },
            { id: '101', name: 'Ольга В.', initials: 'ОВ' }
        ];
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        throw error;
    }
}

// Показать форму авторизации
function showAuthForm() {
    // Здесь должен быть код для показа формы авторизации
    // Для демо можно использовать модальное окно или другой UI элемент
    console.log('Показ формы авторизации...');
    
    // Создаем модальное окно для авторизации
    const authModal = document.createElement('div');
    authModal.id = 'auth-modal';
    authModal.className = 'modal';
    authModal.style.position = 'fixed';
    authModal.style.top = '0';
    authModal.style.left = '0';
    authModal.style.width = '100%';
    authModal.style.height = '100%';
    authModal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    authModal.style.display = 'flex';
    authModal.style.justifyContent = 'center';
    authModal.style.alignItems = 'center';
    authModal.style.zIndex = '1000';
    
    authModal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 2rem; border-radius: 15px; max-width: 400px; width: 100%;">
            <h2 style="margin-bottom: 1.5rem; color: var(--primary);">Вход в систему ЛИП</h2>
            <div class="form-group">
                <label class="form-label" for="auth-email">Email</label>
                <input type="email" id="auth-email" class="form-input" placeholder="Ваш email">
            </div>
            <div class="form-group">
                <label class="form-label" for="auth-password">Пароль</label>
                <input type="password" id="auth-password" class="form-input" placeholder="Ваш пароль">
            </div>
            <button id="login-btn" class="btn btn-primary btn-full" style="margin-bottom: 1rem;">Войти</button>
            <button id="register-btn" class="btn btn-outline btn-full">Регистрация</button>
        </div>
    `;
    
    document.body.appendChild(authModal);
    
    // Обработчики для кнопок авторизации
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        
        try {
            // В реальном приложении здесь будет вызов API
            // await lipApi.login(email, password);
            
            // Для демо просто имитируем успешную авторизацию
            localStorage.setItem('lip_token', 'demo_token');
            await loadUserData();
            
            // Удаляем модальное окно
            document.getElementById('auth-modal').remove();
            
            // Показываем основной интерфейс
            showMainInterface();
        } catch (error) {
            alert('Ошибка авторизации: ' + error.message);
        }
    });
    
    document.getElementById('register-btn').addEventListener('click', () => {
        // Логика для регистрации (можно переключить на форму регистрации)
        alert('Функция регистрации будет доступна позже');
    });
}

// Показать основной интерфейс
function showMainInterface() {
    console.log('Показ основного интерфейса...');
    
    // Обновляем информацию о пользователе
    updateUserInfo();
    
    // Запускаем таймер
    startTimer();
    
    // Отображаем участников
    renderParticipants();
    
    // Инициализируем этапы
    initStages();
}

// Обновление информации о пользователе
function updateUserInfo() {
    // В реальном приложении здесь будет код для обновления UI с данными пользователя
    console.log('Пользователь:', appState.user);
}

// Запуск таймера
function startTimer() {
    const timerDisplay = document.querySelector('.timer');
    
    // Очищаем существующий интервал, если он есть
    if (appState.timer.intervalId) {
        clearInterval(appState.timer.intervalId);
    }
    
    // Устанавливаем начальные значения
    appState.timer.minutes = 14;
    appState.timer.seconds = 59;
    
    // Обновляем отображение
    timerDisplay.textContent = `${appState.timer.minutes.toString().padStart(2, '0')}:${appState.timer.seconds.toString().padStart(2, '0')}`;
    
    // Запускаем таймер
    appState.timer.intervalId = setInterval(() => {
        appState.timer.seconds--;
        
        if (appState.timer.seconds < 0) {
            appState.timer.seconds = 59;
            appState.timer.minutes--;
        }
        
        if (appState.timer.minutes < 0) {
            clearInterval(appState.timer.intervalId);
            timerDisplay.textContent = "Время!";
        } else {
            timerDisplay.textContent = `${appState.timer.minutes.toString().padStart(2, '0')}:${appState.timer.seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Отображение участников
function renderParticipants() {
    const participantsContainer = document.querySelector('.participants');
    if (!participantsContainer) return;
    
    // Очищаем контейнер
    participantsContainer.innerHTML = '';
    
    // Добавляем участников
    appState.participants.forEach(participant => {
        const participantElement = document.createElement('div');
        participantElement.className = 'participant';
        participantElement.innerHTML = `
            <div class="participant-avatar">${participant.initials}</div>
            <span>${participant.name}</span>
        `;
        
        participantsContainer.appendChild(participantElement);
    });
}

// Инициализация этапов
function initStages() {
    const stageButtons = document.querySelectorAll('.stage-btn');
    stageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const stage = this.dataset.stage;
            changeStage(stage);
        });
    });
    
    // Установка начального этапа
    changeStage(appState.currentStage);
}

// Изменение текущего этапа
function changeStage(stage) {
    // Обновляем состояние
    appState.currentStage = stage;
    
    // Обновляем UI
    const stageButtons = document.querySelectorAll('.stage-btn');
    stageButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.stage === stage);
    });
    
    const stageContents = document.querySelectorAll('.stages-content');
    stageContents.forEach(content => {
        content.classList.toggle('active', content.id === `${stage}-stage`);
    });
    
    // Обновляем прогрессбар
    updateProgressBar(stage);
}

// Обновление прогрессбара
function updateProgressBar(stage) {
    const progressFill = document.querySelector('.progress-fill');
    
    if (stage === 'locker') {
        progressFill.style.width = '33%';
    } else if (stage === 'insight') {
        progressFill.style.width = '66%';
    } else if (stage === 'potential') {
        progressFill.style.width = '100%';
    }
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // Обработчик для формы локера
    const lockerForm = document.getElementById('locker-form');
    if (lockerForm) {
        lockerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const lockerData = {
                title: document.getElementById('locker-title').value,
                description: document.getElementById('locker-description').value,
                contradiction: document.getElementById('locker-contradiction').value,
                attempts: document.getElementById('locker-attempts').value
            };
            
            try {
                // В реальном приложении здесь будет отправка данных через API
                // const locker = await lipApi.createLocker(appState.currentSession.id, lockerData);
                
                // Имитация успешного создания локера
                appState.currentLocker = {
                    id: 'locker_' + Date.now(),
                    ...lockerData
                };
                
                // Обновляем отображение проблемы
                document.getElementById('problem-title-display').textContent = lockerData.title;
                document.getElementById('problem-description-display').textContent = lockerData.description;
                document.getElementById('problem-contradiction-display').textContent = lockerData.contradiction;
                
                // Переходим к следующему этапу
                changeStage('insight');
            } catch (error) {
                alert('Ошибка при сохранении проблемы: ' + error.message);
            }
        });
    }
    
    // Обработчик для формы инсайта
    const insightForm = document.getElementById('insight-form');
    if (insightForm) {
        insightForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const insightContent = document.getElementById('insight-idea').value;
            
            if (insightContent) {
                try {
                    // В реальном приложении здесь будет отправка данных через API
                    // await lipApi.createInsight(appState.currentSession.id, appState.currentLocker.id, insightContent);
                    
                    // Добавляем карточку с инсайтом в UI
                    const insightCards = document.querySelector('.insight-cards');
                    
                    const newCard = document.createElement('div');
                    newCard.className = 'insight-card animate-in';
                    newCard.innerHTML = `
                        <p>${insightContent}</p>
                        <div class="insight-author">
                            <div class="participant-avatar">${appState.user ? appState.user.name.split(' ').map(n => n[0]).join('') : 'АМ'}</div>
                            <span>${appState.user ? appState.user.name : 'Андрей М.'}</span>
                        </div>
                    `;
                    
                    insightCards.appendChild(newCard);
                    document.getElementById('insight-idea').value = '';
                } catch (error) {
                    alert('Ошибка при сохранении инсайта: ' + error.message);
                }
            }
        });
    }
    
    // Обработчик для формы выбора инсайта
    const myInsightsForm = document.getElementById('my-insights-form');
    if (myInsightsForm) {
        myInsightsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const bestInsight = document.getElementById('best-insight').value;
            const insightAction = document.getElementById('insight-action').value;
            
            if (bestInsight) {
                try {
                    // Копируем выбранный инсайт в следующий этап
                    document.getElementById('potential-insight').value = bestInsight;
                    
                    // Переходим к следующему этапу
                    changeStage('potential');
                } catch (error) {
                    alert('Ошибка при сохранении выбранного инсайта: ' + error.message);
                }
            } else {
                alert('Пожалуйста, выберите инсайт');
            }
        });
    }
    
    // Обработчик для формы потенциала
    const potentialForm = document.getElementById('potential-form');
    if (potentialForm) {
        potentialForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const potentialData = {
                insight: document.getElementById('potential-insight').value,
                goal: document.getElementById('potential-goal').value,
                steps: Array.from(document.querySelectorAll('#potential-form input[placeholder^="Шаг"]')).map((input, index) => {
                    const dateInput = document.querySelectorAll('#potential-form input[type="date"]')[index];
                    return {
                        description: input.value,
                        deadline: dateInput.value,
                        completed: false
                    };
                }),
                obstacles: document.getElementById('potential-obstacles').value,
                supportNeeded: document.getElementById('potential-help').value
            };
            
            try {
                // В реальном приложении здесь будет отправка данных через API
                // await lipApi.createPotential(appState.currentSession.id, appState.currentLocker.id, selectedInsightId, potentialData);
                
                // Имитация успешного завершения
                alert('Воркшоп завершен! Ваш план действий сохранен.');
                
            } catch (error) {
                alert('Ошибка при сохранении плана действий: ' + error.message);
            }
        });
    }
}

// Экспортируем основные функции для доступа из HTML
window.lipApp = {
    changeStage,
    startTimer,
    logout: async () => {
        await lipApi.logout();
        location.reload();
    }
}; 