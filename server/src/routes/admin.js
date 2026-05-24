const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { normalizeText } = require('../utils/normalize');
const router = express.Router();
router.use(authenticateToken, requireAdmin);

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = path.join(__dirname, '../../uploads/audio'); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); cb(null, dir); },
  filename: (req, file, cb) => { cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`); }
});
const audioUpload = multer({
  storage: audioStorage, limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => { const allowed = ['.mp3', '.wav', '.m4a', '.ogg', '.webm']; cb(null, allowed.includes(path.extname(file.originalname).toLowerCase())); }
});

// Dashboard
router.get('/dashboard', (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const totalItems = db.prepare("SELECT COUNT(*) as count FROM listening_items").get().count;
    const totalAttempts = db.prepare("SELECT COUNT(*) as count FROM practice_attempts").get().count;
    const avgAccuracy = db.prepare("SELECT COALESCE(AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END), 0) as avg FROM practice_attempts").get().avg;
    const topStudents = db.prepare(`SELECT u.id, u.name, u.xp, u.streak, COALESCE(ROUND(AVG(CASE WHEN pa.is_correct = 1 THEN 100.0 ELSE 0.0 END), 1), 0) as accuracy FROM users u LEFT JOIN practice_attempts pa ON pa.student_id = u.id WHERE u.role = 'student' GROUP BY u.id ORDER BY u.xp DESC LIMIT 10`).all();
    const categoryStats = db.prepare('SELECT category, COUNT(*) as count FROM listening_items GROUP BY category').all();
    const recentActivity = db.prepare(`SELECT pa.created_at, u.name, li.correct_text, pa.is_correct, li.category FROM practice_attempts pa JOIN users u ON u.id = pa.student_id JOIN listening_items li ON li.id = pa.item_id ORDER BY pa.created_at DESC LIMIT 20`).all();
    res.json({ totalStudents, totalItems, totalAttempts, avgAccuracy: Math.round(avgAccuracy * 10) / 10, topStudents, categoryStats, recentActivity });
  } catch (err) { res.status(500).json({ error: 'Failed to load dashboard.' }); }
});

// Students CRUD
router.get('/students', (req, res) => {
  try {
    const { search, batch_id, status } = req.query;
    let query = "SELECT u.*, b.name as batch_name FROM users u LEFT JOIN batches b ON b.id = u.batch_id WHERE u.role = 'student'";
    const params = [];
    if (search) { query += " AND (u.name LIKE ? OR u.email LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (batch_id) { query += " AND u.batch_id = ?"; params.push(batch_id); }
    if (status) { query += " AND u.status = ?"; params.push(status); }
    query += " ORDER BY u.created_at DESC";
    const students = db.prepare(query).all(...params);
    res.json(students.map(s => { const { password_hash, ...rest } = s; return rest; }));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch students.' }); }
});

router.post('/students', (req, res) => {
  try {
    const { name, email, phone, password, batch_id } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required.' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already exists.' });
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, phone, password_hash, role, batch_id) VALUES (?, ?, ?, ?, ?, ?)').run(name, email, phone || null, hash, 'student', batch_id || null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const { password_hash, ...userData } = user;
    res.status(201).json(userData);
  } catch (err) { res.status(500).json({ error: 'Failed to create student.' }); }
});

router.put('/students/:id', (req, res) => {
  try {
    const { name, email, phone, batch_id, status, password } = req.body;
    const student = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'student'").get(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    let query = 'UPDATE users SET name = ?, email = ?, phone = ?, batch_id = ?, status = ?, updated_at = datetime("now")';
    const params = [name || student.name, email || student.email, phone || student.phone, batch_id !== undefined ? batch_id : student.batch_id, status || student.status];
    if (password) { query += ', password_hash = ?'; params.push(bcrypt.hashSync(password, 10)); }
    query += ' WHERE id = ?'; params.push(req.params.id);
    db.prepare(query).run(...params);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    const { password_hash, ...userData } = updated;
    res.json(userData);
  } catch (err) { res.status(500).json({ error: 'Failed to update student.' }); }
});

router.delete('/students/:id', (req, res) => {
  try { db.prepare("DELETE FROM users WHERE id = ? AND role = 'student'").run(req.params.id); res.json({ message: 'Student deleted.' }); }
  catch (err) { res.status(500).json({ error: 'Failed to delete student.' }); }
});

router.get('/students/:id/progress', (req, res) => {
  try { const progress = db.prepare(`SELECT sp.*, li.correct_text, li.category, li.difficulty FROM student_progress sp JOIN listening_items li ON li.id = sp.item_id WHERE sp.student_id = ? ORDER BY sp.last_practiced_at DESC`).all(req.params.id); res.json(progress); }
  catch (err) { res.status(500).json({ error: 'Failed to get progress.' }); }
});

// Batches
router.get('/batches', (req, res) => {
  try { const batches = db.prepare('SELECT b.*, COUNT(u.id) as student_count FROM batches b LEFT JOIN users u ON u.batch_id = b.id AND u.role = \'student\' GROUP BY b.id ORDER BY b.created_at DESC').all(); res.json(batches); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch batches.' }); }
});

router.post('/batches', (req, res) => {
  try { const { name, description } = req.body; if (!name) return res.status(400).json({ error: 'Batch name required.' }); const result = db.prepare('INSERT INTO batches (name, description) VALUES (?, ?)').run(name, description || null); res.status(201).json(db.prepare('SELECT * FROM batches WHERE id = ?').get(result.lastInsertRowid)); }
  catch (err) { res.status(500).json({ error: 'Failed to create batch.' }); }
});

router.put('/batches/:id', (req, res) => {
  try { const { name, description } = req.body; db.prepare('UPDATE batches SET name = ?, description = ? WHERE id = ?').run(name, description || null, req.params.id); res.json(db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id)); }
  catch (err) { res.status(500).json({ error: 'Failed to update batch.' }); }
});

router.delete('/batches/:id', (req, res) => {
  try { db.prepare('DELETE FROM batches WHERE id = ?').run(req.params.id); res.json({ message: 'Batch deleted.' }); }
  catch (err) { res.status(500).json({ error: 'Failed to delete batch.' }); }
});

// Listening Items
router.get('/items', (req, res) => {
  try {
    const { category, difficulty, active, search, has_audio } = req.query;
    let query = 'SELECT * FROM listening_items WHERE 1=1'; const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (difficulty) { query += ' AND difficulty = ?'; params.push(difficulty); }
    if (active !== undefined) { query += ' AND active = ?'; params.push(active === 'true' ? 1 : 0); }
    if (search) { query += ' AND (correct_text LIKE ? OR tags LIKE ? OR note LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (has_audio === 'true') { query += ' AND (british_audio_path IS NOT NULL OR australian_audio_path IS NOT NULL OR teacher_audio_path IS NOT NULL)'; }
    if (has_audio === 'false') { query += ' AND british_audio_path IS NULL AND australian_audio_path IS NULL AND teacher_audio_path IS NULL'; }
    query += ' ORDER BY created_at DESC';
    res.json(db.prepare(query).all(...params));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch items.' }); }
});

router.get('/items/:id', (req, res) => {
  try { const item = db.prepare('SELECT * FROM listening_items WHERE id = ?').get(req.params.id); if (!item) return res.status(404).json({ error: 'Item not found.' }); res.json(item); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch item.' }); }
});

router.post('/items', audioUpload.fields([{ name: 'british_audio', maxCount: 1 }, { name: 'australian_audio', maxCount: 1 }, { name: 'teacher_audio', maxCount: 1 }]), (req, res) => {
  try {
    const { category, difficulty, correct_text, bangla_meaning, note, tags, tts_enabled, punctuation_mode, capitalization_mode, replay_limit, xp_value, active } = req.body;
    if (!category || !correct_text) return res.status(400).json({ error: 'Category and correct text required.' });
    const normalized = normalizeText(correct_text, { punctuationMode: punctuation_mode || 'flexible', capitalizationMode: capitalization_mode || 'flexible' });
    const britishPath = req.files?.british_audio?.[0]?.filename || null;
    const australianPath = req.files?.australian_audio?.[0]?.filename || null;
    const teacherPath = req.files?.teacher_audio?.[0]?.filename || null;
    const result = db.prepare('INSERT INTO listening_items (category, difficulty, correct_text, normalized_text, bangla_meaning, note, tags, british_audio_path, australian_audio_path, teacher_audio_path, tts_enabled, punctuation_mode, capitalization_mode, replay_limit, xp_value, active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(category, difficulty || 'medium', correct_text, normalized, bangla_meaning || null, note || null, tags || null, britishPath, australianPath, teacherPath, tts_enabled !== undefined ? (tts_enabled === 'true' || tts_enabled === '1' ? 1 : 0) : 1, punctuation_mode || 'flexible', capitalization_mode || 'flexible', replay_limit ? parseInt(replay_limit) : null, xp_value ? parseInt(xp_value) : 10, active !== undefined ? (active === 'true' || active === '1' ? 1 : 0) : 1, req.user.id);
    res.status(201).json(db.prepare('SELECT * FROM listening_items WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) { res.status(500).json({ error: 'Failed to create item.' }); }
});

router.put('/items/:id', audioUpload.fields([{ name: 'british_audio', maxCount: 1 }, { name: 'australian_audio', maxCount: 1 }, { name: 'teacher_audio', maxCount: 1 }]), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM listening_items WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Item not found.' });
    const { category, difficulty, correct_text, bangla_meaning, note, tags, tts_enabled, punctuation_mode, capitalization_mode, replay_limit, xp_value, active } = req.body;
    const text = correct_text || existing.correct_text;
    const pm = punctuation_mode || existing.punctuation_mode;
    const cm = capitalization_mode || existing.capitalization_mode;
    const normalized = normalizeText(text, { punctuationMode: pm, capitalizationMode: cm });
    const britishPath = req.files?.british_audio?.[0]?.filename || existing.british_audio_path;
    const australianPath = req.files?.australian_audio?.[0]?.filename || existing.australian_audio_path;
    const teacherPath = req.files?.teacher_audio?.[0]?.filename || existing.teacher_audio_path;
    db.prepare('UPDATE listening_items SET category=?, difficulty=?, correct_text=?, normalized_text=?, bangla_meaning=?, note=?, tags=?, british_audio_path=?, australian_audio_path=?, teacher_audio_path=?, tts_enabled=?, punctuation_mode=?, capitalization_mode=?, replay_limit=?, xp_value=?, active=?, updated_at=datetime(\'now\') WHERE id=?').run(category || existing.category, difficulty || existing.difficulty, text, normalized, bangla_meaning !== undefined ? bangla_meaning : existing.bangla_meaning, note !== undefined ? note : existing.note, tags !== undefined ? tags : existing.tags, britishPath, australianPath, teacherPath, tts_enabled !== undefined ? (tts_enabled === 'true' || tts_enabled === '1' ? 1 : 0) : existing.tts_enabled, pm, cm, replay_limit ? parseInt(replay_limit) : existing.replay_limit, xp_value ? parseInt(xp_value) : existing.xp_value, active !== undefined ? (active === 'true' || active === '1' ? 1 : 0) : existing.active, req.params.id);
    res.json(db.prepare('SELECT * FROM listening_items WHERE id = ?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: 'Failed to update item.' }); }
});

router.delete('/items/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM listening_items WHERE id = ?').get(req.params.id);
    if (item) { [item.british_audio_path, item.australian_audio_path, item.teacher_audio_path].forEach(p => { if (p) try { fs.unlinkSync(path.join(__dirname, '../../uploads/audio', p)); } catch(e) {} }); }
    db.prepare('DELETE FROM listening_items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Item deleted.' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete item.' }); }
});

router.post('/items/bulk-delete', (req, res) => {
  try { const { ids } = req.body; if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided.' }); db.prepare(`DELETE FROM listening_items WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); res.json({ message: `${ids.length} items deleted.` }); }
  catch (err) { res.status(500).json({ error: 'Failed to bulk delete.' }); }
});

// Assignments
router.get('/assignments', (req, res) => {
  try { res.json(db.prepare('SELECT a.*, b.name as batch_name, u.name as student_name FROM assignments a LEFT JOIN batches b ON b.id = a.batch_id LEFT JOIN users u ON u.id = a.student_id ORDER BY a.created_at DESC').all()); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch assignments.' }); }
});

router.post('/assignments', (req, res) => {
  try {
    const { title, description, batch_id, student_id, category, difficulty, due_date, daily_target, require_recording, item_ids } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required.' });
    const result = db.prepare('INSERT INTO assignments (title, description, batch_id, student_id, category, difficulty, due_date, daily_target, require_recording) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(title, description || null, batch_id || null, student_id || null, category || null, difficulty || null, due_date || null, daily_target || 10, require_recording ? 1 : 0);
    if (item_ids && item_ids.length) { const stmt = db.prepare('INSERT INTO assignment_items (assignment_id, item_id) VALUES (?, ?)'); for (const itemId of item_ids) { stmt.run(result.lastInsertRowid, itemId); } }
    res.status(201).json({ id: result.lastInsertRowid, message: 'Assignment created.' });
  } catch (err) { res.status(500).json({ error: 'Failed to create assignment.' }); }
});

router.delete('/assignments/:id', (req, res) => {
  try { db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id); res.json({ message: 'Assignment deleted.' }); }
  catch (err) { res.status(500).json({ error: 'Failed to delete assignment.' }); }
});

// Settings
router.get('/settings', (req, res) => {
  try { const settings = db.prepare('SELECT * FROM settings').all(); const obj = {}; settings.forEach(s => { obj[s.key] = s.value; }); res.json(obj); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch settings.' }); }
});

router.put('/settings', (req, res) => {
  try { const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))'); for (const [key, value] of Object.entries(req.body)) { stmt.run(key, String(value)); } res.json({ message: 'Settings updated.' }); }
  catch (err) { res.status(500).json({ error: 'Failed to update settings.' }); }
});

// Reports
router.get('/reports/accuracy', (req, res) => {
  try { res.json(db.prepare(`SELECT u.id, u.name, u.email, COUNT(pa.id) as total_attempts, SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as correct, ROUND(AVG(CASE WHEN pa.is_correct = 1 THEN 100.0 ELSE 0.0 END), 1) as accuracy FROM users u LEFT JOIN practice_attempts pa ON pa.student_id = u.id WHERE u.role = 'student' GROUP BY u.id ORDER BY accuracy DESC`).all()); }
  catch (err) { res.status(500).json({ error: 'Failed to get report.' }); }
});

router.get('/reports/difficult-items', (req, res) => {
  try { res.json(db.prepare(`SELECT li.id, li.correct_text, li.category, li.difficulty, COUNT(pa.id) as total_attempts, SUM(CASE WHEN pa.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count, ROUND(AVG(CASE WHEN pa.is_correct = 0 THEN 100.0 ELSE 0.0 END), 1) as error_rate FROM listening_items li JOIN practice_attempts pa ON pa.item_id = li.id GROUP BY li.id HAVING total_attempts > 0 ORDER BY error_rate DESC LIMIT 50`).all()); }
  catch (err) { res.status(500).json({ error: 'Failed to get report.' }); }
});

module.exports = router;
