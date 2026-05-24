const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { normalizeText, compareAnswers, getDifferences } = require('../utils/normalize');
const router = express.Router();
router.use(authenticateToken);

function addDays(dateStr, days) { const d = new Date(dateStr); d.setDate(d.getDate() + days); return d.toISOString(); }
function maskName(name) { if (!name || name.length <= 3) return name; return name.substring(0, 2) + '*'.repeat(name.length - 3) + name.slice(-1); }

function updateStreak(studentId) {
  const user = db.prepare('SELECT last_practice_date, streak, best_streak FROM users WHERE id = ?').get(studentId);
  const today = new Date().toISOString().split('T')[0];
  if (user.last_practice_date === today) return;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  let newStreak = user.last_practice_date === yesterday.toISOString().split('T')[0] ? user.streak + 1 : 1;
  db.prepare('UPDATE users SET streak = ?, best_streak = ?, last_practice_date = ? WHERE id = ?').run(newStreak, Math.max(newStreak, user.best_streak), today, studentId);
}

function checkBadges(studentId) {
  const user = db.prepare('SELECT streak FROM users WHERE id = ?').get(studentId);
  const totalCorrect = db.prepare('SELECT COUNT(*) as c FROM practice_attempts WHERE student_id = ? AND is_correct = 1').get(studentId).c;
  const badges = db.prepare('SELECT * FROM badges').all();
  const insertBadge = db.prepare('INSERT OR IGNORE INTO student_badges (student_id, badge_id) VALUES (?, ?)');
  for (const badge of badges) {
    let earned = false;
    if (badge.condition_type === 'streak' && user.streak >= badge.condition_value) earned = true;
    if (badge.condition_type === 'correct_count' && totalCorrect >= badge.condition_value) earned = true;
    if (badge.condition_type === 'ielts_correct') { const c = db.prepare("SELECT COUNT(*) as c FROM practice_attempts pa JOIN listening_items li ON li.id = pa.item_id WHERE pa.student_id = ? AND pa.is_correct = 1 AND li.category = 'ielts'").get(studentId).c; if (c >= badge.condition_value) earned = true; }
    if (badge.condition_type === 'phrase_correct') { const c = db.prepare("SELECT COUNT(*) as c FROM practice_attempts pa JOIN listening_items li ON li.id = pa.item_id WHERE pa.student_id = ? AND pa.is_correct = 1 AND li.category = 'phrase'").get(studentId).c; if (c >= badge.condition_value) earned = true; }
    if (badge.condition_type === 'sentence_correct') { const c = db.prepare("SELECT COUNT(*) as c FROM practice_attempts pa JOIN listening_items li ON li.id = pa.item_id WHERE pa.student_id = ? AND pa.is_correct = 1 AND li.category = 'sentence'").get(studentId).c; if (c >= badge.condition_value) earned = true; }
    if (badge.condition_type === 'recording_count') { const c = db.prepare('SELECT COUNT(*) as c FROM recordings WHERE student_id = ?').get(studentId).c; if (c >= badge.condition_value) earned = true; }
    if (earned) insertBadge.run(studentId, badge.id);
  }
}

// Dashboard
router.get('/dashboard', (req, res) => {
  try {
    const studentId = req.user.id;
    const user = db.prepare('SELECT id, name, xp, streak, best_streak, last_practice_date FROM users WHERE id = ?').get(studentId);
    const totalAttempts = db.prepare('SELECT COUNT(*) as count FROM practice_attempts WHERE student_id = ?').get(studentId).count;
    const correctAttempts = db.prepare('SELECT COUNT(*) as count FROM practice_attempts WHERE student_id = ? AND is_correct = 1').get(studentId).count;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPracticed = db.prepare("SELECT COUNT(DISTINCT item_id) as count FROM practice_attempts WHERE student_id = ? AND date(created_at) = ?").get(studentId, todayStr).count;
    const dueReviews = db.prepare("SELECT COUNT(*) as count FROM student_progress WHERE student_id = ? AND next_review_at <= datetime('now') AND status != 'mastered'").get(studentId).count;
    const mistakes = db.prepare("SELECT COUNT(*) as count FROM student_progress WHERE student_id = ? AND status = 'learning' AND wrong_count > 0").get(studentId).count;
    const mastered = db.prepare("SELECT COUNT(*) as count FROM student_progress WHERE student_id = ? AND status = 'mastered'").get(studentId).count;
    const categoryProgress = db.prepare("SELECT li.category, COUNT(sp.id) as total, SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as mastered_count FROM student_progress sp JOIN listening_items li ON li.id = sp.item_id WHERE sp.student_id = ? GROUP BY li.category").all(studentId);
    const recentMistakes = db.prepare("SELECT li.correct_text, li.category, pa.typed_answer, pa.created_at FROM practice_attempts pa JOIN listening_items li ON li.id = pa.item_id WHERE pa.student_id = ? AND pa.is_correct = 0 ORDER BY pa.created_at DESC LIMIT 5").all(studentId);
    const rank = db.prepare("SELECT COUNT(*) + 1 as rank FROM users WHERE role = 'student' AND xp > (SELECT xp FROM users WHERE id = ?)").get(studentId).rank;
    res.json({ user, accuracy, totalAttempts, correctAttempts, todayPracticed, dueReviews, mistakes, mastered, categoryProgress, recentMistakes, rank });
  } catch (err) { res.status(500).json({ error: 'Failed to load dashboard.' }); }
});

// Practice items
router.get('/practice', (req, res) => {
  try {
    const studentId = req.user.id;
    const { category, mode } = req.query;
    let items = [];
    if (mode === 'review') {
      items = db.prepare("SELECT li.*, sp.status as progress_status, sp.next_review_at, sp.wrong_count FROM student_progress sp JOIN listening_items li ON li.id = sp.item_id WHERE sp.student_id = ? AND sp.next_review_at <= datetime('now') AND sp.status != 'mastered' AND li.active = 1 ORDER BY sp.next_review_at ASC LIMIT 20").all(studentId);
    } else if (mode === 'mistakes') {
      items = db.prepare("SELECT li.*, sp.status as progress_status, sp.wrong_count FROM student_progress sp JOIN listening_items li ON li.id = sp.item_id WHERE sp.student_id = ? AND sp.wrong_count > sp.correct_count AND sp.status != 'mastered' AND li.active = 1 ORDER BY sp.wrong_count DESC LIMIT 20").all(studentId);
    } else {
      let query = 'SELECT li.* FROM listening_items li WHERE li.active = 1'; const params = [];
      if (category) { query += ' AND li.category = ?'; params.push(category); }
      query += " AND li.id NOT IN (SELECT item_id FROM student_progress WHERE student_id = ? AND status = 'mastered')"; params.push(studentId);
      query += ' ORDER BY RANDOM() LIMIT 20';
      items = db.prepare(query).all(...params);
    }
    const sanitized = items.map(item => ({ id: item.id, category: item.category, difficulty: item.difficulty, note: item.note, tags: item.tags, british_audio_path: item.british_audio_path, australian_audio_path: item.australian_audio_path, teacher_audio_path: item.teacher_audio_path, tts_enabled: item.tts_enabled, punctuation_mode: item.punctuation_mode, capitalization_mode: item.capitalization_mode, replay_limit: item.replay_limit, xp_value: item.xp_value, progress_status: item.progress_status || 'new', wrong_count: item.wrong_count || 0 }));
    res.json(sanitized);
  } catch (err) { res.status(500).json({ error: 'Failed to get practice items.' }); }
});

// TTS text
router.get('/practice/:id/tts', (req, res) => {
  try {
    const item = db.prepare('SELECT id, correct_text, tts_enabled FROM listening_items WHERE id = ? AND active = 1').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (!item.tts_enabled) return res.status(400).json({ error: 'TTS disabled for this item.' });
    res.json({ id: item.id, text: item.correct_text });
  } catch (err) { res.status(500).json({ error: 'Failed to get TTS data.' }); }
});

// Submit answer
router.post('/practice/:id/submit', (req, res) => {
  try {
    const studentId = req.user.id;
    const itemId = parseInt(req.params.id);
    const { typed_answer, attempt_number, replay_count, accent_used } = req.body;
    if (!typed_answer) return res.status(400).json({ error: 'Answer required.' });
    const item = db.prepare('SELECT * FROM listening_items WHERE id = ?').get(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    const options = { punctuationMode: item.punctuation_mode, capitalizationMode: item.capitalization_mode };
    const isCorrect = compareAnswers(typed_answer, item.correct_text, options);
    const normalizedAnswer = normalizeText(typed_answer, options);
    const settings = {}; db.prepare('SELECT key, value FROM settings').all().forEach(s => { settings[s.key] = s.value; });
    let xpEarned = 0; const attemptNum = attempt_number || 1;
    if (isCorrect) { if (attemptNum === 1) xpEarned = parseInt(settings.xp_correct_first) || 10; else if (attemptNum === 2) xpEarned = parseInt(settings.xp_correct_second) || 6; else xpEarned = parseInt(settings.xp_correct_third) || 3; }
    db.prepare('INSERT INTO practice_attempts (student_id, item_id, typed_answer, normalized_answer, is_correct, attempt_number, replay_count, accent_used, xp_earned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(studentId, itemId, typed_answer, normalizedAnswer, isCorrect ? 1 : 0, attemptNum, replay_count || 0, accent_used || null, xpEarned);
    let progress = db.prepare('SELECT * FROM student_progress WHERE student_id = ? AND item_id = ?').get(studentId, itemId);
    if (!progress) { db.prepare('INSERT INTO student_progress (student_id, item_id) VALUES (?, ?)').run(studentId, itemId); progress = db.prepare('SELECT * FROM student_progress WHERE student_id = ? AND item_id = ?').get(studentId, itemId); }
    const now = new Date().toISOString();
    let nextReview = null, newStatus = progress.status, reviewStage = progress.review_stage, masteredAt = progress.mastered_at;
    if (isCorrect) {
      const cr1 = parseInt(settings.correct_review_1_days) || 7; const cr2 = parseInt(settings.correct_review_2_days) || 30;
      if (progress.review_stage === 0) { reviewStage = 1; nextReview = addDays(now, cr1); newStatus = 'review'; }
      else if (progress.review_stage === 1) { reviewStage = 2; nextReview = addDays(now, cr2); newStatus = 'review'; }
      else { newStatus = 'mastered'; masteredAt = now; nextReview = null; xpEarned += parseInt(settings.xp_mastered) || 15; }
    } else if (attemptNum >= 3) {
      const wr1 = parseInt(settings.wrong_review_1_days) || 1; const wr2 = parseInt(settings.wrong_review_2_days) || 3;
      nextReview = addDays(now, progress.wrong_count <= 1 ? wr1 : wr2); newStatus = 'learning'; reviewStage = 0;
    }
    if (isCorrect || attemptNum >= 3) {
      db.prepare('UPDATE student_progress SET status = ?, review_stage = ?, correct_count = correct_count + ?, wrong_count = wrong_count + ?, total_attempts = total_attempts + 1, last_practiced_at = ?, next_review_at = ?, mastered_at = ? WHERE student_id = ? AND item_id = ?').run(newStatus, reviewStage, isCorrect ? 1 : 0, isCorrect ? 0 : 1, now, nextReview, masteredAt, studentId, itemId);
    }
    if (xpEarned > 0) { db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpEarned, studentId); db.prepare('INSERT INTO xp_logs (student_id, action_type, xp, item_id) VALUES (?, ?, ?, ?)').run(studentId, isCorrect ? 'correct_answer' : 'mastered', xpEarned, itemId); }
    updateStreak(studentId); checkBadges(studentId);
    const response = { is_correct: isCorrect, attempt_number: attemptNum, xp_earned: xpEarned };
    if (isCorrect) { response.message = 'দারুণ! একদম ঠিক হয়েছে 🎉'; response.correct_text = item.correct_text; response.bangla_meaning = item.bangla_meaning; }
    else if (attemptNum === 1) { response.message = 'আরেকবার শুনে চেষ্টা করুন 💪'; }
    else if (attemptNum === 2) { response.message = 'আরো একবার মনোযোগ দিয়ে শুনুন। আপনি পারবেন 🔁'; }
    else { response.message = 'ভুল হওয়া মানেই শেখা হচ্ছে। পরের বার ঠিক হবে!'; response.correct_text = item.correct_text; response.bangla_meaning = item.bangla_meaning; response.differences = getDifferences(typed_answer, item.correct_text); }
    res.json(response);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to submit answer.' }); }
});

// Mistakes
router.get('/mistakes', (req, res) => {
  try {
    const studentId = req.user.id; const { category } = req.query;
    // Get items where student has wrong attempts recorded
    let query = `
      SELECT sp.*, li.correct_text, li.category, li.difficulty, li.british_audio_path, li.australian_audio_path, li.teacher_audio_path, li.tts_enabled
      FROM student_progress sp
      JOIN listening_items li ON li.id = sp.item_id
      WHERE sp.student_id = ? AND sp.wrong_count > 0
    `;
    const params = [studentId]; 
    if (category) { query += ' AND li.category = ?'; params.push(category); }
    query += ' ORDER BY sp.wrong_count DESC, sp.last_practiced_at DESC';
    const mistakes = db.prepare(query).all(...params);
    const result = mistakes.map(m => { 
      const lastAttempt = db.prepare('SELECT typed_answer, created_at FROM practice_attempts WHERE student_id = ? AND item_id = ? AND is_correct = 0 ORDER BY created_at DESC LIMIT 1').get(studentId, m.item_id); 
      return { 
        ...m, 
        last_wrong_answer: lastAttempt?.typed_answer || '', 
        last_mistake_date: lastAttempt?.created_at || '', 
        differences: lastAttempt ? getDifferences(lastAttempt.typed_answer, m.correct_text) : [] 
      }; 
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Failed to get mistakes.' }); }
});

// Leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'leaderboard_enabled'").get();
    if (!setting || setting.value !== '1') return res.json({ enabled: false, data: [] });
    const { period } = req.query;

    let data;
    if (period === 'weekly' || period === 'monthly') {
      const days = period === 'weekly' ? '-7 days' : '-30 days';
      data = db.prepare(`
        SELECT u.id, u.name, u.xp as total_xp, u.streak,
          COALESCE((SELECT SUM(xl.xp) FROM xp_logs xl WHERE xl.student_id = u.id AND xl.created_at >= datetime('now', ?)), 0) as period_xp,
          COALESCE((SELECT ROUND(AVG(CASE WHEN pa.is_correct = 1 THEN 100.0 ELSE 0.0 END), 1) FROM practice_attempts pa WHERE pa.student_id = u.id), 0) as accuracy
        FROM users u
        WHERE u.role = 'student' AND u.status = 'active'
        ORDER BY period_xp DESC
        LIMIT 50
      `).all(days);
    } else {
      // All time - use total XP from users table directly
      data = db.prepare(`
        SELECT u.id, u.name, u.xp as total_xp, u.streak,
          u.xp as period_xp,
          COALESCE((SELECT ROUND(AVG(CASE WHEN pa.is_correct = 1 THEN 100.0 ELSE 0.0 END), 1) FROM practice_attempts pa WHERE pa.student_id = u.id), 0) as accuracy
        FROM users u
        WHERE u.role = 'student' AND u.status = 'active'
        ORDER BY u.xp DESC
        LIMIT 50
      `).all();
    }

    // Always show full names (no masking)
    const result = data.map((d, i) => ({
      rank: i + 1,
      name: d.name,
      xp: d.period_xp,
      total_xp: d.total_xp,
      streak: d.streak,
      accuracy: d.accuracy,
      isCurrentUser: d.id === req.user.id
    }));
    res.json({ enabled: true, data: result });
  } catch (err) { res.status(500).json({ error: 'Failed to get leaderboard.' }); }
});

// Recordings & badges & assignments
router.get('/recordings', (req, res) => { try { res.json(db.prepare('SELECT r.*, li.correct_text, li.category FROM recordings r JOIN listening_items li ON li.id = r.item_id WHERE r.student_id = ? ORDER BY r.created_at DESC').all(req.user.id)); } catch (err) { res.status(500).json({ error: 'Failed to get recordings.' }); } });
router.get('/assignments', (req, res) => { try { const user = db.prepare('SELECT batch_id FROM users WHERE id = ?').get(req.user.id); res.json(db.prepare('SELECT a.* FROM assignments a WHERE (a.student_id = ? OR a.batch_id = ?) ORDER BY a.due_date DESC').all(req.user.id, user.batch_id || -1)); } catch (err) { res.status(500).json({ error: 'Failed.' }); } });
router.get('/badges', (req, res) => { try { const allBadges = db.prepare('SELECT * FROM badges').all(); const earned = db.prepare('SELECT badge_id, earned_at FROM student_badges WHERE student_id = ?').all(req.user.id); const earnedMap = {}; earned.forEach(e => { earnedMap[e.badge_id] = e.earned_at; }); res.json(allBadges.map(b => ({ ...b, earned: !!earnedMap[b.id], earned_at: earnedMap[b.id] || null }))); } catch (err) { res.status(500).json({ error: 'Failed.' }); } });

module.exports = router;
