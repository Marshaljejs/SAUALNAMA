const { pool } = require("../db");

const log = async ({ user, action, entityType, entityId, entityName, details, req }) => {
  try {
    const ip = req?.headers["x-forwarded-for"] || req?.socket?.remoteAddress || null;
    await pool.query(
      `INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, entity_name, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user?.id || null,
        user?.username || "anonymous",
        action,
        entityType || null,
        entityId ? String(entityId) : null,
        entityName || null,
        details ? JSON.stringify(details) : null,
        ip,
      ]
    );
  } catch (err) {
    console.error("Log error:", err.message);
  }
};

module.exports = { log };
