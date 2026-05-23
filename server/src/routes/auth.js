const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(email, 'active');
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = generateToken(user);
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) { res.status(500).json({ error: 'Login failed.' }); }
});

router.post('/register', (req, res) => {
  try {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'self_registration_enabled'").get();
    if (!setting || setting.value !== '1') return res.status(403).json({ error: 'Self-registration is disabled.' });
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required.' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(name, email, phone || null, passwordHash, 'student');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);
    const { password_hash, ...userData } = user;
    res.status(201).json({ token, user: userData });
  } catch (err) { res.status(500).json({ error: 'Registration failed.' }); }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { password_hash, ...userData } = user;
    res.json(userData);
  } catch (err) { res.status(500).json({ error: 'Failed to get user.' }); }
});

module.exports = router;
