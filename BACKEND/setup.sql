-- Бұл файлды PostgreSQL-де бір рет іске қосыңыз
-- psql -U postgres -f setup.sql

-- Дерекқор жасау
CREATE DATABASE saulnama_db;

-- Дерекқорға қосылу
\c saulnama_db;

-- Сауалнамалар кестесі
CREATE TABLE IF NOT EXISTS surveys (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  emoji VARCHAR(10),
  category VARCHAR(100),
  estimated_time VARCHAR(50),
  respondents INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Сұрақтар кестесі
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(50) PRIMARY KEY,
  survey_id VARCHAR(50) REFERENCES surveys(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  required BOOLEAN DEFAULT true,
  position INT DEFAULT 0
);

-- Сұрақ нұсқалары кестесі
CREATE TABLE IF NOT EXISTS question_options (
  id VARCHAR(50) PRIMARY KEY,
  question_id VARCHAR(50) REFERENCES questions(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL
);

-- Жауаптар кестесі
CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  survey_id VARCHAR(50) REFERENCES surveys(id) ON DELETE CASCADE,
  session_id VARCHAR(100),
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Жауап мәндері кестесі
CREATE TABLE IF NOT EXISTS response_answers (
  id SERIAL PRIMARY KEY,
  response_id INT REFERENCES responses(id) ON DELETE CASCADE,
  question_id VARCHAR(50) REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT
);

SELECT 'Дерекқор сәтті дайындалды ✅' AS message;
