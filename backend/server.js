/**
 * Backend сервер для мини-списка дел
 * Node.js + Express + PostgreSQL
 * 
 * ПОШАГОВАЯ ИНСТРУКЦИЯ ПО ЗАПУСКУ:
 * 
 * 1. Установите PostgreSQL на ваш сервер
 *    - Windows: скачайте с https://www.postgresql.org/download/windows/
 *    - Linux: sudo apt-get install postgresql (Ubuntu/Debian) или sudo yum install postgresql (CentOS/RHEL)
 *    - Mac: brew install postgresql
 * 
 * 2. Создайте базу данных и пользователя:
 *    - Запустите psql: psql -U postgres
 *    - Создайте БД: CREATE DATABASE todo_db;
 *    - Создайте пользователя: CREATE USER todo_user WITH PASSWORD 'ваш_пароль';
 *    - Дайте права: GRANT ALL PRIVILEGES ON DATABASE todo_db TO todo_user;
 *    - Выйдите: \q
 * 
 * 3. Создайте таблицу:
 *    - Подключитесь к БД: psql -U todo_user -d todo_db
 *    - Выполните SQL из файла backend/init.sql или выполните команду:
 *      CREATE TABLE todos (
 *        id SERIAL PRIMARY KEY,
 *        title VARCHAR(500) NOT NULL,
 *        completed BOOLEAN DEFAULT FALSE,
 *        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *      );
 * 
 * 4. Настройте .env файл:
 *    - Скопируйте .env.example в .env
 *    - Заполните реальные значения для вашей БД
 * 
 * 5. Установите зависимости:
 *    - cd backend
 *    - npm install
 * 
 * 6. Запустите сервер:
 *    - npm start (или node server.js)
 *    - Сервер будет доступен на http://localhost:3000
 * 
 * 7. Настройте CORS (если frontend на другом домене/порту):
 *    - Измените origin в CORS настройках ниже
 *    - Или используйте '*' для разработки (не рекомендуется для продакшена)
 * 
 * 8. Подключение frontend к backend:
 *    - В main.js измените API_BASE_URL на адрес вашего сервера
 *    - Например: const API_BASE_URL = 'http://localhost:3000';
 *    - Для продакшена: const API_BASE_URL = 'https://your-domain.com';
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500', // Измените на URL вашего frontend
  credentials: true
}));
app.use(express.json());

// Подключение к PostgreSQL
// Все credentials берутся из .env файла, который НЕ должен быть доступен через веб-сервер
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Проверка подключения к БД при запуске
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    console.log('Проверьте настройки в .env файле');
  } else {
    console.log('✅ Подключение к PostgreSQL успешно');
  }
});

/**
 * GET /todos
 * Получить все задачи
 */
app.get('/todos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, completed, created_at as "createdAt" FROM todos ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении задач' });
  }
});

/**
 * POST /todos
 * Создать новую задачу
 * Body: { title: string }
 */
app.post('/todos', async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Поле title обязательно и не должно быть пустым' });
    }

    const result = await pool.query(
      'INSERT INTO todos (title, completed) VALUES ($1, $2) RETURNING id, title, completed, created_at as "createdAt"',
      [title.trim(), false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании задачи' });
  }
});

/**
 * PATCH /todos/:id
 * Обновить задачу (изменить title или completed)
 * Body: { title?: string, completed?: boolean }
 */
app.patch('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    // Проверяем, что задача существует
    const checkResult = await pool.query('SELECT id FROM todos WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Формируем запрос динамически в зависимости от переданных полей
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Поле title не должно быть пустым' });
      }
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Поле completed должно быть boolean' });
      }
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Необходимо передать хотя бы одно поле для обновления' });
    }

    values.push(id);
    const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, title, completed, created_at as "createdAt"`;
    
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении задачи:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении задачи' });
  }
});

/**
 * DELETE /todos/:id
 * Удалить задачу
 */
app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    
    res.json({ message: 'Задача удалена', id: result.rows[0].id });
  } catch (error) {
    console.error('Ошибка при удалении задачи:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении задачи' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Сервер работает' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📝 API доступно по адресу http://localhost:${PORT}/todos`);
});
