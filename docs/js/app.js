// ========================================
// ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP
// ========================================

// Проверка доступности Telegram WebApp API
if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
    console.error('❌ Telegram WebApp API недоступен!');
    console.error('Приложение должно открываться через Telegram бота');
    
    // Показываем предупреждение пользователю
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h2>⚠️ Приложение недоступно</h2>
                    <p>Это приложение работает только внутри Telegram.</p>
                    <p>Откройте бота в Telegram и используйте кнопку "📱 Открыть приложение"</p>
                </div>
            `;
        }
    });
}

// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;

// Функция для безопасного использования HapticFeedback
function triggerHapticFeedback(type = 'light') {
    try {
        // Проверяем наличие HapticFeedback и метода impactOccurred
        if (tg?.HapticFeedback && typeof tg.HapticFeedback.impactOccurred === 'function') {
            tg.HapticFeedback.impactOccurred(type);
        }
    } catch (e) {
        // Игнорируем ошибки, если HapticFeedback не поддерживается
        console.debug('HapticFeedback не поддерживается в этой версии Telegram');
    }
}

if (tg) {
    // Инициализация приложения
    tg.ready();
    tg.expand();
    
    console.log('✅ Telegram WebApp инициализирован');
    console.log('User ID:', tg.initDataUnsafe?.user?.id);
    console.log('API Version:', tg.version || 'N/A');
} else {
    console.error('❌ Не удалось инициализировать Telegram WebApp');
}

// Получение данных пользователя (с несколькими попытками)
// User ID по умолчанию: 422086090
const DEFAULT_USER_ID = 422086090;

function getUserData() {
    if (!tg) {
        // Если Telegram API недоступен, возвращаем данные по умолчанию
        return { id: DEFAULT_USER_ID };
    }
    
    // Способ 1: initDataUnsafe (основной)
    if (tg.initDataUnsafe?.user) {
        return tg.initDataUnsafe.user;
    }
    
    // Способ 2: Попытка получить из initData (если доступен)
    if (tg.initData) {
        try {
            const initDataObj = new URLSearchParams(tg.initData);
            const userStr = initDataObj.get('user');
            if (userStr) {
                const userObj = JSON.parse(decodeURIComponent(userStr));
                return userObj;
            }
        } catch (e) {
            console.warn('Не удалось распарсить initData:', e);
        }
    }
    
    // Способ 3: Попытка получить из startParam
    if (tg.startParam) {
        try {
            const startParam = JSON.parse(decodeURIComponent(tg.startParam));
            if (startParam.user_id) {
                return { id: startParam.user_id };
            }
        } catch (e) {
            // Игнорируем ошибки
        }
    }
    
    // Если ничего не найдено, возвращаем данные по умолчанию
    return { id: DEFAULT_USER_ID };
}

// Получение данных пользователя
const user = getUserData();

// Функция переключения вкладок
function showTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });

    // Показать выбранную вкладку
    const activeTabContent = document.getElementById(`${tabName}-tab`);
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (activeTabContent && activeTab) {
        activeTabContent.classList.add('active');
        activeTabContent.setAttribute('aria-hidden', 'false');
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }
}

// Функция показа/скрытия loader
function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

// Функция показа toast уведомления
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Функции для работы с логом отправки
function showSendLog() {
    const logElement = document.getElementById('send-log');
    if (logElement) {
        logElement.style.display = 'flex';
    }
}

function closeSendLog() {
    const logElement = document.getElementById('send-log');
    if (logElement) {
        logElement.style.display = 'none';
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function addLogEntry(type, label, value) {
    const logContent = document.getElementById('send-log-content');
    if (!logContent) return;

    const timestamp = new Date().toLocaleTimeString('ru-RU');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    let displayValue = value;
    if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
    }
    
    entry.innerHTML = `
        <div>
            <span class="log-label">${label}:</span>
            <span class="log-value">${escapeHtml(String(displayValue))}</span>
        </div>
        <div class="log-timestamp">${timestamp}</div>
    `;
    
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

function clearSendLog() {
    const logContent = document.getElementById('send-log-content');
    if (logContent) {
        logContent.innerHTML = '';
    }
}

// Обновленная функция отправки данных с подробным логированием
function sendDataWithLog(data, actionName) {
    // Показываем область лога
    clearSendLog();
    showSendLog();
    
    // Получаем актуальные данные пользователя перед отправкой
    const currentUser = getUserData();
    const userId = currentUser?.id || user?.id || tg?.initDataUnsafe?.user?.id || DEFAULT_USER_ID;
    
    addLogEntry('info', '🚀 Начало отправки', actionName);
    addLogEntry('info', '⏰ Время', new Date().toLocaleString('ru-RU'));
    addLogEntry('info', '👤 User ID', userId);
    if (currentUser) {
        addLogEntry('info', '👤 Username', currentUser.username ? `@${currentUser.username}` : 'N/A');
        addLogEntry('info', '👤 Full Name', currentUser.first_name || currentUser.last_name 
            ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() 
            : 'N/A');
    }
    addLogEntry('info', '📤 Action', data.action || 'N/A');
    
    // Логируем все данные
    addLogEntry('info', '📋 Полные данные', data);
    
    // Проверка доступности sendData
    if (!tg || typeof tg.sendData !== 'function') {
        addLogEntry('error', '❌ Ошибка', 'Telegram sendData недоступен');
        throw new Error('Telegram sendData недоступен');
    }
    
    const jsonString = JSON.stringify(data);
    addLogEntry('info', '📦 JSON строка', jsonString);
    addLogEntry('info', '📏 Размер данных', `${jsonString.length} байт`);
    
    try {
        tg.sendData(jsonString);
        addLogEntry('success', '✅ sendData вызван', 'Данные отправлены через Telegram API');
        addLogEntry('info', '🎯 Метод отправки', 'tg.sendData() → message.web_app_data');
        addLogEntry('info', '📨 Получатель', 'Telegram Bot (web_app_data handler)');
        
        // Показываем MainButton для подтверждения
        if (tg.MainButton) {
            tg.MainButton.show();
            tg.MainButton.setText('Данные отправлены');
            addLogEntry('info', '🔘 MainButton', 'Показан с текстом "Данные отправлены"');
        }
    } catch (error) {
        addLogEntry('error', '❌ Ошибка sendData', error.message);
        if (error.stack) {
            addLogEntry('error', '📋 Stack trace', error.stack);
        }
        throw error;
    }
}

// Функция валидации обязательных полей
function validateRequiredField(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(errorId);
    
    if (!field || !errorElement) return true;
    
    if (!field.value.trim()) {
        field.classList.add('error');
        errorElement.textContent = 'Поле обязательно для заполнения';
        errorElement.classList.add('show');
        return false;
    } else {
        field.classList.remove('error');
        errorElement.classList.remove('show');
        return true;
    }
}

// Функция валидации дат
function validateDates(startId, endId) {
    const start = document.getElementById(startId);
    const end = document.getElementById(endId);
    const errorElement = document.getElementById('date-error');

    if (!start || !end || !errorElement) return true;

    const startValue = start.value;
    const endValue = end.value;

    if (startValue && endValue) {
        const startDate = new Date(startValue);
        const endDate = new Date(endValue);

        if (endDate <= startDate) {
            errorElement.textContent = 'Дата окончания должна быть позже даты начала';
            errorElement.classList.add('show');
            end.classList.add('error');
            return false;
        } else {
            errorElement.classList.remove('show');
            end.classList.remove('error');
        }
    }

    return true;
}

// Функция очистки ошибок формы
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
}

// Функция установки состояния загрузки кнопки
function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// Обработка формы встречи
const meetingForm = document.getElementById('meeting-form');
if (meetingForm) {
    meetingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Очистка предыдущих ошибок
        clearFormErrors('meeting-form');

        // Валидация обязательных полей
        const meetingsText = document.getElementById('meeting-input').value.trim();
        const isValidMeetings = validateRequiredField('meeting-input', 'meeting-input-error');

        if (!isValidMeetings) {
            triggerHapticFeedback('medium');
            return;
        }

        // Парсинг встреч
        const meetings = parseMeetings(meetingsText);
        
        if (meetings.length === 0) {
            const errorElement = document.getElementById('meeting-input-error');
            errorElement.textContent = 'Не удалось распознать встречи. Формат: "26 января 15.00 Название"';
            errorElement.classList.add('show');
            document.getElementById('meeting-input').classList.add('error');
            triggerHapticFeedback('medium');
            return;
        }

        setButtonLoading('meeting-submit', true);
        showLoader();

        try {
            const currentUser = getUserData();
            const meetingType = document.getElementById('meeting-type').value;
            const isOnline = document.getElementById('meeting-online').checked;

            // Формирование данных для всех встреч
            const data = {
                action: 'create_meetings',
                user_id: currentUser?.id || user?.id || tg?.initDataUnsafe?.user?.id || DEFAULT_USER_ID,
                meetings: meetings.map(meeting => ({
                    type: meetingType,
                    title: meeting.title,
                    start: meeting.start,
                    end: meeting.end,
                    description: '',
                    online: isOnline
                }))
            };

            triggerHapticFeedback('light');

            // Отправка данных в бота с подробным логом
            try {
                sendDataWithLog(data, 'Создание встреч в Google Calendar');
            } catch (error) {
                console.error('❌ Ошибка sendData:', error);
                tg.showAlert('Ошибка отправки данных: ' + error.message);
                throw error;
            }
            
            const meetingCount = meetings.length;
            const message = meetingCount === 1 
                ? 'Встреча создана успешно!' 
                : `Создано встреч: ${meetingCount}`;
            showToast(message);
            
            meetingForm.reset();
            document.getElementById('meeting-online').checked = true;
            
            setTimeout(() => {
                tg.close();
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            triggerHapticFeedback('heavy');
            tg.showAlert('Ошибка при создании встреч. Попробуйте еще раз.');
        } finally {
            hideLoader();
            setButtonLoading('meeting-submit', false);
        }
    });

    // Валидация в реальном времени
    const meetingInput = document.getElementById('meeting-input');
    if (meetingInput) {
        meetingInput.addEventListener('blur', () => {
            const meetingsText = meetingInput.value.trim();
            const errorElement = document.getElementById('meeting-input-error');
            
            if (!meetingsText) {
                validateRequiredField('meeting-input', 'meeting-input-error');
            } else {
                const meetings = parseMeetings(meetingsText);
                if (meetings.length === 0) {
                    if (errorElement) {
                        errorElement.textContent = 'Не удалось распознать встречи. Формат: "26 января 15.00 Название"';
                        errorElement.classList.add('show');
                    }
                    meetingInput.classList.add('error');
                } else {
                    if (errorElement) {
                        errorElement.classList.remove('show');
                    }
                    meetingInput.classList.remove('error');
                }
            }
        });
    }
}

// Словарь месяцев на русском
const MONTHS_RU = {
    'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4,
    'мая': 5, 'июня': 6, 'июля': 7, 'августа': 8,
    'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12,
    'янв': 1, 'фев': 2, 'мар': 3, 'апр': 4,
    'июн': 6, 'июл': 7, 'авг': 8, 'сен': 9,
    'окт': 10, 'ноя': 11, 'дек': 12
};

// Функция форматирования даты для API (YYYY-MM-DD HH:MM)
function formatDateTimeForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Парсинг одной встречи из текста
function parseSingleMeeting(text) {
    if (!text || !text.trim()) return null;
    
    text = text.trim();
    
    // Паттерн 1: "26 января 15.00 Название" или "26 января 15:00 Название" или "26 января в 15:00 Название"
    const pattern1 = /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|янв|фев|мар|апр|июн|июл|авг|сен|окт|ноя|дек)\s+(?:в\s+)?(\d{1,2})[.:](\d{2})\s+(.+)/i;
    
    // Паттерн 2: "26.01 15.00 Название" или "26/01 15:00 Название"
    const pattern2 = /(\d{1,2})[./](\d{1,2})\s+(?:в\s+)?(\d{1,2})[.:](\d{2})\s+(.+)/i;
    
    let match = text.match(pattern1);
    if (match) {
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const hour = parseInt(match[3]);
        const minute = parseInt(match[4]);
        const title = match[5].trim();
        const month = MONTHS_RU[monthName];
        
        if (month) {
            const now = new Date();
            let year = now.getFullYear();
            let eventDate = new Date(year, month - 1, day, hour, minute);
            
            // Если дата уже прошла в этом году, берем следующий год
            if (eventDate < now) {
                eventDate = new Date(year + 1, month - 1, day, hour, minute);
            }
            
            return {
                title: title,
                start: eventDate,
                end: new Date(eventDate.getTime() + 60 * 60 * 1000) // +60 минут
            };
        }
    }
    
    match = text.match(pattern2);
    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const hour = parseInt(match[3]);
        const minute = parseInt(match[4]);
        const title = match[5].trim();
        
        const now = new Date();
        let year = now.getFullYear();
        let eventDate = new Date(year, month - 1, day, hour, minute);
        
        if (eventDate < now) {
            eventDate = new Date(year + 1, month - 1, day, hour, minute);
        }
        
        return {
            title: title,
            start: eventDate,
            end: new Date(eventDate.getTime() + 60 * 60 * 1000)
        };
    }
    
    return null;
}

// Функция парсинга встреч из текста (аналогично parseTasks)
function parseMeetings(meetingsText) {
    const lines = meetingsText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    const meetings = [];
    
    for (const line of lines) {
        const parsed = parseSingleMeeting(line);
        if (parsed) {
            meetings.push({
                title: parsed.title,
                start: formatDateTimeForAPI(parsed.start),
                end: formatDateTimeForAPI(parsed.end)
            });
        }
    }
    
    return meetings;
}

// Функция парсинга задач из текста
function parseTasks(tasksText) {
    const lines = tasksText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    const tasks = [];
    
    for (const line of lines) {
        const parts = line.split('|').map(part => part.trim());
        const title = parts[0];
        const content = parts.length > 1 ? parts.slice(1).join(' | ') : '';
        
        if (title) {
            tasks.push({
                title: title,
                content: content
            });
        }
    }
    
    return tasks;
}

// Обработка формы задачи
const taskForm = document.getElementById('task-form');
if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Очистка предыдущих ошибок
        clearFormErrors('task-form');

        // Валидация обязательных полей
        const tasksText = document.getElementById('task-titles').value.trim();
        const isValidTasks = validateRequiredField('task-titles', 'task-titles-error');

        if (!isValidTasks) {
            triggerHapticFeedback('medium');
            return;
        }

        // Парсинг задач
        const tasks = parseTasks(tasksText);
        
        if (tasks.length === 0) {
            const errorElement = document.getElementById('task-titles-error');
            errorElement.textContent = 'Введите хотя бы одну задачу';
            errorElement.classList.add('show');
            document.getElementById('task-titles').classList.add('error');
            triggerHapticFeedback('medium');
            return;
        }

        setButtonLoading('task-submit', true);
        showLoader();

        try {
            // Получение общих параметров
            const priority = parseInt(document.getElementById('task-priority').value) || 0;
            const dueDateInput = document.getElementById('task-due-date');
            const dueDate = dueDateInput.value ? new Date(dueDateInput.value).toISOString() : '';

            // Формирование данных для всех задач
            const currentUser = getUserData();
            const data = {
                action: 'create_tasks',
                user_id: currentUser?.id || user?.id || tg?.initDataUnsafe?.user?.id || DEFAULT_USER_ID,
                tasks: tasks.map(task => ({
                    title: task.title,
                    content: task.content || '',
                    priority: priority,
                    due_date: dueDate
                }))
            };

            triggerHapticFeedback('light');

            // Логирование для отладки
            console.log('📤 Отправка данных задач:', data);
            console.log('📤 JSON строка:', JSON.stringify(data));

            // Отправка данных в бота с подробным логом
            try {
                sendDataWithLog(data, 'Создание задач в TickTick');
            } catch (error) {
                console.error('❌ Ошибка sendData:', error);
                tg.showAlert('Ошибка отправки данных: ' + error.message);
                throw error;
            }
            
            const taskCount = tasks.length;
            const message = taskCount === 1 
                ? 'Задача добавлена успешно!' 
                : `Добавлено задач: ${taskCount}`;
            showToast(message);
            
            taskForm.reset();
            document.getElementById('task-priority').value = '2';
            
            setTimeout(() => {
                tg.close();
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            
            triggerHapticFeedback('heavy');
            
            tg.showAlert('Ошибка при добавлении задач. Попробуйте еще раз.');
        } finally {
            hideLoader();
            setButtonLoading('task-submit', false);
        }
    });

    // Валидация в реальном времени
    const taskTitlesField = document.getElementById('task-titles');
    if (taskTitlesField) {
        taskTitlesField.addEventListener('blur', () => {
            const tasksText = taskTitlesField.value.trim();
            const errorElement = document.getElementById('task-titles-error');
            
            if (!tasksText) {
                validateRequiredField('task-titles', 'task-titles-error');
            } else {
                const tasks = parseTasks(tasksText);
                if (tasks.length === 0) {
                    if (errorElement) {
                        errorElement.textContent = 'Введите хотя бы одну задачу';
                        errorElement.classList.add('show');
                    }
                    taskTitlesField.classList.add('error');
                } else {
                    if (errorElement) {
                        errorElement.classList.remove('show');
                    }
                    taskTitlesField.classList.remove('error');
                }
            }
        });
    }

    // Установка минимальной даты на сегодня
    const taskDueDate = document.getElementById('task-due-date');
    if (taskDueDate) {
        const now = new Date();
        const today = now.toISOString().slice(0, 16);
        taskDueDate.setAttribute('min', today);
    }
}

// Обработка формы заметки
const noteForm = document.getElementById('note-form');
if (noteForm) {
    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Очистка предыдущих ошибок
        clearFormErrors('note-form');

        // Валидация обязательных полей
        const isValidTitle = validateRequiredField('note-title', 'note-title-error');

        if (!isValidTitle) {
            triggerHapticFeedback('medium');
            return;
        }

        setButtonLoading('note-submit', true);
        showLoader();

        try {
            const currentUser = getUserData();
            const data = {
                action: 'create_note',
                user_id: currentUser?.id || user?.id || tg?.initDataUnsafe?.user?.id || DEFAULT_USER_ID,
                title: document.getElementById('note-title').value,
                content: document.getElementById('note-content').value || ''
            };

            triggerHapticFeedback('light');

            // Логирование для отладки
            console.log('📤 Отправка данных заметки:', data);
            console.log('📤 JSON строка:', JSON.stringify(data));

            // Отправка данных в бота с подробным логом
            try {
                sendDataWithLog(data, 'Создание заметки в базе знаний');
            } catch (error) {
                console.error('❌ Ошибка sendData:', error);
                tg.showAlert('Ошибка отправки данных: ' + error.message);
                throw error;
            }
            
            showToast('Заметка создана успешно!');
            
            noteForm.reset();
            
            setTimeout(() => {
                tg.close();
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            
            triggerHapticFeedback('heavy');
            
            tg.showAlert('Ошибка при создании заметки. Попробуйте еще раз.');
        } finally {
            hideLoader();
            setButtonLoading('note-submit', false);
        }
    });

    // Валидация в реальном времени
    if (document.getElementById('note-title')) {
        document.getElementById('note-title').addEventListener('blur', () => {
            validateRequiredField('note-title', 'note-title-error');
        });
    }
}

// ========================================
// ДИАГНОСТИКА ИНТЕГРАЦИИ
// ========================================

function diagnoseIntegration() {
    console.log('=== 🔍 ДИАГНОСТИКА ИНТЕГРАЦИИ ===');
    
    const checks = {
        'Telegram API loaded': !!window.Telegram?.WebApp,
        'tg initialized': typeof tg !== 'undefined' && tg !== null,
        'User ID present': !!tg?.initDataUnsafe?.user?.id,
        'sendData available': typeof tg?.sendData === 'function',
        'showAlert available': typeof tg?.showAlert === 'function',
        'close available': typeof tg?.close === 'function',
        'API Version': tg?.version || 'N/A',
        'Platform': tg?.platform || 'N/A'
    };
    
    console.table(checks);
    
    const criticalChecks = [
        'Telegram API loaded',
        'tg initialized',
        'sendData available'
    ];
    
    const allPassed = criticalChecks.every(key => {
        const value = checks[key];
        console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
        return value === true;
    });
    
    if (allPassed) {
        console.log('✅ Все критические проверки пройдены!');
        console.log('User:', tg?.initDataUnsafe?.user);
    } else {
        console.error('❌ Обнаружены критические проблемы - см. таблицу выше');
        console.error('Приложение должно открываться через Telegram бота');
    }
    
    return allPassed;
}

// Запуск диагностики при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(diagnoseIntegration, 100);
    });
} else {
    setTimeout(diagnoseIntegration, 100);
}
