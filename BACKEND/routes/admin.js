const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { log } = require("../middleware/logger");

router.use(requireAuth, requireAdmin);

// ── GET /api/admin/stats ──
router.get("/stats", async (req, res) => {
  try {
    const [users, surveys, responses] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN role='admin' THEN 1 END) as admins FROM users"),
      pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN is_published THEN 1 END) as published FROM surveys"),
      pool.query("SELECT COUNT(*) as total FROM responses"),
    ]);
    res.json({
      success: true,
      data: {
        users: { total: parseInt(users.rows[0].total), admins: parseInt(users.rows[0].admins), regular: parseInt(users.rows[0].total) - parseInt(users.rows[0].admins) },
        surveys: { total: parseInt(surveys.rows[0].total), published: parseInt(surveys.rows[0].published) },
        responses: { total: parseInt(responses.rows[0].total) },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── GET /api/admin/users ──
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.role, u.created_at, u.is_banned,
        COUNT(s.id) as survey_count
      FROM users u LEFT JOIN surveys s ON s.owner_id = u.id
      GROUP BY u.id ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── PUT /api/admin/users/:id/role ── Рөл өзгерту
router.put("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ success: false, message: "Рөл: user немесе admin болуы керек" });
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ success: false, message: "Өз рөліңізді өзгерте алмайсыз" });

    const target = await pool.query("SELECT username, role FROM users WHERE id = $1", [id]);
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);

    await log({ user: req.user, action: "admin_change_role", entityType: "user", entityId: id, entityName: target.rows[0]?.username, details: { oldRole: target.rows[0]?.role, newRole: role }, req });

    res.json({ success: true, message: "Рөл сәтті өзгертілді" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── PUT /api/admin/users/:id/ban ── Бан / бан алу
router.put("/users/:id/ban", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_banned } = req.body;
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ success: false, message: "Өзіңізді бана алмайсыз" });

    const target = await pool.query("SELECT username FROM users WHERE id = $1", [id]);
    await pool.query("UPDATE users SET is_banned = $1 WHERE id = $2", [is_banned, id]);

    await log({ user: req.user, action: is_banned ? "admin_ban_user" : "admin_unban_user", entityType: "user", entityId: id, entityName: target.rows[0]?.username, req });

    res.json({ success: true, message: is_banned ? "Пайдаланушы бандалды" : "Бан алынды" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── DELETE /api/admin/users/:id ── Пайдаланушыны жою
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ success: false, message: "Өзіңізді жоя алмайсыз" });

    const target = await pool.query("SELECT username FROM users WHERE id = $1", [id]);
    await log({ user: req.user, action: "admin_delete_user", entityType: "user", entityId: id, entityName: target.rows[0]?.username, req });

    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true, message: "Пайдаланушы жойылды" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── GET /api/admin/surveys ──
router.get("/surveys", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.username as owner_name, COUNT(r.id) as response_count
      FROM surveys s LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN responses r ON r.survey_id = s.id
      GROUP BY s.id, u.username ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── DELETE /api/admin/surveys/:id ──
router.delete("/surveys/:id", async (req, res) => {
  try {
    const survey = await pool.query("SELECT title FROM surveys WHERE id = $1", [req.params.id]);
    await log({ user: req.user, action: "admin_delete_survey", entityType: "survey", entityId: req.params.id, entityName: survey.rows[0]?.title, req });
    await pool.query("DELETE FROM surveys WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Сауалнама жойылды" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── PUT /api/admin/surveys/:id/publish ──
router.put("/surveys/:id/publish", async (req, res) => {
  try {
    const { is_published } = req.body;
    const survey = await pool.query("SELECT title FROM surveys WHERE id = $1", [req.params.id]);
    await pool.query("UPDATE surveys SET is_published = $1 WHERE id = $2", [is_published, req.params.id]);
    await log({ user: req.user, action: is_published ? "admin_publish_survey" : "admin_hide_survey", entityType: "survey", entityId: req.params.id, entityName: survey.rows[0]?.title, req });
    res.json({ success: true, message: is_published ? "Жарияланды" : "Жасырылды" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── GET /api/admin/logs ── Барлық әрекет журналы
router.get("/logs", async (req, res) => {
  try {
    const { action, user_id, limit = 100, offset = 0 } = req.query;
    let query = `SELECT * FROM activity_logs`;
    const params = [];
    const conditions = [];

    if (action) { params.push(action); conditions.push(`action = $${params.length}`); }
    if (user_id) { params.push(user_id); conditions.push(`user_id = $${params.length}`); }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query("SELECT COUNT(*) as total FROM activity_logs");
    res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

module.exports = router;
