// server.js

require('dotenv').config();
console.log('SMTP HOST:', process.env.SMTP_HOST);
console.log('SMTP PORT:', process.env.SMTP_PORT);
console.log('SMTP SECURE:', process.env.SMTP_SECURE);
console.log('SMTP USER:', process.env.SMTP_USER);
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

// --- CONFIG / ENV ---
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5500';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_for_prod';
const JWT_EXPIRES = '7d';
const BCRYPT_SALT_ROUNDS = 10;

// --- MIDDLEWARE ---
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// --- DB ---
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'projet_mastere'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Promise wrapper
const dbp = db.promise();

// --- SMTP transporter ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


// ----------------- Public API endpoints -----------------

app.get('/competences', (req, res) => {
  db.query('SELECT * FROM competences', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.get('/documents', (req, res) => {
  const query = `
    SELECT d.id, d.title, d.content, dt.name as type, u.username as uploaded_by
    FROM documents d
    JOIN document_types dt ON d.document_type_id = dt.id
    JOIN users u ON d.uploaded_by = u.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.get('/forum', (req, res) => {
  const query = `
    SELECT f.id, f.title, f.message, u.username
    FROM forum f
    JOIN users u ON f.user_id = u.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.get('/curriculum', (req, res) => {
  db.query('SELECT * FROM curriculum ORDER BY FIELD(niveau,"M1","M2"), FIELD(semestre,"S1","S2","S3","S4")', (err, results) => {
    if (err) return res.status(500).json(err);

    const curriculum = {};
    results.forEach(row => {
      if (!curriculum[row.niveau]) curriculum[row.niveau] = {};
      if (!curriculum[row.niveau][row.semestre]) curriculum[row.niveau][row.semestre] = [];
      curriculum[row.niveau][row.semestre].push({
        code: row.code,
        title: row.title,
        credits: row.credits
      });
    });

    res.json(curriculum);
  });
});

// --- New route: /api/resources ---
app.get('/api/resources', (req, res) => {
  // Replace 'resources' with your actual table name
  db.query('SELECT * FROM resources', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    res.json(results);
  });
});

// ----------------- AUTH helpers & routes -----------------
function authMiddleware(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// REGISTER
app.post('/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, studentId, year, isAlumni, userType } = req.body;
    if (!firstName || !lastName || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

    const [existing] = await dbp.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const [result] = await dbp.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, student_id, year, is_alumni, user_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, password_hash, studentId || null, year || 'M1', isAlumni ? 1 : 0, userType || (isAlumni ? 'alumni' : 'current')]
    );

    const user = { id: result.insertId, firstName, lastName, email, studentId, year, isAlumni: !!isAlumni, userType };

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'student' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const [rows] = await dbp.query('SELECT id, first_name, last_name, email, password_hash, role, user_type, is_alumni FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenPayload = { id: user.id, email: user.email, role: user.role || 'student' };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role, userType: user.user_type, isAlumni: !!user.is_alumni } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGOUT
app.post('/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ ok: true });
});

// ----------------- Forgot password -----------------

// 1. Request reset code
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const [rows] = await dbp.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (!rows.length) return res.status(404).json({ error: 'Email not found' });

  const userId = rows[0].id;
  const resetCode = crypto.randomInt(100000, 999999).toString(); // 6-digit code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

  await dbp.query(
    'INSERT INTO forgot_password_requests (user_id, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code=?, expires_at=?',
    [userId, resetCode, expiresAt, resetCode, expiresAt]
  );

  try {
    await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Votre code de réinitialisation',
      text: `Votre code pour réinitialiser votre mot de passe est : ${resetCode}`,
      html: `<p>Votre code pour réinitialiser votre mot de passe est : <b>${resetCode}</b></p>`
    });

    res.json({ ok: true, message: 'Code envoyé par email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible d’envoyer le code' });
  }
});

// 2. Verify code
app.post('/auth/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email et code requis' });

  const [rows] = await dbp.query(`
    SELECT f.user_id, f.expires_at FROM forgot_password_requests f
    JOIN users u ON f.user_id = u.id
    WHERE u.email = ? AND f.code = ?
  `, [email, code]);

  if (!rows.length) return res.status(400).json({ error: 'Code invalide' });

  const expiresAt = new Date(rows[0].expires_at);
  if (expiresAt < new Date()) return res.status(400).json({ error: 'Code expiré' });

  res.json({ ok: true, userId: rows[0].user_id });
});

// 3. Reset password
app.post('/auth/reset-password', async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) return res.status(400).json({ error: 'Champs manquants' });

  const hash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await dbp.query('UPDATE users SET password_hash=? WHERE id=?', [hash, userId]);
  await dbp.query('DELETE FROM forgot_password_requests WHERE user_id=?', [userId]); // remove used code

  res.json({ ok: true, message: 'Mot de passe réinitialisé avec succès' });
});

// ----------------- Start server -----------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
