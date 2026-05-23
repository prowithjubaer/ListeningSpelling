const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const importExportRoutes = require('./routes/import-export');

const app = express();
const PORT = process.env.PORT || 5000;
initializeDatabase();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts.' } }));
app.use('/uploads/audio', express.static(path.join(__dirname, '../uploads/audio')));
app.use('/uploads/recordings', express.static(path.join(__dirname, '../uploads/recordings')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/import-export', importExportRoutes);

const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => { if (!req.path.startsWith('/api')) res.sendFile(path.join(clientBuildPath, 'index.html')); });

app.listen(PORT, () => { console.log(`🎓 Pro English BD Server running on port ${PORT}`); console.log(`📚 ঠান্ডা মাথায় ইংলিশ শিখি!`); });
module.exports = app;
