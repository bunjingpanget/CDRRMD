const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function register(req, res) {
  const { username, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  if (!trimmedEmail.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [trimmedEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'Email already exists.' });
  }

  const rawUsername = String(username || '').trim();
  const finalUsername = rawUsername.length > 0 ? rawUsername : trimmedEmail.split('@')[0];

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
    [finalUsername, trimmedEmail, passwordHash, 'user'],
  );

  const user = result.rows[0];

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );

  return res.status(201).json({ token, user });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedIdentifier = String(email).trim();
  if (!normalizedIdentifier) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  let result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedIdentifier]);

  if (result.rows.length === 0) {
    result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [normalizedIdentifier]);
  }

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );

  return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
}

module.exports = { login, register };
