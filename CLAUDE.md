# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Сауалнама Платформасы** — a Kazakh-language survey platform with a React/TypeScript frontend and Node.js/Express/PostgreSQL backend. All UI text, error messages, and comments are in Kazakh.

## Development Commands

### Backend (runs on port 3001)
```bash
cd BACKEND
npm install
npm start          # nodemon (auto-reload)
node server.js     # direct run
```

### Frontend (runs on port 8080)
```bash
cd FRONTEND
npm install
npm run dev        # Vite dev server
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (unit tests)
```

### Database setup
```bash
# PostgreSQL must be running. Create DB and run:
psql -U postgres -d saulnama_db -f BACKEND/setup.sql
# Or just start the backend — initDB() auto-creates tables and seeds admin on startup
```

## Environment

Copy `BACKEND/.env.example` to `BACKEND/.env` and fill in:
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
PORT=3001
JWT_SECRET=<secret>
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
```

Default admin credentials (seeded on first run): `admin` / `admin123`

## Architecture

### Backend (`BACKEND/`)
- `server.js` — Express app setup, CORS (10 MB JSON limit), route mounting, error handler
- `db.js` — PostgreSQL pool, `initDB()` creates all tables and seeds admin on startup
- `routes/` — `auth.js`, `surveys.js`, `responses.js`, `admin.js`
- `middleware/auth.js` — `requireAuth`, `requireAdmin`, `optionalAuth` (JWT + ban check)
- `middleware/logger.js` — writes audit events to `activity_logs` table

### Frontend (`FRONTEND/src/`)
- `App.tsx` — router, context providers (`QueryClientProvider` → `AuthProvider` → `SurveyProvider`), route guards (`PrivateRoute`, `AdminRoute`)
- `lib/api.ts` — all HTTP calls to `http://localhost:3001/api`, attaches `Authorization: Bearer` from localStorage
- `context/AuthContext.tsx` — user session state (`user`, `token`, `isAdmin`), persisted to localStorage
- `context/SurveyContext.tsx` — published survey list, fetched on mount
- `pages/` — one file per route; `AdminPanel.tsx` for create/edit, `AdminDashboard.tsx` for user/survey management
- `data/surveys.ts` — TypeScript types for Survey, Question, and answer types (`single`, `multiple`, `text`, `rating`)

### Database schema (auto-created by `initDB`)
`users` → `surveys` → `questions` → `question_options`  
`responses` → `response_answers` (linked to survey + question)  
`activity_logs` — JSONB `details` column for structured audit data  
Responses support anonymous submissions via `session_id` (no `user_id` required).

### Auth flow
JWT stored in `localStorage` (key: `token`), expires in 7 days. Roles: `user` | `admin`. Banned users are rejected at the middleware level.

## Key Conventions
- TypeScript config has `noImplicitAny: false` and `strictNullChecks: false` — type annotations are loose by design.
- Path alias `@/` maps to `FRONTEND/src/`.
- Backend uses CommonJS (`require`/`module.exports`); frontend uses ESM.
- All user-facing strings are in Kazakh.
