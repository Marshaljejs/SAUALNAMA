const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { log } = require("../middleware/logger");

const JWT_SECRET = process.env.JWT_SECRET || "saulnama_secret_key";

const publicUser = (row) => ({
  id: row.id,
  username: row.username,
  role: row.role,
  avatar: row.avatar ?? null,
  xp: row.xp ?? 0,
  level: row.level ?? 1,
  streak_count: row.streak_count ?? 0,
});

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: "Логин мен кілтсөз міндетті" });
    if (username.length < 3)
      return res.status(400).json({ success: false, message: "Логин кем дегенде 3 таңба болуы керек" });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Кілтсөз кем дегенде 6 таңба болуы керек" });

    const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (existing.rows.length > 0)
      return res.status(409).json({ success: false, message: "Бұл логин бұрыннан бар" });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, role, avatar, xp, level, streak_count`,
      [username, passwordHash]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await log({ user, action: "register", entityType: "user", entityId: user.id, entityName: user.username, req });

    res.status(201).json({
      success: true,
      message: "Тіркелу сәтті аяқталды",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: "Логин мен кілтсөз міндетті" });

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      await log({ user: { id: null, username }, action: "login_failed", entityType: "user", entityName: username, details: { reason: "Пайдаланушы табылмады" }, req });
      return res.status(401).json({ success: false, message: "Логин немесе кілтсөз қате" });
    }
    const user = result.rows[0];

    if (user.is_banned) {
      return res.status(403).json({ success: false, message: "Аккаунтыңыз бұғатталған" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await log({ user: { id: user.id, username: user.username }, action: "login_failed", entityType: "user", entityId: user.id, entityName: user.username, details: { reason: "Кілтсөз қате" }, req });
      return res.status(401).json({ success: false, message: "Логин немесе кілтсөз қате" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await log({ user: { id: user.id, username: user.username }, action: "login", entityType: "user", entityId: user.id, entityName: user.username, req });

    res.json({
      success: true,
      message: "Сәтті кірдіңіз",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.get("/me", require("../middleware/auth").requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, avatar, xp, level, streak_count, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Пайдаланушы табылмады" });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.put("/profile", require("../middleware/auth").requireAuth, async (req, res) => {
  try {
    const { username, avatar } = req.body;

    if (username !== undefined) {
      if (username.length < 3)
        return res.status(400).json({ success: false, message: "Логин кем дегенде 3 таңба болуы керек" });
      const taken = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, req.user.id]
      );
      if (taken.rows.length > 0)
        return res.status(409).json({ success: false, message: "Бұл логин бұрыннан бар" });
    }

    const result = await pool.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           avatar   = COALESCE($2, avatar)
       WHERE id = $3
       RETURNING id, username, role, avatar, xp, level, streak_count`,
      [username ?? null, avatar ?? null, req.user.id]
    );

    const updated = result.rows[0];
    await log({ user: updated, action: "update_profile", entityType: "user", entityId: updated.id, entityName: updated.username, req });

    res.json({ success: true, user: publicUser(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.put("/password", require("../middleware/auth").requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Барлық өрістерді толтырыңыз" });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Жаңа кілтсөз кем дегенде 6 таңба болуы керек" });

    const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid)
      return res.status(401).json({ success: false, message: "Ағымдағы кілтсөз қате" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, req.user.id]);

    await log({ user: req.user, action: "change_password", entityType: "user", entityId: req.user.id, entityName: req.user.username, req });

    res.json({ success: true, message: "Кілтсөз сәтті өзгертілді" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

module.exports = router;
