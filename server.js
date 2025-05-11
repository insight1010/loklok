/**
 * ЛИП API (Локер-Инсайт-Потенциал) - серверная часть
 * Реализация API для интерактивного воркшопа
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bodyParser = require('body-parser');

// Инициализация приложения
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public')); // Папка для статических файлов

// Подключение к БД
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lip-workshop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Модели данных
const UserSchema = new mongoose.Schema({
    id: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String },
    username: { type: String },
    photo_url: { type: String },
    auth_date: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    code: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

const LockerSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    contradiction: { type: String, required: true },
    attempts: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const InsightSchema = new mongoose.Schema({
    lockerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Locker', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const PotentialSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    lockerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Locker', required: true },
    insightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Insight', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goal: { type: String, required: true },
    steps: [{
        description: { type: String, required: true },
        deadline: { type: Date },
        completed: { type: Boolean, default: false }
    }],
    obstacles: { type: String },
    supportNeeded: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Создание моделей
const User = mongoose.model('User', UserSchema);
const Session = mongoose.model('Session', SessionSchema);
const Locker = mongoose.model('Locker', LockerSchema);
const Insight = mongoose.model('Insight', InsightSchema);
const Potential = mongoose.model('Potential', PotentialSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

// Middleware для аутентификации
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Требуется авторизация' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }
        
        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Ошибка аутентификации' });
    }
};

// Роуты для сессий
app.post('/sessions', authMiddleware, async (req, res) => {
    try {
        const { title, description, participantEmails = [] } = req.body;
        
        // Генерация уникального кода для сессии
        const code = uuidv4().substring(0, 6).toUpperCase();
        
        // Находим пользователей по email
        const participants = await User.find({ email: { $in: participantEmails } });
        const participantIds = participants.map(p => p._id);
        
        // Добавляем создателя в список участников
        if (!participantIds.includes(req.userId)) {
            participantIds.push(req.userId);
        }
        
        const session = new Session({
            title,
            description,
            code,
            createdBy: req.userId,
            participants: participantIds
        });
        
        await session.save();
        
        // Создаем уведомления для участников
        const notifications = participantIds
            .filter(id => !id.equals(req.userId))
            .map(userId => new Notification({
                userId,
                title: 'Новая сессия ЛИП',
                message: `Вы были приглашены на сессию "${title}" пользователем ${req.user.name}`,
                type: 'info'
            }));
            
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
        
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании сессии', error: error.message });
    }
});

app.get('/sessions', authMiddleware, async (req, res) => {
    try {
        const sessions = await Session.find({ participants: req.userId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении сессий', error: error.message });
    }
});

app.get('/sessions/:sessionId', authMiddleware, async (req, res) => {
    try {
        const session = await Session.findById(req.params.sessionId)
            .populate('createdBy', 'name email')
            .populate('participants', 'name email');
            
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        // Проверка, что пользователь является участником сессии
        if (!session.participants.some(p => p._id.equals(req.userId))) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении сессии', error: error.message });
    }
});

app.post('/sessions/join', authMiddleware, async (req, res) => {
    try {
        const { sessionCode } = req.body;
        
        const session = await Session.findOne({ code: sessionCode });
        if (!session) {
            return res.status(404).json({ message: 'Сессия с таким кодом не найдена' });
        }
        
        // Проверяем, не является ли пользователь уже участником
        if (session.participants.includes(req.userId)) {
            return res.json(session);
        }
        
        // Добавляем пользователя в сессию
        session.participants.push(req.userId);
        await session.save();
        
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при присоединении к сессии', error: error.message });
    }
});

// Роуты для локеров
app.post('/sessions/:sessionId/lockers', authMiddleware, async (req, res) => {
    try {
        const { title, description, contradiction, attempts } = req.body;
        const sessionId = req.params.sessionId;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const locker = new Locker({
            sessionId,
            userId: req.userId,
            title,
            description,
            contradiction,
            attempts
        });
        
        await locker.save();
        
        res.status(201).json(locker);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании локера', error: error.message });
    }
});

app.get('/sessions/:sessionId/lockers', authMiddleware, async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const lockers = await Locker.find({ sessionId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(lockers);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении локеров', error: error.message });
    }
});

app.get('/sessions/:sessionId/lockers/:lockerId', authMiddleware, async (req, res) => {
    try {
        const { sessionId, lockerId } = req.params;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const locker = await Locker.findOne({ _id: lockerId, sessionId })
            .populate('userId', 'name email');
            
        if (!locker) {
            return res.status(404).json({ message: 'Локер не найден' });
        }
        
        res.json(locker);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении локера', error: error.message });
    }
});

// Роуты для инсайтов
app.post('/sessions/:sessionId/lockers/:lockerId/insights', authMiddleware, async (req, res) => {
    try {
        const { sessionId, lockerId } = req.params;
        const { content } = req.body;
        
        // Проверка, что сессия и локер существуют и пользователь участвует в сессии
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const locker = await Locker.findOne({ _id: lockerId, sessionId });
        if (!locker) {
            return res.status(404).json({ message: 'Локер не найден' });
        }
        
        const insight = new Insight({
            lockerId,
            userId: req.userId,
            content
        });
        
        await insight.save();
        
        // Создаем уведомление для владельца локера, если это не сам пользователь
        if (!locker.userId.equals(req.userId)) {
            const notification = new Notification({
                userId: locker.userId,
                title: 'Новый инсайт',
                message: `Пользователь ${req.user.name} предложил решение для вашей проблемы "${locker.title}"`,
                type: 'info'
            });
            
            await notification.save();
        }
        
        res.status(201).json(insight);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании инсайта', error: error.message });
    }
});

app.get('/sessions/:sessionId/lockers/:lockerId/insights', authMiddleware, async (req, res) => {
    try {
        const { sessionId, lockerId } = req.params;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const insights = await Insight.find({ lockerId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(insights);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении инсайтов', error: error.message });
    }
});

app.post('/sessions/:sessionId/insights/:insightId/like', authMiddleware, async (req, res) => {
    try {
        const { sessionId, insightId } = req.params;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const insight = await Insight.findById(insightId);
        if (!insight) {
            return res.status(404).json({ message: 'Инсайт не найден' });
        }
        
        // Проверяем, не лайкнул ли пользователь уже этот инсайт
        const alreadyLiked = insight.likes.includes(req.userId);
        
        if (alreadyLiked) {
            // Убираем лайк
            insight.likes = insight.likes.filter(id => !id.equals(req.userId));
        } else {
            // Добавляем лайк
            insight.likes.push(req.userId);
            
            // Создаем уведомление для автора инсайта, если это не сам пользователь
            if (!insight.userId.equals(req.userId)) {
                const notification = new Notification({
                    userId: insight.userId,
                    title: 'Новый лайк',
                    message: `Пользователь ${req.user.name} оценил ваш инсайт`,
                    type: 'success'
                });
                
                await notification.save();
            }
        }
        
        await insight.save();
        
        res.json(insight);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обработке лайка', error: error.message });
    }
});

// Роуты для потенциала (планов действий)
app.post('/sessions/:sessionId/potentials', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { lockerId, insightId, goal, steps, obstacles, supportNeeded } = req.body;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const locker = await Locker.findOne({ _id: lockerId, sessionId });
        if (!locker) {
            return res.status(404).json({ message: 'Локер не найден' });
        }
        
        const insight = await Insight.findById(insightId);
        if (!insight) {
            return res.status(404).json({ message: 'Инсайт не найден' });
        }
        
        const potential = new Potential({
            sessionId,
            lockerId,
            insightId,
            userId: req.userId,
            goal,
            steps,
            obstacles,
            supportNeeded
        });
        
        await potential.save();
        
        res.status(201).json(potential);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании плана действий', error: error.message });
    }
});

app.get('/sessions/:sessionId/potentials', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const potentials = await Potential.find({ sessionId, userId: req.userId })
            .populate('lockerId', 'title')
            .populate('insightId', 'content')
            .sort({ createdAt: -1 });
            
        res.json(potentials);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении планов действий', error: error.message });
    }
});

app.put('/sessions/:sessionId/potentials/:potentialId/steps/:stepIndex', authMiddleware, async (req, res) => {
    try {
        const { sessionId, potentialId, stepIndex } = req.params;
        const { completed } = req.body;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const potential = await Potential.findOne({ _id: potentialId, userId: req.userId });
        if (!potential) {
            return res.status(404).json({ message: 'План действий не найден' });
        }
        
        if (!potential.steps[stepIndex]) {
            return res.status(404).json({ message: 'Шаг не найден' });
        }
        
        potential.steps[stepIndex].completed = completed;
        await potential.save();
        
        res.json(potential);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении шага', error: error.message });
    }
});

// Роуты для участников
app.get('/sessions/:sessionId/participants', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Проверка, что сессия существует и пользователь участвует в ней
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        
        if (!session.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этой сессии' });
        }
        
        const participants = await User.find({ _id: { $in: session.participants } })
            .select('name email');
            
        res.json(participants);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении участников', error: error.message });
    }
});

// Роуты для уведомлений
app.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId })
            .sort({ createdAt: -1 });
            
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении уведомлений', error: error.message });
    }
});

app.put('/notifications/:notificationId/read', authMiddleware, async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await Notification.findOne({ _id: notificationId, userId: req.userId });
        if (!notification) {
            return res.status(404).json({ message: 'Уведомление не найдено' });
        }
        
        notification.read = true;
        await notification.save();
        
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении уведомления', error: error.message });
    }
});

// Серверная часть для обработки авторизации через Telegram
const config = {
    // Замените на ваш bot_token, полученный от @BotFather
    botToken: process.env.TELEGRAM_BOT_TOKEN || 'ваш_реальный_токен_бота',
};

// Функция для проверки данных от Telegram
function verifyTelegramData(data) {
    // Создаем строку проверки
    const dataCheckString = Object.keys(data)
        .filter(key => key !== 'hash')
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('\n');
    
    // Создаем секретный ключ
    const secretKey = crypto.createHash('sha256')
        .update(config.botToken)
        .digest();
    
    // Вычисляем хеш
    const hash = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
    
    // Сравниваем хеш
    return hash === data.hash;
}

// Маршрут для авторизации через Telegram
app.post('/api/auth/telegram', (req, res) => {
    try {
        const telegramData = req.body;
        
        // Проверяем данные
        if (!verifyTelegramData(telegramData)) {
            return res.status(401).json({ error: 'Неверные данные авторизации' });
        }
        
        // Проверяем время авторизации (не более 24 часов)
        const authDate = parseInt(telegramData.auth_date);
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime - authDate > 86400) {
            return res.status(401).json({ error: 'Время авторизации истекло' });
        }
        
        // В реальном приложении здесь может быть:
        // 1. Создание/обновление пользователя в БД
        // 2. Генерация JWT токена
        // 3. Другая логика авторизации
        
        // Для демонстрации просто возвращаем данные пользователя с токеном
        const userData = {
            id: telegramData.id,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name || '',
            username: telegramData.username || '',
            photo_url: telegramData.photo_url || '',
            auth_date: telegramData.auth_date,
            token: 'jwt_token_' + crypto.randomBytes(16).toString('hex'),
        };
        
        res.json(userData);
    } catch (error) {
        console.error('Ошибка при авторизации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Эндпоинт для проверки здоровья приложения
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    mongo: 'connected' // Здесь можно добавить реальную проверку подключения к MongoDB
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
}); 