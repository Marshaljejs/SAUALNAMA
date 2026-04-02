# Сауалнама Платформасы

## Структура
```
project/
├── FRONTEND/    ← React + Vite + TypeScript + shadcn/ui
└── BACKEND/     ← Node.js + Express + PostgreSQL
```

## Іске қосу

### 1. BACKEND
```bash
cd BACKEND
# .env ішіне DB_PASSWORD жазыңыз
npm install
npm run dev
# → http://localhost:3001
```

### 2. FRONTEND (жаңа терминалда)
```bash
cd FRONTEND
npm install
npm run dev
# → http://localhost:8080
```


## API маршруттары
| Метод | URL | Сипаттама |
|-------|-----|-----------|
| POST | /api/auth/register | Тіркелу |
| POST | /api/auth/login | Кіру |
| GET | /api/surveys | Барлық сауалнамалар |
| POST | /api/surveys | Жаңа сауалнама |
| PUT | /api/surveys/:id | Өңдеу |
| DELETE | /api/surveys/:id | Жою |
| POST | /api/responses | Жауап сақтау |
| GET | /api/admin/stats | Статистика |
| GET | /api/admin/users | Пайдаланушылар |
| GET | /api/admin/surveys | Барлық сауалнамалар (admin) |
