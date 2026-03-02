const pool = require('../config/db');

async function getAlerts(req, res) {
  const result = await pool.query(
    'SELECT id, title, body, category, severity, created_at FROM alerts ORDER BY created_at DESC LIMIT 50',
  );
  return res.json(result.rows);
}

async function createAlert(req, res) {
  const { title, body, category, severity } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: 'Title and body are required.' });
  }

  const result = await pool.query(
    `INSERT INTO alerts (title, body, category, severity, posted_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, body, category, severity, created_at`,
    [title, body, category || 'general', severity || 'medium', req.user.userId],
  );

  return res.status(201).json(result.rows[0]);
}

async function getAnnouncements(req, res) {
  const result = await pool.query(
    'SELECT id, title, body, created_at FROM announcements ORDER BY created_at DESC LIMIT 50',
  );
  return res.json(result.rows);
}

async function createAnnouncement(req, res) {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: 'Title and body are required.' });
  }

  const result = await pool.query(
    `INSERT INTO announcements (title, body, posted_by)
     VALUES ($1, $2, $3)
     RETURNING id, title, body, created_at`,
    [title, body, req.user.userId],
  );

  return res.status(201).json(result.rows[0]);
}

module.exports = {
  getAlerts,
  createAlert,
  getAnnouncements,
  createAnnouncement,
};
