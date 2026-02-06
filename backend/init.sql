-- SQL скрипт для создания таблицы todos
-- Выполните этот скрипт в вашей PostgreSQL базе данных

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индекса для быстрого поиска по id (уже есть через PRIMARY KEY)
-- Создание индекса для сортировки по дате создания
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);
