const { pool } = require("../db");

const XP_THRESHOLDS = [0, 100, 250, 500, 1000];

const getLevel = (xp) => {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

const awardXP = async (userId, amount) => {
  if (!userId || amount <= 0) return null;

  const before = await pool.query("SELECT xp, level FROM users WHERE id = $1", [userId]);
  if (before.rows.length === 0) return null;

  const oldLevel = before.rows[0].level;

  const result = await pool.query(
    "UPDATE users SET xp = xp + $1 WHERE id = $2 RETURNING xp",
    [amount, userId]
  );
  const newXp = result.rows[0].xp;
  const newLevel = getLevel(newXp);

  if (newLevel !== oldLevel) {
    await pool.query("UPDATE users SET level = $1 WHERE id = $2", [newLevel, userId]);
  }

  return { xp: newXp, level: newLevel, levelUp: newLevel > oldLevel };
};

const updateStreak = async (userId) => {
  if (!userId) return 0;

  const today = new Date().toISOString().split("T")[0];
  const row = await pool.query(
    "SELECT last_activity_date, streak_count FROM users WHERE id = $1",
    [userId]
  );
  if (row.rows.length === 0) return 0;

  const { last_activity_date, streak_count } = row.rows[0];
  const lastDate = last_activity_date
    ? new Date(last_activity_date).toISOString().split("T")[0]
    : null;

  if (lastDate === today) {
    return streak_count;
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const newStreak = lastDate === yesterday ? streak_count + 1 : 1;

  await pool.query(
    "UPDATE users SET last_activity_date = $1, streak_count = $2 WHERE id = $3",
    [today, newStreak, userId]
  );

  if (newStreak === 3) {
    await checkAndAwardAchievement(userId, "streak_3");
  }
  if (newStreak === 7) {
    await checkAndAwardAchievement(userId, "streak_7");
  }

  return newStreak;
};

const checkAndAwardAchievement = async (userId, achievementId) => {
  if (!userId) return null;

  const existing = await pool.query(
    "SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2",
    [userId, achievementId]
  );
  if (existing.rows.length > 0) return null;

  const ach = await pool.query("SELECT * FROM achievements WHERE id = $1", [achievementId]);
  if (ach.rows.length === 0) return null;

  await pool.query(
    "INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)",
    [userId, achievementId]
  );

  if (ach.rows[0].xp_reward > 0) {
    await awardXP(userId, ach.rows[0].xp_reward);
  }

  return ach.rows[0];
};

const createNotification = async (userId, type, message, entityId = null) => {
  if (!userId) return;
  await pool.query(
    "INSERT INTO notifications (user_id, type, message, entity_id) VALUES ($1, $2, $3, $4)",
    [userId, type, message, entityId]
  );
};

module.exports = { awardXP, updateStreak, checkAndAwardAchievement, createNotification, getLevel };
