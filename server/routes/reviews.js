const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/reviews/my — customer's own reviews
router.get('/my', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.status, r.admin_reply, r.created_at,
              p.id AS product_id, p.name AS product, p.image_url
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/reviews — submit a review (must have purchased the product)
router.post('/', authenticate, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  if (!product_id || !rating) return res.status(400).json({ error: 'product_id and rating required' });
  try {
    // Verify purchase
    const [[bought]] = await db.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
       LIMIT 1`,
      [req.user.id, product_id]
    );
    if (!bought) return res.status(403).json({ error: 'You can only review products you have purchased and received' });
    // One review per product per user
    const [[existing]] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );
    if (existing) return res.status(409).json({ error: 'You have already reviewed this product' });
    const [r] = await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?,?,?,?)',
      [req.user.id, product_id, rating, comment || '']
    );
    res.status(201).json({ id: r.insertId, message: 'Review submitted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/reviews/:id — edit own review
router.put('/:id', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    await db.query(
      'UPDATE reviews SET rating=?, comment=? WHERE id=? AND user_id=?',
      [rating, comment, req.params.id, req.user.id]
    );
    res.json({ message: 'Review updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/reviews/:id — delete own review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM reviews WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ message: 'Review deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
