const db = require('../config/db');

const findAll = () =>
  db.query('SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.visible = 1');

const findById = (id) =>
  db.query('SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ? AND p.visible = 1', [id]);

const findImages = (product_id) =>
  db.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC', [product_id]);

const findOptions = (product_id) =>
  db.query('SELECT * FROM product_options WHERE product_id = ? ORDER BY sort_order ASC', [product_id]);

const findVariants = (product_id) =>
  db.query('SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC', [product_id]);

module.exports = { findAll, findById, findImages, findOptions, findVariants };
