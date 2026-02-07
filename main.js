/**
 * Мини-список дел
 * Данные хранятся в PostgreSQL через Node.js + Express backend.
 * У задачи: id, title, completed, createdAt.
 * 
 * ИНСТРУКЦИЯ ПО ПОДКЛЮЧЕНИЮ К BACKEND:
 * 
 * 1. Убедитесь, что backend сервер запущен (см. backend/server.js)
 * 2. Измените API_BASE_URL ниже на адрес вашего backend сервера:
 *    - Для локальной разработки: 'http://localhost:3000'
 *    - Для продакшена: 'https://your-domain.com'
 * 3. Убедитесь, что CORS настроен правильно в backend/server.js
 * 4. Если frontend и backend на разных доменах/портах, настройте CORS в backend
 */

// Базовый URL для API запросов
// ИЗМЕНИТЕ ЭТОТ АДРЕС на адрес вашего backend сервера!
const API_BASE_URL = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';

// Элементы DOM
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

// Флаг для отслеживания состояния загрузки
let isLoading = false;
let errorMessage = null;

/**
 * Выполняет HTTP запрос к API с обработкой ошибок.
 * @param {string} url - URL для запроса
 * @param {Object} options - опции для fetch (method, body, headers и т.д.)
 * @returns {Promise<Object>} результат запроса
 */
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка API запроса:', error);
    throw error;
  }
}

/**
 * Загружает задачи с сервера.
 * @returns {Promise<Array>} массив задач { id, title, completed, createdAt }
 */
async function loadTasks() {
  try {
    isLoading = true;
    errorMessage = null;
    const tasks = await apiRequest(`${API_BASE_URL}/todos`);
    return tasks;
  } catch (error) {
    errorMessage = `Ошибка загрузки: ${error.message}`;
    console.error('Не удалось загрузить задачи:', error);
    return [];
  } finally {
    isLoading = false;
  }
}

/**
 * Переключает статус выполнения задачи.
 * @param {string|number} id - id задачи
 */
async function toggleCompleted(id) {
  try {
    // Сначала загружаем текущее состояние задачи
    const tasks = await loadTasks();
    const task = tasks.find((t) => t.id == id); // Используем == для сравнения строки и числа
    if (!task) {
      console.error('Задача не найдена');
      return;
    }

    // Отправляем обновление на сервер
    await apiRequest(`${API_BASE_URL}/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !task.completed }),
    });

    // Перерисовываем список
    await renderTasks();
  } catch (error) {
    alert(`Ошибка при обновлении задачи: ${error.message}`);
    console.error('Не удалось обновить задачу:', error);
  }
}

/**
 * Удаляет задачу по id.
 * @param {string|number} id - id задачи
 */
async function deleteTask(id) {
  try {
    await apiRequest(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE',
    });

    // Перерисовываем список
    await renderTasks();
  } catch (error) {
    alert(`Ошибка при удалении задачи: ${error.message}`);
    console.error('Не удалось удалить задачу:', error);
  }
}

/**
 * Добавляет новую задачу. Пустую задачу не добавляет.
 * После добавления возвращает фокус в поле ввода.
 */
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;

  try {
    // Отправляем задачу на сервер
    await apiRequest(`${API_BASE_URL}/todos`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });

    taskInput.value = '';
    taskInput.focus(); // курсор возвращается в поле ввода

    // Перерисовываем список
    await renderTasks();
  } catch (error) {
    alert(`Ошибка при добавлении задачи: ${error.message}`);
    console.error('Не удалось добавить задачу:', error);
  }
}

/**
 * Форматирует дату из ISO-строки в читаемый вид (локаль ru).
 * @param {string} isoString - дата в формате ISO (createdAt)
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Создаёт DOM-элемент для одной задачи и вешает обработчики.
 * @param {Object} task - { id, title, completed, createdAt }
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');

  const titleSpan = document.createElement('span');
  titleSpan.className = 'task-title';
  titleSpan.textContent = task.title;
  titleSpan.addEventListener('click', () => toggleCompleted(task.id));

  const dateSpan = document.createElement('span');
  dateSpan.className = 'task-date';
  dateSpan.textContent = formatDate(task.createdAt);

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = task.completed ? 'Не выполнена' : 'Выполнена';
  toggleBtn.addEventListener('click', () => toggleCompleted(task.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete';
  deleteBtn.textContent = 'Удалить';
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  li.appendChild(titleSpan);
  li.appendChild(dateSpan);
  li.appendChild(toggleBtn);
  li.appendChild(deleteBtn);

  return li;
}

/**
 * Отрисовывает весь список задач (очищает контейнер и заполняет заново).
 */
async function renderTasks() {
  taskList.innerHTML = '';

  if (isLoading) {
    const loading = document.createElement('p');
    loading.className = 'empty';
    loading.textContent = 'Загрузка...';
    taskList.appendChild(loading);
    return;
  }

  if (errorMessage) {
    const error = document.createElement('p');
    error.className = 'empty error';
    error.textContent = errorMessage;
    error.style.color = 'red';
    taskList.appendChild(error);
    return;
  }

  const tasks = await loadTasks();

  if (tasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Нет задач. Добавьте первую.';
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    taskList.appendChild(createTaskElement(task));
  });
}

// Добавление по кнопке
addBtn.addEventListener('click', () => addTask());

// Добавление по Enter в поле ввода
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// Первая отрисовка при загрузке страницы
renderTasks();

// Фокус в поле ввода при загрузке (удобство)
taskInput.focus();
