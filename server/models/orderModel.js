const db = require('../config/db');

const create = (user_id, total, payment_method = 'cod', payment_status = 'pending', payment_id = null) =>
  db.query(
    'INSERT INTO orders (user_id, total, payment_method, payment_status, payment_id) VALUES (?, ?, ?, ?, ?)',
    [user_id, total, payment_method, payment_status, payment_id]
  );

const addItems = (orderItems) => {
  const promises = orderItems.map(item =>
    db.query(
      'INSERT INTO order_items (order_id, product_id, variant_id, variant_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
      item
    )
  );
  return Promise.all(promises);
};

const findByUser = (user_id) =>
  db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id]);

const findItemsByOrder = (order_id) =>
  db.query(
    `SELECT oi.*, p.name, p.image_url,
      COALESCE(pv.image_url, p.image_url) AS display_image,
      oi.variant_name
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN product_variants pv ON oi.variant_id = pv.id
     WHERE oi.order_id = ?`,
    [order_id]
  );

module.exports = { create, addItems, findByUser, findItemsByOrder };
