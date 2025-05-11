/**
 * ЛИП API (Локер-Инсайт-Потенциал) - клиентская часть
 * Предоставляет функции для взаимодействия с бэкендом
 */

class LIPApi {
    constructor(baseUrl = 'https://api.lip-workshop.ru') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('lip_token');
    }

    /**
     * Вспомогательный метод для отправки запросов
     */
    async _fetch(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Произошла ошибка при выполнении запроса');
        }

        return response.json();
    }

    /**
     * === Управление сессиями ===
     */
    
    async createSession(title, description, participantEmails = []) {
        return await this._fetch('/sessions', 'POST', {
            title,
            description,
            participantEmails
        });
    }

    async getSessions() {
        return await this._fetch('/sessions');
    }

    async getSessionById(sessionId) {
        return await this._fetch(`/sessions/${sessionId}`);
    }

    async joinSession(sessionCode) {
        return await this._fetch(`/sessions/join`, 'POST', { sessionCode });
    }

    /**
     * === Локеры ===
     */
    
    async createLocker(sessionId, data) {
        return await this._fetch(`/sessions/${sessionId}/lockers`, 'POST', {
            title: data.title,
            description: data.description,
            contradiction: data.contradiction,
            attempts: data.attempts
        });
    }

    async getLockers(sessionId) {
        return await this._fetch(`/sessions/${sessionId}/lockers`);
    }

    async getLockerById(sessionId, lockerId) {
        return await this._fetch(`/sessions/${sessionId}/lockers/${lockerId}`);
    }

    /**
     * === Инсайты ===
     */
    
    async createInsight(sessionId, lockerId, content) {
        return await this._fetch(`/sessions/${sessionId}/lockers/${lockerId}/insights`, 'POST', {
            content
        });
    }

    async getInsights(sessionId, lockerId) {
        return await this._fetch(`/sessions/${sessionId}/lockers/${lockerId}/insights`);
    }

    async likeInsight(sessionId, insightId) {
        return await this._fetch(`/sessions/${sessionId}/insights/${insightId}/like`, 'POST');
    }

    /**
     * === Потенциал (планы действий) ===
     */
    
    async createPotential(sessionId, lockerId, insightId, data) {
        return await this._fetch(`/sessions/${sessionId}/potentials`, 'POST', {
            lockerId,
            insightId,
            goal: data.goal,
            steps: data.steps,
            obstacles: data.obstacles,
            supportNeeded: data.supportNeeded
        });
    }

    async getPotentials(sessionId) {
        return await this._fetch(`/sessions/${sessionId}/potentials`);
    }

    async updatePotentialProgress(sessionId, potentialId, stepId, completed) {
        return await this._fetch(`/sessions/${sessionId}/potentials/${potentialId}/steps/${stepId}`, 'PUT', {
            completed
        });
    }

    /**
     * === Участники ===
     */
    
    async getParticipants(sessionId) {
        return await this._fetch(`/sessions/${sessionId}/participants`);
    }

    /**
     * === Уведомления ===
     */
    
    async getNotifications() {
        return await this._fetch('/notifications');
    }

    async markNotificationAsRead(notificationId) {
        return await this._fetch(`/notifications/${notificationId}/read`, 'PUT');
    }
}

// Экспортируем экземпляр API для использования в приложении
const lipApi = new LIPApi();
export default lipApi; 