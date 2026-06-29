const db = require('../config/db');

const findByUser = (user_id) =>
  db.query(
    'SELECT c.id, c.quantity, p.id AS product_id, p.name, p.price, p.image_url FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?',
    [user_id]
  );

const findItem = (user_id, product_id) =>
  db.query('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id]);

const addItem = (user_id, product_id, quantity) =>
  db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [user_id, product_id, quantity]);

const updateQuantity = (id, quantity) =>
  db.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity, id]);

const removeItem = (id) => db.query('DELETE FROM cart WHERE id = ?', [id]);

const clearByUser = (user_id) => db.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

module.exports = { findByUser, findItem, addItem, updateQuantity, removeItem, clearByUser };
