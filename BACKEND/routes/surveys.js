const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { log } = require("../middleware/logger");
const { awardXP, updateStreak, checkAndAwardAchievement } = require("../utils/gamification");

router.get("/", optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.username as owner_name
      FROM surveys s
      LEFT JOIN users u ON u.id = s.owner_id
      WHERE s.is_published = true AND (s.status = 'published' OR s.status IS NULL)
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, COUNT(r.id) as response_count
      FROM surveys s
      LEFT JOIN responses r ON r.survey_id = s.id
      WHERE s.owner_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const surveyResult = await pool.query(
      "SELECT s.*, u.username as owner_name FROM surveys s LEFT JOIN users u ON u.id = s.owner_id WHERE s.id = $1",
      [id]
    );
    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Сауалнама табылмады" });
    }

    const survey = surveyResult.rows[0];

    if (survey.status === "draft") {
      const requestUserId = req.user?.id;
      if (!requestUserId || (requestUserId !== survey.owner_id && req.user?.role !== "admin")) {
        return res.status(404).json({ success: false, message: "Сауалнама табылмады" });
      }
    }

    const questionsResult = await pool.query(
      "SELECT * FROM questions WHERE survey_id = $1 ORDER BY position",
      [id]
    );
    const questions = await Promise.all(
      questionsResult.rows.map(async (q) => {
        const opts = await pool.query("SELECT * FROM question_options WHERE question_id = $1", [q.id]);
        return { ...q, options: opts.rows };
      })
    );
    res.json({ success: true, data: { ...survey, questions } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      id, title, description, emoji, icon, category, estimatedTime,
      questions, status, primary_color,
    } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: "Атауы мен сұрақтар міндетті" });
    }

    const surveyStatus = status === "draft" ? "draft" : "published";
    const isPublished = surveyStatus === "published";
    const color = primary_color || null;

    await pool.query(
      `INSERT INTO surveys (id, title, description, emoji, category, estimated_time, owner_id, status, is_published, primary_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, title, description, icon || emoji || null, category, estimatedTime, req.user.id, surveyStatus, isPublished, color]
    );

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await pool.query(
        `INSERT INTO questions (id, survey_id, text, type, required, position) VALUES ($1,$2,$3,$4,$5,$6)`,
        [q.id, id, q.text, q.type, q.required, i]
      );
      if (q.options) {
        for (const opt of q.options) {
          await pool.query(
            "INSERT INTO question_options (id, question_id, label) VALUES ($1,$2,$3)",
            [opt.id, q.id, opt.label]
          );
        }
      }
    }

    await log({
      user: req.user,
      action: "survey_create",
      entityType: "survey",
      entityId: id,
      entityName: title,
      details: { questionCount: questions.length, category, status: surveyStatus },
      req,
    });

    if (surveyStatus === "published") {
      await awardXP(req.user.id, 30);
      await updateStreak(req.user.id);

      const totalSurveys = await pool.query(
        "SELECT COUNT(*) as cnt FROM surveys WHERE owner_id = $1 AND status = 'published'",
        [req.user.id]
      );
      const surveyCount = parseInt(totalSurveys.rows[0].cnt);

      if (surveyCount === 1) {
        await checkAndAwardAchievement(req.user.id, "first_survey");
      }
      if (surveyCount === 5) {
        await checkAndAwardAchievement(req.user.id, "five_surveys");
      }
    }

    res.status(201).json({ success: true, message: "Сауалнама сәтті сақталды" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await pool.query("SELECT * FROM surveys WHERE id = $1", [id]);
    if (survey.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Сауалнама табылмады" });
    }

    const isOwner = survey.rows[0].owner_id === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Рұқсат жоқ" });
    }

    const {
      title, description, emoji, icon, category, estimatedTime,
      questions, status, primary_color,
    } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: "Сұрақтар тізімі міндетті" });
    }

    const surveyStatus = status === "draft" ? "draft" : "published";
    const isPublished = surveyStatus === "published";
    const color = primary_color !== undefined ? primary_color : survey.rows[0].primary_color;

    await pool.query(
      `UPDATE surveys
       SET title=$1, description=$2, emoji=$3, category=$4, estimated_time=$5,
           status=$6, is_published=$7, primary_color=$8, updated_at=NOW()
       WHERE id=$9`,
      [title, description, icon || emoji || null, category, estimatedTime, surveyStatus, isPublished, color, id]
    );

    await pool.query("DELETE FROM questions WHERE survey_id = $1", [id]);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await pool.query(
        `INSERT INTO questions (id, survey_id, text, type, required, position) VALUES ($1,$2,$3,$4,$5,$6)`,
        [q.id, id, q.text, q.type, q.required, i]
      );
      if (q.options) {
        for (const opt of q.options) {
          await pool.query(
            "INSERT INTO question_options (id, question_id, label) VALUES ($1,$2,$3)",
            [opt.id, q.id, opt.label]
          );
        }
      }
    }

    await log({
      user: req.user,
      action: "survey_edit",
      entityType: "survey",
      entityId: id,
      entityName: title,
      details: { editedByAdmin: isAdmin && !isOwner },
      req,
    });

    res.json({ success: true, message: "Сауалнама сәтті өзгертілді" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await pool.query("SELECT * FROM surveys WHERE id = $1", [id]);
    if (survey.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Сауалнама табылмады" });
    }

    const isOwner = survey.rows[0].owner_id === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Рұқсат жоқ" });
    }

    await log({
      user: req.user,
      action: "survey_delete",
      entityType: "survey",
      entityId: id,
      entityName: survey.rows[0].title,
      details: { deletedByAdmin: isAdmin && !isOwner },
      req,
    });

    await pool.query("DELETE FROM surveys WHERE id = $1", [id]);
    res.json({ success: true, message: "Сауалнама жойылды" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

module.exports = router;
