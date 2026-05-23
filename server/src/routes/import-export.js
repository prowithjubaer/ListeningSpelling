const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { normalizeText } = require('../utils/normalize');
const router = express.Router();
router.use(authenticateToken, requireAdmin);
const upload = multer({ dest: '/tmp/imports/', limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/import/csv', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const content = fs.readFileSync(req.file.path, 'utf-8'); fs.unlinkSync(req.file.path);
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    const errors = [], valid = [];
    const validCategories = ['ielts', 'phrase', 'sentence', 'passage'];
    records.forEach((row, index) => {
      const rowNum = index + 2;
      if (!row.correct_text) { errors.push({ row: rowNum, error: 'Missing correct_text' }); return; }
      if (!row.category || !validCategories.includes(row.category)) { errors.push({ row: rowNum, error: `Invalid category: ${row.category}` }); return; }
      valid.push({ category: row.category, difficulty: row.difficulty || 'medium', correct_text: row.correct_text, note: row.note || null, tags: row.tags || null, punctuation_mode: row.punctuation_mode || 'flexible', capitalization_mode: row.capitalization_mode || 'flexible', active: row.active !== '0' && row.active !== 'false' ? 1 : 0 });
    });
    if (req.query.preview === 'true') return res.json({ total: records.length, valid: valid.length, errors, preview: valid.slice(0, 10) });
    const stmt = db.prepare('INSERT INTO listening_items (category, difficulty, correct_text, normalized_text, note, tags, tts_enabled, punctuation_mode, capitalization_mode, active, created_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)');
    let imported = 0;
    for (const item of valid) { const normalized = normalizeText(item.correct_text, { punctuationMode: item.punctuation_mode, capitalizationMode: item.capitalization_mode }); stmt.run(item.category, item.difficulty, item.correct_text, normalized, item.note, item.tags, item.punctuation_mode, item.capitalization_mode, item.active, req.user.id); imported++; }
    res.json({ message: `Imported ${imported} items.`, errors, total: records.length, imported });
  } catch (err) { res.status(500).json({ error: 'Import failed: ' + err.message }); }
});

router.post('/import/xlsx', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(req.file.path); fs.unlinkSync(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const records = XLSX.utils.sheet_to_json(sheet);
    const errors = [], valid = [];
    records.forEach((row, index) => {
      if (!row.correct_text) { errors.push({ row: index + 2, error: 'Missing correct_text' }); return; }
      if (!row.category || !['ielts', 'phrase', 'sentence', 'passage'].includes(row.category)) { errors.push({ row: index + 2, error: 'Invalid category' }); return; }
      valid.push({ category: row.category, difficulty: row.difficulty || 'medium', correct_text: String(row.correct_text), note: row.note || null, tags: row.tags || null, punctuation_mode: row.punctuation_mode || 'flexible', capitalization_mode: row.capitalization_mode || 'flexible', active: row.active !== 0 && row.active !== '0' ? 1 : 0 });
    });
    if (req.query.preview === 'true') return res.json({ total: records.length, valid: valid.length, errors, preview: valid.slice(0, 10) });
    const stmt = db.prepare('INSERT INTO listening_items (category, difficulty, correct_text, normalized_text, note, tags, tts_enabled, punctuation_mode, capitalization_mode, active, created_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)');
    let imported = 0;
    for (const item of valid) { const normalized = normalizeText(item.correct_text, { punctuationMode: item.punctuation_mode, capitalizationMode: item.capitalization_mode }); stmt.run(item.category, item.difficulty, item.correct_text, normalized, item.note, item.tags, item.punctuation_mode, item.capitalization_mode, item.active, req.user.id); imported++; }
    res.json({ message: `Imported ${imported} items.`, errors, total: records.length, imported });
  } catch (err) { res.status(500).json({ error: 'Import failed: ' + err.message }); }
});

router.get('/export/items', (req, res) => {
  try { const items = db.prepare('SELECT * FROM listening_items ORDER BY category, id').all(); const csvData = stringify(items.map(i => ({ category: i.category, difficulty: i.difficulty, correct_text: i.correct_text, note: i.note || '', tags: i.tags || '', punctuation_mode: i.punctuation_mode, capitalization_mode: i.capitalization_mode, active: i.active ? 'true' : 'false' })), { header: true }); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename=listening_items_export.csv'); res.send(csvData); }
  catch (err) { res.status(500).json({ error: 'Export failed.' }); }
});

router.get('/export/progress', (req, res) => {
  try { const data = db.prepare('SELECT u.name, u.email, li.correct_text, li.category, sp.status, sp.correct_count, sp.wrong_count, sp.total_attempts, sp.last_practiced_at FROM student_progress sp JOIN users u ON u.id = sp.student_id JOIN listening_items li ON li.id = sp.item_id ORDER BY u.name, li.category').all(); const csvData = stringify(data, { header: true }); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename=progress_export.csv'); res.send(csvData); }
  catch (err) { res.status(500).json({ error: 'Export failed.' }); }
});

module.exports = router;
