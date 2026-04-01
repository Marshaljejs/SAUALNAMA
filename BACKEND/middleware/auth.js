const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const JWT_SECRET = process.env.JWT_SECRET || "saulnama_secret_key";

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Авторизация қажет" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Бан тексеру
    const user = await pool.query("SELECT is_banned FROM users WHERE id = $1", [decoded.id]);
    if (user.rows[0]?.is_banned)
      return res.status(403).json({ success: false, message: "Сіздің аккаунтыңыз бандалған" });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Токен жарамсыз немесе мерзімі өткен" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ success: false, message: "Тек админге рұқсат" });
  next();
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try { req.user = jwt.verify(authHeader.split(" ")[1], JWT_SECRET); }
    catch { req.user = null; }
  }
  next();
};

module.exports = { requireAuth, requireAdmin, optionalAuth };
