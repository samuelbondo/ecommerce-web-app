const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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
  const { name, description, price, stock, image_url, category_id, featured, visible } = req.body;
  try {
    const [r] = await db.query('INSERT INTO products (name,description,price,stock,image_url,category_id,featured,visible) VALUES (?,?,?,?,?,?,?,?)', [name, description, price, stock, image_url || '', category_id, featured ? 1 : 0, visible === false ? 0 : 1]);
    res.status(201).json({ id: r.insertId, message: 'Product created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids?.length) return res.status(400).json({ error: 'ids required' });
  try {
    await db.query(`DELETE FROM products WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
    res.json({ message: 'Products deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/products/:id/duplicate', async (req, res) => {
  try {
    const [[p]] = await db.query('SELECT * FROM products WHERE id=?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Not found' });
    const [r] = await db.query('INSERT INTO products (name,description,price,stock,image_url,category_id,featured,visible) VALUES (?,?,?,?,?,?,?,?)', [`${p.name} (Copy)`, p.description, p.price, p.stock, p.image_url, p.category_id, p.featured, p.visible]);
    res.status(201).json({ id: r.insertId, message: 'Product duplicated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id', async (req, res) => {
  const { name, description, price, stock, image_url, category_id, featured, visible } = req.body;
  try {
    await db.query('UPDATE products SET name=?,description=?,price=?,stock=?,image_url=?,category_id=?,featured=?,visible=? WHERE id=?', [name, description, price, stock, image_url, category_id, featured ? 1 : 0, visible === false ? 0 : 1, req.params.id]);
    res.json({ message: 'Product updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id/visible', async (req, res) => {
  const { visible } = req.body;
  try {
    await db.query('UPDATE products SET visible=? WHERE id=?', [visible ? 1 : 0, req.params.id]);
    res.json({ message: 'Visibility updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Product Images ─────────────────────────────────────
router.get('/products/:id/images', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order ASC, id ASC', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/products/:id/images', async (req, res) => {
  const { url, is_primary, sort_order } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    if (is_primary) await db.query('UPDATE product_images SET is_primary=0 WHERE product_id=?', [req.params.id]);
    const [r] = await db.query('INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES (?,?,?,?)',
      [req.params.id, url, sort_order || 0, is_primary ? 1 : 0]);
    // If first image, also set as product primary image_url
    const [[count]] = await db.query('SELECT COUNT(*) AS c FROM product_images WHERE product_id=?', [req.params.id]);
    if (count.c === 1 || is_primary) await db.query('UPDATE products SET image_url=? WHERE id=?', [url, req.params.id]);
    res.status(201).json({ id: r.insertId, message: 'Image added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id/images/reorder', async (req, res) => {
  const { order } = req.body; // array of { id, sort_order }
  try {
    for (const item of order) await db.query('UPDATE product_images SET sort_order=? WHERE id=? AND product_id=?', [item.sort_order, item.id, req.params.id]);
    res.json({ message: 'Reordered' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/products/:productId/images/:imageId', async (req, res) => {
  try {
    await db.query('DELETE FROM product_images WHERE id=? AND product_id=?', [req.params.imageId, req.params.productId]);
    // Update product image_url to next primary
    const [[first]] = await db.query('SELECT url FROM product_images WHERE product_id=? ORDER BY sort_order ASC, id ASC LIMIT 1', [req.params.productId]);
    if (first) await db.query('UPDATE products SET image_url=? WHERE id=?', [first.url, req.params.productId]);
    res.json({ message: 'Image deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Product Options & Variants ─────────────────────────
router.get('/products/:id/options', async (req, res) => {
  try {
    const [options] = await db.query('SELECT * FROM product_options WHERE product_id=? ORDER BY sort_order ASC', [req.params.id]);
    res.json(options);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/products/:id/options', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const [r] = await db.query('INSERT INTO product_options (product_id, name) VALUES (?,?)', [req.params.id, name]);
    res.status(201).json({ id: r.insertId, message: 'Option added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/products/:productId/options/:optionId', async (req, res) => {
  try {
    await db.query('DELETE FROM product_options WHERE id=? AND product_id=?', [req.params.optionId, req.params.productId]);
    res.json({ message: 'Option deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/products/:id/variants', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM product_variants WHERE product_id=? ORDER BY id ASC', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/products/:id/variants', async (req, res) => {
  const { combination, price, stock, sku, image_url, description } = req.body;
  if (!combination) return res.status(400).json({ error: 'combination required' });
  try {
    const [r] = await db.query(
      'INSERT INTO product_variants (product_id, combination, price, stock, sku, image_url, description) VALUES (?,?,?,?,?,?,?)',
      [req.params.id, combination, price || null, stock ?? null, sku || null, image_url || null, description || null]
    );
    res.status(201).json({ id: r.insertId, message: 'Variant added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:productId/variants/:variantId', async (req, res) => {
  const { combination, price, stock, sku, image_url, description } = req.body;
  try {
    await db.query(
      'UPDATE product_variants SET combination=?, price=?, stock=?, sku=?, image_url=?, description=? WHERE id=? AND product_id=?',
      [combination, price || null, stock ?? null, sku || null, image_url || null, description || null, req.params.variantId, req.params.productId]
    );
    res.json({ message: 'Variant updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    await db.query('DELETE FROM product_variants WHERE id=? AND product_id=?', [req.params.variantId, req.params.productId]);
    res.json({ message: 'Variant deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id/featured', async (req, res) => {
  const { featured } = req.body;
  try {
    await db.query('UPDATE products SET featured=? WHERE id=?', [featured ? 1 : 0, req.params.id]);
    res.json({ message: 'Featured updated' });
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
    const [orders] = await db.query('SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.address AS shipping_address, u.city AS shipping_city, u.country AS shipping_country FROM orders o LEFT JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC');
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

router.put('/orders/bulk-status', async (req, res) => {
  const { ids, status } = req.body;
  if (!ids?.length || !status) return res.status(400).json({ error: 'ids and status required' });
  try {
    await db.query(`UPDATE orders SET status=? WHERE id IN (${ids.map(() => '?').join(',')})`, [status, ...ids]);
    res.json({ message: 'Bulk status updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM order_items WHERE order_id=?', [req.params.id]);
    await db.query('DELETE FROM orders WHERE id=?', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Customers ──────────────────────────────────────────
router.get('/customers', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT u.id, u.name, u.email, u.phone, u.address, u.city, u.country, u.role, u.status, u.avatar, u.admin_notes, u.created_at, u.last_login, COUNT(o.id) AS total_orders, COALESCE(SUM(o.total),0) AS total_spent FROM users u LEFT JOIN orders o ON u.id=o.user_id GROUP BY u.id ORDER BY u.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const [[user]] = await db.query(`SELECT u.id, u.name, u.email, u.phone, u.address, u.city, u.country, u.role, u.status, u.avatar, u.admin_notes, u.created_at, u.last_login, COUNT(o.id) AS total_orders, COALESCE(SUM(o.total),0) AS total_spent FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.id=? GROUP BY u.id`, [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [orders] = await db.query(`SELECT o.id, o.total, o.status, o.created_at FROM orders o WHERE o.user_id=? ORDER BY o.created_at DESC LIMIT 10`, [req.params.id]);
    res.json({ ...user, orders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/customers/:id', async (req, res) => {
  const { name, email, phone, address, city, country, role, status } = req.body;
  try {
    await db.query('UPDATE users SET name=?,email=?,phone=?,address=?,city=?,country=?,role=?,status=? WHERE id=?', [name, email, phone, address, city, country, role, status, req.params.id]);
    res.json({ message: 'User updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/customers/:id/notes', async (req, res) => {
  const { notes } = req.body;
  try {
    await db.query('UPDATE users SET admin_notes=? WHERE id=?', [notes, req.params.id]);
    res.json({ message: 'Notes saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/customers/:id/avatar', async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: 'No avatar provided' });
  if (avatar.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'Image too large. Max 1.5MB.' });
  try {
    await db.query('UPDATE users SET avatar=? WHERE id=?', [avatar, req.params.id]);
    res.json({ message: 'Avatar updated', avatar });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/customers/:id/role', async (req, res) => {
  const { role } = req.body;
  try {
    await db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
    res.json({ message: 'Role updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/customers/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE users SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
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

router.post('/customers/:id/send-reset-link', async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT id, name, email FROM users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('UPDATE otp_codes SET used=1 WHERE email=? AND used=0', [user.email]);
    await db.query('INSERT INTO otp_codes (email, code, expires_at) VALUES (?,?,?)', [user.email, code, expiresAt]);
    await resend.emails.send({
      from: `Samuel Store <${process.env.MAIL_FROM}>`,
      to: user.email,
      subject: 'Your Samuel Store password reset code',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fb;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><div style="display:inline-block;background:#e94560;color:#fff;font-weight:800;font-size:1.3rem;padding:10px 20px;border-radius:10px;">Samuel Store</div></div><h2 style="color:#1a1a2e;">Password Reset Request</h2><p style="color:#555;">Hi <strong>${user.name}</strong>, an admin has initiated a password reset. Use the code below — it expires in <strong>10 minutes</strong>.</p><div style="background:#fff;border:2px solid #e94560;border-radius:10px;padding:28px;text-align:center;margin:24px 0;"><div style="font-size:0.8rem;color:#888;margin-bottom:8px;letter-spacing:2px;text-transform:uppercase;">Your verification code</div><span style="font-size:2.8rem;font-weight:800;letter-spacing:14px;color:#1a1a2e;">${code}</span></div><p style="color:#888;font-size:0.85rem;">If you did not request this, you can safely ignore this email.</p></div>`,
    });
    res.json({ message: `Reset link sent to ${user.email}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ message: 'User deleted' });
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

// ── Live Chat ─────────────────────────────────────────────────────────────────────────────
router.get('/conversations', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.name AS user_name, u.email AS user_email,
        (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id=c.id) AS message_count,
        (SELECT content FROM conversation_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM conversations c LEFT JOIN users u ON c.user_id=u.id
      ORDER BY c.updated_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM conversation_messages WHERE conversation_id=? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/conversations/:id/takeover', async (req, res) => {
  try {
    await db.query('UPDATE conversations SET status=?, admin_id=? WHERE id=?', ['taken_over', req.user.id, req.params.id]);
    res.json({ message: 'Taken over' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/conversations/:id/release', async (req, res) => {
  try {
    await db.query('UPDATE conversations SET status=?, admin_id=NULL WHERE id=?', ['open', req.params.id]);
    res.json({ message: 'Released back to AI' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/conversations/:id/reply', async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  try {
    await db.query('INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?,?,?)', [req.params.id, 'admin', content.trim()]);
    await db.query('UPDATE conversations SET updated_at=NOW() WHERE id=?', [req.params.id]);
    res.json({ message: 'Reply sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/conversations/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM conversations WHERE id=?', [req.params.id]);
    res.json({ message: 'Conversation deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
