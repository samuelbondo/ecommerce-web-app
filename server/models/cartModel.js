const db = require('../config/db');

const findByUser = (user_id) =>
  db.query(
    `SELECT c.id, c.quantity, c.variant_id,
      p.id AS product_id, p.name, p.price AS base_price, p.image_url,
      pv.price AS variant_price, pv.combination AS variant_name, pv.image_url AS variant_image_url,
      COALESCE(pv.price, p.price) AS price
     FROM cart c
     JOIN products p ON c.product_id = p.id
     LEFT JOIN product_variants pv ON c.variant_id = pv.id
     WHERE c.user_id = ?`,
    [user_id]
  );

const findItem = (user_id, product_id, variant_id) =>
  db.query(
    'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND (variant_id <=> ?)',
    [user_id, product_id, variant_id || null]
  );

const addItem = (user_id, product_id, quantity, variant_id) =>
  db.query(
    'INSERT INTO cart (user_id, product_id, quantity, variant_id) VALUES (?, ?, ?, ?)',
    [user_id, product_id, quantity, variant_id || null]
  );

const updateQuantity = (id, quantity) =>
  db.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity, id]);

const removeItem = (id) => db.query('DELETE FROM cart WHERE id = ?', [id]);

const clearByUser = (user_id) => db.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

module.exports = { findByUser, findItem, addItem, updateQuantity, removeItem, clearByUser };
