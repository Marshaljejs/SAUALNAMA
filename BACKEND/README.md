# Сауалнама — Backend орнату нұсқаулығы

## 1. PostgreSQL орнату
https://www.postgresql.org/download/windows/ сайтынан жүктеп алыңыз

## 2. Дерекқор жасау
PostgreSQL орнатқаннан кейін терминалда:
```
psql -U postgres -f setup.sql
```
Немесе pgAdmin ашып, жаңа database жасаңыз: `saulnama_db`

## 3. .env файлын өңдеу
.env файлын ашып, кілтсөзіңізді жазыңыз:
```
DB_PASSWORD=сіздің_postgresql_кілтсөзіңіз
```

## 4. Backend іске қосу
```bash
npm install
npm run dev
```
Сервер: http://localhost:3001

## 5. Frontend іске қосу (бөлек терминалда)
```bash
cd "../Новая папка"
npm run dev
```
Сайт: http://localhost:8080

## API маршруттары
| Метод | URL | Сипаттама |
|-------|-----|-----------|
| GET | /api/surveys | Барлық сауалнамалар |
| GET | /api/surveys/:id | Бір сауалнама |
| POST | /api/surveys | Жаңа сауалнама |
| DELETE | /api/surveys/:id | Жою |
| POST | /api/responses | Жауап сақтау |
| GET | /api/responses/stats/:id | Статистика |
