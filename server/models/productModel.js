const db = require('../config/db');

const findAll = () =>
  db.query('SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id');

const findById = (id) =>
  db.query('SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);

module.exports = { findAll, findById };
