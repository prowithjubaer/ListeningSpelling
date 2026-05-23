# 🎓 Pro English BD - Listening with Spelling Practice Tool

**ঠান্ডা মাথায় ইংলিশ শিখি**

A complete full-stack web application for Bangladeshi learners to improve listening, spelling, dictation, shadowing, and pronunciation through audio-based practice.

---

## 🚀 Quick Start

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Seed database with demo data
cd ../server && npm run seed

# Run production (after build)
cd ../client && npm run build
cd ../server && npm start
# App available at http://localhost:5000

# OR run development mode
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@proenglishbd.com | admin123 |
| **Student** | student@proenglishbd.com | student123 |

---

## ✨ Features

### Student
- 🎧 Listen to audio and type what you hear (hidden text)
- 📝 4 categories: IELTS Spelling, Phrases, Sentences, Passages
- 🔊 Admin-uploaded audio (British/Australian/Teacher) + free browser TTS fallback
- 💪 3-attempt feedback system with Bangla motivational messages
- 🔁 Spaced repetition (wrong→1d→3d, correct→7d→30d→mastered)
- ⚡ XP points, streaks, badges, leaderboard
- 🎤 Shadowing recording (record, playback, download)
- 📊 Dashboard with accuracy, progress, due reviews, mistake review

### Admin
- 📊 Full analytics dashboard
- 🎧 Create/edit/delete listening items with audio upload
- 📥 CSV/XLSX import with validation & preview
- 📤 Export items & student progress
- 👥 Student management with batch assignment
- 📋 Homework assignments (batch/individual, due dates, targets)
- ⚙️ Customizable settings (intervals, XP, features, branding)
- 📈 Accuracy reports & difficult items analysis

---

## 🎧 Audio System

**Method 1: Admin Uploaded Audio (Recommended)**
- Upload MP3/WAV/M4A/OGG per item (British, Australian, Teacher)
- Best for accurate accent practice

**Method 2: Browser TTS Fallback (Free)**
- Uses browser SpeechSynthesis API when no audio uploaded
- Voice availability depends on device/browser
- No paid API needed

---

## 📥 CSV Import Format

```csv
category,difficulty,correct_text,note,tags,punctuation_mode,capitalization_mode,active
ielts,easy,accommodation,Common word,spelling,flexible,flexible,true
phrase,medium,on the other hand,Connector,phrases,flexible,flexible,true
sentence,hard,Despite the rain they continued.,Complex,grammar,flexible,flexible,true
```

Categories: `ielts`, `phrase`, `sentence`, `passage`

---

## 🎮 Gamification

| Action | XP |
|--------|-----|
| Correct 1st attempt | +10 |
| Correct 2nd attempt | +6 |
| Correct 3rd attempt | +3 |
| Shadowing recording | +3 |
| Daily bonus | +20 |
| Item mastered | +15 |

Badges: 3/7/14/30-day streak, 50 correct, IELTS Master, Phrase Ninja, Sentence Warrior, Shadowing Starter

---

## 🔁 Spaced Repetition

- Wrong → review after 1 day → wrong again → 3 days
- Correct → 7 days → correct again → 30 days → **Mastered**
- All intervals configurable by admin

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Router, Axios, Vite |
| Backend | Node.js, Express.js |
| Database | SQLite (better-sqlite3) - PostgreSQL ready |
| Auth | JWT + bcryptjs |
| Upload | Multer |
| Import | csv-parse, xlsx |

---

## 🔒 Security

- bcrypt password hashing
- JWT with 7-day expiry
- Role-based route protection
- Rate limiting (20 login attempts/15min)
- File type/size validation
- Students isolated to own data

---

## 📁 Project Structure

```
├── server/
│   ├── src/index.js          # Express server
│   ├── src/database.js       # SQLite schema
│   ├── src/seed.js           # Demo data
│   ├── src/routes/auth.js    # Login/register
│   ├── src/routes/admin.js   # Admin CRUD
│   ├── src/routes/student.js # Practice/progress
│   ├── src/routes/import-export.js
│   ├── src/middleware/auth.js # JWT middleware
│   ├── src/utils/normalize.js # Answer checking
│   └── uploads/audio/        # Audio files
├── client/
│   ├── src/App.jsx           # Routing
│   ├── src/pages/student/    # Student UI
│   ├── src/pages/admin/      # Admin UI
│   └── src/components/       # Layouts
└── README.md
```

---

## 📝 Notes

- No paid AI/TTS APIs used - fully free
- Browser TTS quality varies by device
- For guaranteed accent accuracy, use admin-uploaded audio
- SQLite for easy local deployment; code is PostgreSQL-ready
- Mobile-first responsive design

---

**শুনুন → লিখুন → বলুন → আবার শুনুন** 🎧

Made with ❤️ for Pro English BD students
