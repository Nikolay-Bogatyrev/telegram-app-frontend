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
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Показать выбранную вкладку
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Функция показа/скрытия loader
function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

// Функция валидации дат
function validateDates(startId, endId) {
    const start = document.getElementById(startId).value;
    const end = document.getElementById(endId).value;
    const errorElement = document.getElementById('date-error');

    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (endDate <= startDate) {
            errorElement.textContent = 'Дата окончания должна быть позже даты начала';
            errorElement.classList.add('show');
            document.getElementById(endId).classList.add('error');
            return false;
        } else {
            errorElement.classList.remove('show');
            document.getElementById(endId).classList.remove('error');
        }
    }

    return true;
}

// Обработка формы встречи
document.getElementById('meeting-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('meeting-submit');

    // Валидация дат
    if (!validateDates('meeting-start', 'meeting-end')) {
        return;
    }

    // Блокировка кнопки
    submitBtn.disabled = true;
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

        // Отправка данных в бота
        tg.sendData(JSON.stringify(data));

        // Показ сообщения об успехе
        tg.showAlert('Встреча создана успешно! ✅');
        
        // Очистка формы
        form.reset();
        document.getElementById('meeting-online').checked = true;
        
        // Закрытие приложения
        setTimeout(() => {
            tg.close();
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        tg.showAlert('Ошибка при создании встречи. Попробуйте еще раз.');
    } finally {
        hideLoader();
        submitBtn.disabled = false;
    }
});

// Обработка формы задачи
document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('task-submit');

    submitBtn.disabled = true;
    showLoader();

    try {
        const data = {
            action: 'create_task',
            user_id: user?.id,
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value || ''
        };

        tg.sendData(JSON.stringify(data));
        tg.showAlert('Задача добавлена успешно! ✅');
        
        form.reset();
        
        setTimeout(() => {
            tg.close();
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        tg.showAlert('Ошибка при добавлении задачи. Попробуйте еще раз.');
    } finally {
        hideLoader();
        submitBtn.disabled = false;
    }
});

// Обработка формы заметки
document.getElementById('note-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('note-submit');

    submitBtn.disabled = true;
    showLoader();

    try {
        const data = {
            action: 'create_note',
            user_id: user?.id,
            title: document.getElementById('note-title').value,
            content: document.getElementById('note-content').value || ''
        };

        tg.sendData(JSON.stringify(data));
        tg.showAlert('Заметка создана успешно! ✅');
        
        form.reset();
        
        setTimeout(() => {
            tg.close();
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        tg.showAlert('Ошибка при создании заметки. Попробуйте еще раз.');
    } finally {
        hideLoader();
        submitBtn.disabled = false;
    }
});

// Валидация дат в реальном времени
document.getElementById('meeting-start').addEventListener('change', () => {
    validateDates('meeting-start', 'meeting-end');
});

document.getElementById('meeting-end').addEventListener('change', () => {
    validateDates('meeting-start', 'meeting-end');
});

// Установка минимальной даты на сегодня
const now = new Date();
const today = now.toISOString().slice(0, 16);
document.getElementById('meeting-start').setAttribute('min', today);
document.getElementById('meeting-end').setAttribute('min', today);
