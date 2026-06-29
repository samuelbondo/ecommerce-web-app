const db = require('../config/db');

const findAll = () => db.query('SELECT * FROM categories');

module.exports = { findAll };
