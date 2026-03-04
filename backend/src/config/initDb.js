const bcrypt = require('bcryptjs');
const pool = require('./db');

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(80) NOT NULL,
      email VARCHAR(160),
      first_name VARCHAR(120),
      last_name VARCHAR(120),
      address TEXT,
      contact_number VARCHAR(40),
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      body TEXT NOT NULL,
      category VARCHAR(60) NOT NULL DEFAULT 'general',
      severity VARCHAR(20) NOT NULL DEFAULT 'medium',
      posted_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      body TEXT NOT NULL,
      posted_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email VARCHAR(160);

    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(120);

    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(120);

    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS address TEXT;

    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(40);

    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_username_key;

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
    ON users (LOWER(email))
    WHERE email IS NOT NULL;
  `);

  const username = 'admin';
  const email = 'admin@cddrmd.local';
  const password = 'Admin@123';

  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [username, email, passwordHash, 'admin'],
    );
  } else {
    await pool.query('UPDATE users SET email = COALESCE(email, $1) WHERE username = $2', [email, username]);
  }
}

module.exports = initDb;
