const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_banned BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS surveys (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        emoji VARCHAR(10),
        category VARCHAR(100),
        estimated_time VARCHAR(50),
        respondents INT DEFAULT 0,
        is_published BOOLEAN DEFAULT true,
        owner_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(50) PRIMARY KEY,
        survey_id VARCHAR(50) REFERENCES surveys(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        required BOOLEAN DEFAULT true,
        position INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS question_options (
        id VARCHAR(50) PRIMARY KEY,
        question_id VARCHAR(50) REFERENCES questions(id) ON DELETE CASCADE,
        label VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        survey_id VARCHAR(50) REFERENCES surveys(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        submitted_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS response_answers (
        id SERIAL PRIMARY KEY,
        response_id INT REFERENCES responses(id) ON DELETE CASCADE,
        question_id VARCHAR(50) REFERENCES questions(id) ON DELETE CASCADE,
        answer_value TEXT
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        username VARCHAR(50),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(30),
        entity_id VARCHAR(100),
        entity_name VARCHAR(255),
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Миграция: добавить колонку avatar если ещё нет
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(100) DEFAULT NULL;
    `);

    const bcrypt = require("bcryptjs");
    const adminExists = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')",
        ["admin", hash]
      );
      console.log("👑 Әдепкі админ → логин: admin | кілтсөз: admin123");
    }

    console.log("✅ Дерекқор кестелері дайын");
  } catch (err) {
    console.error("❌ Дерекқор қатесі:", err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };
