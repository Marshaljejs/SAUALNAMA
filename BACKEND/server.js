const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { initDB } = require("./db");
const authRouter = require("./routes/auth");
const surveysRouter = require("./routes/surveys");
const responsesRouter = require("./routes/responses");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/surveys", surveysRouter);
app.use("/api/responses", responsesRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Сервер жұмыс істеуде ✅" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Маршрут табылмады" });
});

app.use((err, req, res, next) => {
  console.error("Қате:", err.message);
  res.status(500).json({ success: false, message: "Ішкі сервер қатесі" });
});

const start = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Сервер http://localhost:${PORT}`);
    console.log(`📋 Сауалнамалар: http://localhost:${PORT}/api/surveys`);
    console.log(`👑 Админ: http://localhost:${PORT}/api/admin/stats`);
  });
};

start();
