const db = require('../config/db');

const findByEmail = (email) => db.query('SELECT * FROM users WHERE email = ?', [email]);

const create = (name, email, hashedPassword) =>
  db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

const updateLastLogin = (id) => db.query('UPDATE users SET last_login=NOW() WHERE id=?', [id]);

module.exports = { findByEmail, create, updateLastLogin };
