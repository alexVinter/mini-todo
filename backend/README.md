# Backend для мини-списка дел

Backend сервер на Node.js + Express + PostgreSQL для мини-списка дел.

## Быстрый старт

### 1. Установка PostgreSQL

**Windows:**
- Скачайте установщик с https://www.postgresql.org/download/windows/
- Установите PostgreSQL, запомните пароль для пользователя `postgres`

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install postgresql postgresql-server
```

**Mac:**
```bash
brew install postgresql
```

### 2. Создание базы данных

Откройте терминал и выполните:

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# В консоли PostgreSQL выполните:
CREATE DATABASE todo_db;
CREATE USER todo_user WITH PASSWORD 'ваш_надежный_пароль';
GRANT ALL PRIVILEGES ON DATABASE todo_db TO todo_user;
\q
```

### 3. Создание таблицы

```bash
# Подключитесь к созданной БД
psql -U todo_user -d todo_db

# Выполните SQL из init.sql или вручную:
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\q
```

### 4. Настройка .env файла

```bash
cd backend
cp .env.example .env
```

Откройте `.env` и заполните реальные значения:
- `DB_PASSWORD` - пароль, который вы указали при создании пользователя
- `FRONTEND_URL` - URL вашего frontend (например, `http://localhost:5500`)

### 5. Установка зависимостей

```bash
cd backend
npm install
```

### 6. Запуск сервера

```bash
npm start
```

Сервер будет доступен на `http://localhost:3000`

## API Endpoints

- `GET /todos` - получить все задачи
- `POST /todos` - создать новую задачу (body: `{ "title": "текст задачи" }`)
- `PATCH /todos/:id` - обновить задачу (body: `{ "completed": true }` или `{ "title": "новый текст" }`)
- `DELETE /todos/:id` - удалить задачу
- `GET /health` - проверка работоспособности сервера

## Подключение Frontend

В файле `main.js` измените `API_BASE_URL` на адрес вашего backend:

```javascript
const API_BASE_URL = 'http://localhost:3000'; // для локальной разработки
// или
const API_BASE_URL = 'https://your-domain.com'; // для продакшена
```

## Безопасность

- ✅ Все credentials хранятся в `.env` файле
- ✅ `.env` файл добавлен в `.gitignore` и не коммитится в git
- ✅ `.env` файл не должен быть доступен через веб-сервер
- ⚠️ Для продакшена настройте CORS правильно в `server.js`
- ⚠️ Используйте HTTPS в продакшене
- ⚠️ Рассмотрите добавление аутентификации для защиты API
