const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

// ── Stats ──────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [[{ revenue }]] = await db.query('SELECT COALESCE(SUM(total),0) AS revenue FROM orders');
    const [[{ orders }]] = await db.query('SELECT COUNT(*) AS orders FROM orders');
    const [[{ customers }]] = await db.query('SELECT COUNT(*) AS customers FROM users WHERE role="customer"');
    const [[{ products }]] = await db.query('SELECT COUNT(*) AS products FROM products');
    const [[{ categories }]] = await db.query('SELECT COUNT(*) AS categories FROM categories');
    const [[{ pending }]] = await db.query('SELECT COUNT(*) AS pending FROM orders WHERE status="pending"');
    const [[{ lowStock }]] = await db.query('SELECT COUNT(*) AS lowStock FROM products WHERE stock > 0 AND stock <= 5');
    const [[{ outOfStock }]] = await db.query('SELECT COUNT(*) AS outOfStock FROM products WHERE stock = 0');
    const [[{ todaySales }]] = await db.query('SELECT COALESCE(SUM(total),0) AS todaySales FROM orders WHERE DATE(created_at)=CURDATE()');
    const [[{ monthlySales }]] = await db.query('SELECT COALESCE(SUM(total),0) AS monthlySales FROM orders WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())');
    res.json({ revenue, orders, customers, products, categories, pending, lowStock, outOfStock, todaySales, monthlySales });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/monthly-revenue', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT DATE_FORMAT(created_at,'%b') AS month, MONTH(created_at) AS m, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY m, month ORDER BY m`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/top-products', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT p.id, p.name, p.image_url, COALESCE(SUM(oi.quantity),0) AS sold, COALESCE(SUM(oi.quantity*oi.price),0) AS revenue FROM products p LEFT JOIN order_items oi ON p.id=oi.product_id GROUP BY p.id ORDER BY sold DESC LIMIT 5`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Products ───────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id=c.id ORDER BY p.id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/products', async (req, res) => {
  const { name, description, price, stock, image_url, category_id, sku, featured } = req.body;
  try {
    const [r] = await db.query('INSERT INTO products (name,description,price,stock,image_url,category_id) VALUES (?,?,?,?,?,?)', [name, description, price, stock, image_url || '', category_id]);
    res.status(201).json({ id: r.insertId, message: 'Product created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id', async (req, res) => {
  const { name, description, price, stock, image_url, category_id } = req.body;
  try {
    await db.query('UPDATE products SET name=?,description=?,price=?,stock=?,image_url=?,category_id=? WHERE id=?', [name, description, price, stock, image_url, category_id, req.params.id]);
    res.json({ message: 'Product updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Categories ─────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT c.*, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON c.id=p.category_id GROUP BY c.id ORDER BY c.id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const [r] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ id: r.insertId, message: 'Category created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/categories/:id', async (req, res) => {
  const { name } = req.body;
  try {
    await db.query('UPDATE categories SET name=? WHERE id=?', [name, req.params.id]);
    res.json({ message: 'Category updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Orders ─────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o LEFT JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC');
    for (const o of orders) {
      const [items] = await db.query('SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id=p.id WHERE oi.order_id=?', [o.id]);
      o.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Customers ──────────────────────────────────────────
router.get('/customers', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT u.id, u.name, u.email, u.role, u.created_at, COUNT(o.id) AS total_orders, COALESCE(SUM(o.total),0) AS total_spent FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.role='customer' GROUP BY u.id ORDER BY u.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/customers/:id/role', async (req, res) => {
  const { role } = req.body;
  try {
    await db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
    res.json({ message: 'Customer role updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/customers/:id/reset-password', async (req, res) => {
  const { password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password=? WHERE id=?', [hashed, req.params.id]);
    res.json({ message: 'Password reset' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Settings ───────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT key_name, value FROM settings');
    const settings = Object.fromEntries(rows.map(r => [r.key_name, r.value]));
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings', async (req, res) => {
  const { settings } = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.query('INSERT INTO settings (key_name,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=?', [key, value, value]);
    }
    res.json({ message: 'Settings saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Low Stock ──────────────────────────────────────────
router.get('/inventory', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id=c.id ORDER BY p.stock ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/inventory/:id', async (req, res) => {
  const { stock } = req.body;
  try {
    await db.query('UPDATE products SET stock=? WHERE id=?', [stock, req.params.id]);
    res.json({ message: 'Stock updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Reviews ────────────────────────────────────────────
router.get('/reviews', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, u.name AS customer, p.name AS product, p.image_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/reviews/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE reviews SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Review status updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/reviews/:id/reply', async (req, res) => {
  const { reply } = req.body;
  try {
    await db.query('UPDATE reviews SET admin_reply=? WHERE id=?', [reply, req.params.id]);
    res.json({ message: 'Reply saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reviews WHERE id=?', [req.params.id]);
    res.json({ message: 'Review deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
