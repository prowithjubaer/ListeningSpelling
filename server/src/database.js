const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './data/database.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('admin', 'student')),
      batch_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      xp INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      last_practice_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listening_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL CHECK(category IN ('ielts', 'phrase', 'sentence', 'passage')),
      difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
      correct_text TEXT NOT NULL,
      normalized_text TEXT NOT NULL,
      note TEXT,
      tags TEXT,
      british_audio_path TEXT,
      australian_audio_path TEXT,
      teacher_audio_path TEXT,
      tts_enabled INTEGER NOT NULL DEFAULT 1,
      punctuation_mode TEXT NOT NULL DEFAULT 'flexible' CHECK(punctuation_mode IN ('strict', 'flexible')),
      capitalization_mode TEXT NOT NULL DEFAULT 'flexible' CHECK(capitalization_mode IN ('strict', 'flexible')),
      replay_limit INTEGER DEFAULT NULL,
      xp_value INTEGER NOT NULL DEFAULT 10,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      batch_id INTEGER,
      student_id INTEGER,
      category TEXT,
      difficulty TEXT,
      due_date TEXT,
      daily_target INTEGER DEFAULT 10,
      require_recording INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignment_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES listening_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'learning', 'review', 'mastered')),
      review_stage INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      total_attempts INTEGER NOT NULL DEFAULT 0,
      last_practiced_at TEXT,
      next_review_at TEXT,
      mastered_at TEXT,
      UNIQUE(student_id, item_id),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES listening_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS practice_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      typed_answer TEXT NOT NULL,
      normalized_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      replay_count INTEGER NOT NULL DEFAULT 0,
      accent_used TEXT,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES listening_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      duration REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES listening_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS xp_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      xp INTEGER NOT NULL,
      item_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      condition_type TEXT NOT NULL,
      condition_value INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS student_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id, badge_id),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
    CREATE INDEX IF NOT EXISTS idx_progress_item ON student_progress(item_id);
    CREATE INDEX IF NOT EXISTS idx_progress_next_review ON student_progress(next_review_at);
    CREATE INDEX IF NOT EXISTS idx_attempts_student ON practice_attempts(student_id);
    CREATE INDEX IF NOT EXISTS idx_items_category ON listening_items(category);
    CREATE INDEX IF NOT EXISTS idx_items_active ON listening_items(active);
    CREATE INDEX IF NOT EXISTS idx_xp_logs_student ON xp_logs(student_id);
  `);

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const defaults = {
    'wrong_review_1_days': '1', 'wrong_review_2_days': '3',
    'correct_review_1_days': '7', 'correct_review_2_days': '30',
    'xp_correct_first': '10', 'xp_correct_second': '6', 'xp_correct_third': '3',
    'xp_shadowing': '3', 'xp_daily_bonus': '20', 'xp_mastered': '15',
    'leaderboard_enabled': '1', 'recording_enabled': '1', 'save_recordings_to_server': '0',
    'tts_fallback_enabled': '1', 'default_replay_limit': '0', 'default_accent': 'british',
    'self_registration_enabled': '1', 'leaderboard_privacy': 'partial',
    'brand_name': 'Pro English BD', 'brand_tagline': 'ঠান্ডা মাথায় ইংলিশ শিখি'
  };
  for (const [key, value] of Object.entries(defaults)) { insertSetting.run(key, value); }

  const insertBadge = db.prepare('INSERT OR IGNORE INTO badges (name, description, icon, condition_type, condition_value) VALUES (?, ?, ?, ?, ?)');
  const badgeData = [
    ['3-Day Streak', '৩ দিন continuous practice!', '🔥', 'streak', 3],
    ['7-Day Streak', '৭ দিন continuous practice!', '⚡', 'streak', 7],
    ['30-Day Streak', '৩০ দিন continuous practice! অসাধারণ!', '🏆', 'streak', 30],
    ['First 50 Correct', '৫০টি সঠিক উত্তর দিয়েছেন!', '🎯', 'correct_count', 50],
    ['IELTS Spelling Master', 'IELTS spelling-এ ১০০টি correct!', '📝', 'ielts_correct', 100],
    ['Phrase Ninja', 'Phrase practice-এ ৫০টি correct!', '🥷', 'phrase_correct', 50],
    ['Sentence Warrior', 'Sentence practice-এ ৫০টি correct!', '⚔️', 'sentence_correct', 50],
    ['Shadowing Starter', 'প্রথম ১০টি shadowing recording!', '🎤', 'recording_count', 10],
    ['Consistent Learner', '১৪ দিন streak!', '📚', 'streak', 14]
  ];
  for (const badge of badgeData) { insertBadge.run(...badge); }
}

module.exports = { db, initializeDatabase };
