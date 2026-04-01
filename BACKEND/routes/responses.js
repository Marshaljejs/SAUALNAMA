const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// ── POST /api/responses ── Жауаптарды сақтау
router.post("/", async (req, res) => {
  try {
    const { surveyId, answers, sessionId } = req.body;

    if (!surveyId || !answers) {
      return res.status(400).json({ success: false, message: "surveyId және answers міндетті" });
    }

    // Жаңа response жазбасын жасау
    const responseResult = await pool.query(
      "INSERT INTO responses (survey_id, session_id) VALUES ($1, $2) RETURNING id",
      [surveyId, sessionId || null]
    );
    const responseId = responseResult.rows[0].id;

    // Әр жауапты сақтау
    // answers = { "q1": "a", "q2": ["a","b"], "q3": 4, "q4": "еркін жауап" }
    for (const [questionId, value] of Object.entries(answers)) {
      const answerValue = Array.isArray(value)
        ? value.join(",")  // Бірнеше таңдау: ["a","b"] → "a,b"
        : String(value);

      await pool.query(
        "INSERT INTO response_answers (response_id, question_id, answer_value) VALUES ($1, $2, $3)",
        [responseId, questionId, answerValue]
      );
    }

    // Қатысушылар санын арттыру
    await pool.query(
      "UPDATE surveys SET respondents = respondents + 1 WHERE id = $1",
      [surveyId]
    );

    res.status(201).json({ success: true, message: "Жауаптар сәтті сақталды" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Сервер қатесі" });
  }
});

// ── GET /api/responses/stats/:surveyId ── Статистика алу
router.get("/stats/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Жалпы қатысушылар саны
    const totalResult = await pool.query(
      "SELECT COUNT(*) as total FROM responses WHERE survey_id = $1",
      [surveyId]
    );
    const total = parseInt(totalResult.rows[0].total);

    // Сауалнаманың сұрақтарын алу
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

    // Әр сұрақ бойынша статистика
    const stats = await Promise.all(
      questionsResult.rows.map(async (q) => {
        if (q.type === "single" || q.type === "multiple") {
          // Нұсқалар бойынша санау
          const countResult = await pool.query(
            `SELECT ra.answer_value, COUNT(*) as count
             FROM response_answers ra
             JOIN responses r ON r.id = ra.response_id
             WHERE ra.question_id = $1 AND r.survey_id = $2
             GROUP BY ra.answer_value`,
            [q.id, surveyId]
          );

          // Нұсқа id-ін label-ға аудару
          const optionMap = {};
          (q.options || []).forEach((o) => { optionMap[o.id] = o.label; });

          const breakdown = countResult.rows.map((row) => {
            // Бірнеше таңдау: "a,b" → ["a","b"]
            const values = row.answer_value.split(",");
            return values.map((v) => ({
              label: optionMap[v] || v,
              count: parseInt(row.count),
            }));
          }).flat();

          // Бір label-ды біріктіру
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
          // Орташа баға
          const ratingResult = await pool.query(
            `SELECT AVG(CAST(ra.answer_value AS FLOAT)) as avg,
                    COUNT(*) as count
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
          // Еркін жауаптар — соңғы 5-ін қайтару
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
