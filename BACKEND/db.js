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

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(100) DEFAULT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0;
    `);

    await pool.query(`
      ALTER TABLE surveys ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
      ALTER TABLE surveys ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT NULL;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id VARCHAR(50) PRIMARY KEY,
        name_kz VARCHAR(100) NOT NULL,
        name_ru VARCHAR(100) NOT NULL,
        name_en VARCHAR(100) NOT NULL,
        description_kz TEXT,
        description_ru TEXT,
        description_en TEXT,
        icon VARCHAR(50) DEFAULT 'fa-solid fa-medal',
        xp_reward INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR(50) REFERENCES achievements(id),
        earned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, achievement_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS survey_comments (
        id SERIAL PRIMARY KEY,
        survey_id VARCHAR(50) REFERENCES surveys(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        username VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        entity_id VARCHAR(100),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      INSERT INTO achievements (id, name_kz, name_ru, name_en, description_kz, description_ru, description_en, icon, xp_reward)
      VALUES
        ('first_survey',   'Алғашқы сауалнама',   'Первый опрос',        'First Survey',       'Алғашқы сауалнаманы жасады',        'Создал первый опрос',            'Created the first survey',      'fa-solid fa-flag',              50),
        ('first_response', 'Алғашқы жауап',       'Первый ответ',        'First Response',     'Алғашқы сауалнамаға жауап берді',   'Ответил на первый опрос',        'Responded to the first survey', 'fa-solid fa-check-circle',      20),
        ('ten_responses',  '10 жауап',             '10 ответов',          '10 Responses',       '10 сауалнамаға жауап берді',        'Ответил на 10 опросов',          'Responded to 10 surveys',       'fa-solid fa-star',             100),
        ('five_surveys',   '5 сауалнама',          '5 опросов',           '5 Surveys',          '5 сауалнама жасады',                'Создал 5 опросов',               'Created 5 surveys',             'fa-solid fa-trophy',           200),
        ('streak_3',       '3 күн серия',          '3 дня подряд',        '3-Day Streak',       '3 күн қатарынан белсенді болды',    '3 дня подряд был активен',       'Active 3 days in a row',        'fa-solid fa-fire',              30),
        ('streak_7',       '7 күн серия',          '7 дней подряд',       '7-Day Streak',       '7 күн қатарынан белсенді болды',    '7 дней подряд был активен',      'Active 7 days in a row',        'fa-solid fa-fire-flame-curved', 75)
      ON CONFLICT (id) DO NOTHING;
    `);

    const bcrypt = require("bcryptjs");
    const adminExists = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')",
        ["admin", hash]
      );
      console.log("Admin created: admin / admin123");
    }

    console.log("Database tables ready");
  } catch (err) {
    console.error("Database error:", err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };
