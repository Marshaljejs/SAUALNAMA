console.log("[startup] server.js loading...");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("[startup] dependencies loaded, connecting to DB...");

const { initDB } = require("./db");
const authRouter = require("./routes/auth");
const surveysRouter = require("./routes/surveys");
const responsesRouter = require("./routes/responses");
const adminRouter = require("./routes/admin");
const gamificationRouter = require("./routes/gamification");

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS error"));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRouter);
app.use("/api/surveys", surveysRouter);
app.use("/api/responses", responsesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/gamification", gamificationRouter);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("[error]", err.message);
  if (err.message === "CORS error") {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err.message);
  process.exit(1);
});

const start = async () => {
  try {
    console.log("[startup] initializing database...");
    await initDB();
    console.log("[startup] database ready, starting HTTP server...");
    app.listen(PORT, HOST, () => {
      console.log(`[startup] server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error("[startup] FATAL — could not start server:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

start();
