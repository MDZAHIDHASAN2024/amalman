# 🕌 Islamic Amal Tracker

A full-stack MERN application to track daily Islamic worship and good deeds.

## Features
- ✅ Salat tracker (Fajr, Dhuhr, Asr, Maghrib, Isha, Tahajjud)
- 📖 Quran pages & Juz tracker
- 🌙 Siyam (Fard & Nafl fasting)
- 🤲 Morning/Evening Azkar & 100× Tawba
- ⭐ General Rule custom points
- 🏃 Exercise minutes tracker
- 😴 Sleep hours tracker
- 🔥 Streak counter
- 📊 Monthly charts & analytics
- 🕌 Hijri calendar display
- 📜 Daily Hadith
- 📊 Export to Excel & PDF

## Tech Stack
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Recharts, React Router
- **Auth**: JWT
- **Reports**: ExcelJS, PDFKit

## Project Structure (MVC)
```
backend/
├── models/          ← M (Mongoose schemas)
├── controllers/     ← C (business logic)
├── routes/          ← routing layer
├── middleware/      ← auth middleware
└── server.js

frontend/src/
├── pages/           ← Dashboard, Tracker, History, Login
├── components/      ← Layout
├── context/         ← AuthContext
└── utils/           ← API helper
```

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Point System
| Activity | Points |
|----------|--------|
| Each Salat (max 10) | 0–10 |
| Tahajjud (max 5) | 0–5 |
| Each Quran page | 1 |
| Fard Fast | 20 |
| Nafl Fast | 10 |
| Morning Azkar | custom |
| 100× Astaghfirullah | 5 |
| Evening Azkar | custom |
| General Rule | custom |

**Score guide:** 🟢 80+ Excellent | 🟡 50–79 Good | 🔴 <50 Needs improvement

## API Endpoints
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET  /api/amal` — Get records (with filters)
- `GET  /api/amal/date/:date` — Get by date
- `POST /api/amal` — Save/update amal (upsert)
- `GET  /api/stats/dashboard` — Dashboard stats
- `GET  /api/reports/excel` — Export Excel
- `GET  /api/reports/pdf` — Export PDF
