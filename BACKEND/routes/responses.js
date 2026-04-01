const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { optionalAuth } = require("../middleware/auth");
const { awardXP, updateStreak, checkAndAwardAchievement, createNotification } = require("../utils/gamification");

router.post("/", optionalAuth, async (req, res) => {
  try {
    const { surveyId, answers, sessionId, _hp } = req.body;

    if (_hp) {
      return res.status(201).json({ success: true, message: "Жауаптар сәтті сақталды", xpGained: 0 });
    }

    if (!surveyId || !answers) {
      return res.status(400).json({ success: false, message: "surveyId және answers міндетті" });
    }

    const surveyCheck = await pool.query("SELECT owner_id, title FROM surveys WHERE id = $1", [surveyId]);
    if (surveyCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Сауалнама табылмады" });
    }

    const userId = req.user?.id || null;

    if (userId) {
      const dup = await pool.query(
        "SELECT id FROM responses WHERE survey_id = $1 AND user_id = $2 LIMIT 1",
        [surveyId, userId]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: "Сіз бұл сауалнамаға жауап бердіңіз" });
      }
    }

    const responseResult = await pool.query(
      "INSERT INTO responses (survey_id, user_id, session_id) VALUES ($1, $2, $3) RETURNING id",
      [surveyId, userId, sessionId || null]
    );
    const responseId = responseResult.rows[0].id;

    for (const [questionId, value] of Object.entries(answers)) {
      const answerValue = Array.isArray(value) ? value.join(",") : String(value);
      await pool.query(
        "INSERT INTO response_answers (response_id, question_id, answer_value) VALUES ($1, $2, $3)",
        [responseId, questionId, answerValue]
      );
    }

    await pool.query("UPDATE surveys SET respondents = respondents + 1 WHERE id = $1", [surveyId]);

    let xpGained = 0;
    let levelUp = false;
    let newBadges = [];

    if (userId) {
      const xpResult = await awardXP(userId, 10);
      if (xpResult) {
        xpGained += 10;
        levelUp = xpResult.levelUp;
      }

      await updateStreak(userId);

      const totalResponses = await pool.query(
        "SELECT COUNT(*) as cnt FROM responses WHERE user_id = $1",
        [userId]
      );
      const responseCount = parseInt(totalResponses.rows[0].cnt);

      if (responseCount === 1) {
        const badge = await checkAndAwardAchievement(userId, "first_response");
        if (badge) {
          xpGained += badge.xp_reward;
          newBadges.push(badge);
        }
      }

      if (responseCount === 10) {
        const badge = await checkAndAwardAchievement(userId, "ten_responses");
        if (badge) {
          xpGained += badge.xp_reward;
          newBadges.push(badge);
        }
      }

      const ownerId = surveyCheck.rows[0].owner_id;
      if (ownerId && ownerId !== userId) {
        await createNotification(
          ownerId,
          "new_response",
          `«${surveyCheck.rows[0].title}» сауалнамасына жаңа жауап!`,
          surveyId
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Жауаптар сәтті сақталды",
      xpGained,
      levelUp,
      newBadges,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

router.get("/stats/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;

    const totalResult = await pool.query(
      "SELECT COUNT(*) as total FROM responses WHERE survey_id = $1",
      [surveyId]
    );
    const total = parseInt(totalResult.rows[0].total);

    const questionsResult = await pool.query(
      `SELECT q.*, array_agg(json_build_object('id', qo.id, 'label', qo.label))
         FILTER (WHERE qo.id IS NOT NULL) as options
       FROM questions q
       LEFT JOIN question_options qo ON qo.question_id = q.id
       WHERE q.survey_id = $1
       GROUP BY q.id
       ORDER BY q.position`,
      [surveyId]
    );

    const stats = await Promise.all(
      questionsResult.rows.map(async (q) => {
        if (q.type === "single" || q.type === "multiple") {
          const countResult = await pool.query(
            `SELECT ra.answer_value, COUNT(*) as count
             FROM response_answers ra
             JOIN responses r ON r.id = ra.response_id
             WHERE ra.question_id = $1 AND r.survey_id = $2
             GROUP BY ra.answer_value`,
            [q.id, surveyId]
          );

          const optionMap = {};
          (q.options || []).forEach((o) => { optionMap[o.id] = o.label; });

          const breakdown = countResult.rows.map((row) => {
            const values = row.answer_value.split(",");
            return values.map((v) => ({
              label: optionMap[v] || v,
              count: parseInt(row.count),
            }));
          }).flat();

          const merged = {};
          breakdown.forEach(({ label, count }) => {
            merged[label] = (merged[label] || 0) + count;
          });

          return {
            questionId: q.id,
            questionText: q.text,
            type: q.type,
            data: Object.entries(merged).map(([label, count]) => ({ label, count })),
          };

        } else if (q.type === "rating") {
          const ratingResult = await pool.query(
            `SELECT AVG(CAST(ra.answer_value AS FLOAT)) as avg, COUNT(*) as count
             FROM response_answers ra
             JOIN responses r ON r.id = ra.response_id
             WHERE ra.question_id = $1 AND r.survey_id = $2`,
            [q.id, surveyId]
          );
          return {
            questionId: q.id,
            questionText: q.text,
            type: q.type,
            average: parseFloat(ratingResult.rows[0].avg || 0).toFixed(1),
            count: parseInt(ratingResult.rows[0].count),
          };

        } else {
          const textResult = await pool.query(
            `SELECT ra.answer_value
             FROM response_answers ra
             JOIN responses r ON r.id = ra.response_id
             WHERE ra.question_id = $1 AND r.survey_id = $2
             ORDER BY r.submitted_at DESC LIMIT 5`,
            [q.id, surveyId]
          );
          return {
            questionId: q.id,
            questionText: q.text,
            type: q.type,
            answers: textResult.rows.map((r) => r.answer_value),
          };
        }
      })
    );

    res.json({ success: true, data: { total, stats } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

module.exports = router;
