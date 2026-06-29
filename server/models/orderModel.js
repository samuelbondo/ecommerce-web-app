const db = require('../config/db');

const create = (user_id, total) =>
  db.query('INSERT INTO orders (user_id, total) VALUES (?, ?)', [user_id, total]);

const addItems = (orderItems) =>
  db.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?', [orderItems]);

const findByUser = (user_id) =>
  db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id]);

const findItemsByOrder = (order_id) =>
  db.query(
    'SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
    [order_id]
  );

module.exports = { create, addItems, findByUser, findItemsByOrder };
