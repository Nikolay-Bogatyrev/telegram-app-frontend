// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Инициализация приложения
tg.ready();
tg.expand();

// Получение данных пользователя
const user = tg.initDataUnsafe?.user;

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
        const isValidTitle = validateRequiredField('meeting-title', 'meeting-title-error');
        const isValidStart = validateRequiredField('meeting-start', 'meeting-start-error');
        const isValidDates = validateDates('meeting-start', 'meeting-end');

        if (!isValidTitle || !isValidStart || !isValidDates) {
            // Haptic feedback для ошибки
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            }
            return;
        }

        // Установка состояния загрузки
        setButtonLoading('meeting-submit', true);
        showLoader();

        try {
            // Формирование данных
            const startDateTime = document.getElementById('meeting-start').value.replace('T', ' ');
            const endDateTime = document.getElementById('meeting-end').value.replace('T', ' ');

            const data = {
                action: 'create_meeting',
                user_id: user?.id,
                type: document.getElementById('meeting-type').value,
                title: document.getElementById('meeting-title').value,
                start: startDateTime,
                end: endDateTime,
                description: document.getElementById('meeting-desc').value || '',
                online: document.getElementById('meeting-online').checked
            };

            // Haptic feedback для успеха
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }

            // Отправка данных в бота
            tg.sendData(JSON.stringify(data));

            // Показ toast уведомления
            showToast('Встреча создана успешно!');
            
            // Очистка формы
            meetingForm.reset();
            document.getElementById('meeting-online').checked = true;
            
            // Закрытие приложения через 1.5 секунды
            setTimeout(() => {
                tg.close();
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            
            // Haptic feedback для ошибки
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('heavy');
            }
            
            tg.showAlert('Ошибка при создании встречи. Попробуйте еще раз.');
        } finally {
            hideLoader();
            setButtonLoading('meeting-submit', false);
        }
    });

    // Валидация дат в реальном времени
    const meetingStart = document.getElementById('meeting-start');
    const meetingEnd = document.getElementById('meeting-end');
    
    if (meetingStart) {
        meetingStart.addEventListener('change', () => {
            validateDates('meeting-start', 'meeting-end');
        });
    }
    
    if (meetingEnd) {
        meetingEnd.addEventListener('change', () => {
            validateDates('meeting-start', 'meeting-end');
        });
    }

    // Валидация обязательных полей в реальном времени
    if (document.getElementById('meeting-title')) {
        document.getElementById('meeting-title').addEventListener('blur', () => {
            validateRequiredField('meeting-title', 'meeting-title-error');
        });
    }

    // Установка минимальной даты на сегодня
    const now = new Date();
    const today = now.toISOString().slice(0, 16);
    if (meetingStart) meetingStart.setAttribute('min', today);
    if (meetingEnd) meetingEnd.setAttribute('min', today);
}

// Обработка формы задачи
const taskForm = document.getElementById('task-form');
if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Очистка предыдущих ошибок
        clearFormErrors('task-form');

        // Валидация обязательных полей
        const isValidTitle = validateRequiredField('task-title', 'task-title-error');

        if (!isValidTitle) {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            }
            return;
        }

        setButtonLoading('task-submit', true);
        showLoader();

        try {
            const data = {
                action: 'create_task',
                user_id: user?.id,
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-desc').value || ''
            };

            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }

            tg.sendData(JSON.stringify(data));
            showToast('Задача добавлена успешно!');
            
            taskForm.reset();
            
            setTimeout(() => {
                tg.close();
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('heavy');
            }
            
            tg.showAlert('Ошибка при добавлении задачи. Попробуйте еще раз.');
        } finally {
            hideLoader();
            setButtonLoading('task-submit', false);
        }
    });

    // Валидация в реальном времени
    if (document.getElementById('task-title')) {
        document.getElementById('task-title').addEventListener('blur', () => {
            validateRequiredField('task-title', 'task-title-error');
        });
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
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            }
            return;
        }

        setButtonLoading('note-submit', true);
        showLoader();

        try {
            const data = {
                action: 'create_note',
                user_id: user?.id,
                title: document.getElementById('note-title').value,
                content: document.getElementById('note-content').value || ''
            };

            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }

            tg.sendData(JSON.stringify(data));
            showToast('Заметка создана успешно!');
            
            noteForm.reset();
            
            setTimeout(() => {
                tg.close();
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('heavy');
            }
            
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
