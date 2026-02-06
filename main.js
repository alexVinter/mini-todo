/**
 * Мини-список дел
 * Данные хранятся в localStorage. У задачи: title, completed, createdAt.
 */

// Ключ для localStorage
const STORAGE_KEY = 'mini-todo-tasks';

// Элементы DOM
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

/**
 * Загружает задачи из localStorage.
 * @returns {Array} массив задач { id, title, completed, createdAt }
 */
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Сохраняет задачи в localStorage.
 * @param {Array} tasks - массив задач
 */
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Генерирует уникальный id для задачи (по времени + случайное число).
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Переключает статус выполнения задачи.
 * @param {string} id - id задачи
 */
function toggleCompleted(id) {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks(tasks);
    renderTasks();
  }
}

/**
 * Удаляет задачу по id.
 * @param {string} id - id задачи
 */
function deleteTask(id) {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}

/**
 * Добавляет новую задачу. Пустую задачу не добавляет.
 * После добавления возвращает фокус в поле ввода.
 */
function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;

  const tasks = loadTasks();
  const newTask = {
    id: generateId(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  saveTasks(tasks);

  taskInput.value = '';
  taskInput.focus(); // курсор возвращается в поле ввода

  renderTasks();
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
function renderTasks() {
  const tasks = loadTasks();
  taskList.innerHTML = '';

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
addBtn.addEventListener('click', addTask);

// Добавление по Enter в поле ввода
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// Первая отрисовка при загрузке страницы
renderTasks();

// Фокус в поле ввода при загрузке (удобство)
taskInput.focus();
