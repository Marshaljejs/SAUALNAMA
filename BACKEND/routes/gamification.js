const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

router.get("/achievements", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM achievements ORDER BY xp_reward ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.get("/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;

    const userResult = await pool.query(
      "SELECT id, username, xp, level, streak_count, last_activity_date, avatar FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Пайдаланушы табылмады" });
    }

    const badgesResult = await pool.query(
      `SELECT ua.earned_at, a.*
       FROM user_achievements ua
       JOIN achievements a ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...userResult.rows[0],
        achievements: badgesResult.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.get("/comments/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;
    const result = await pool.query(
      `SELECT sc.*, u.avatar
       FROM survey_comments sc
       LEFT JOIN users u ON u.id = sc.user_id
       WHERE sc.survey_id = $1
       ORDER BY sc.created_at DESC
       LIMIT 50`,
      [surveyId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.post("/comments/:surveyId", requireAuth, async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Пікір мәтіні міндетті" });
    }
    if (content.trim().length > 500) {
      return res.status(400).json({ success: false, message: "Пікір 500 таңбадан аспауы керек" });
    }

    const survey = await pool.query("SELECT id FROM surveys WHERE id = $1", [surveyId]);
    if (survey.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Сауалнама табылмады" });
    }

    const result = await pool.query(
      `INSERT INTO survey_comments (survey_id, user_id, username, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [surveyId, req.user.id, req.user.username, content.trim()]
    );

    const userRow = await pool.query("SELECT avatar FROM users WHERE id = $1", [req.user.id]);
    const comment = { ...result.rows[0], avatar: userRow.rows[0]?.avatar || null };

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.delete("/comments/item/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await pool.query("SELECT * FROM survey_comments WHERE id = $1", [id]);
    if (comment.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Пікір табылмады" });
    }
    const isOwner = comment.rows[0].user_id === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Рұқсат жоқ" });
    }
    await pool.query("DELETE FROM survey_comments WHERE id = $1", [id]);
    res.json({ success: true, message: "Пікір жойылды" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    const unreadCount = result.rows.filter((n) => !n.is_read).length;
    res.json({ success: true, data: result.rows, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.put("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1",
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

module.exports = router;
