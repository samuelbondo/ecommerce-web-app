const router = require('express').Router();
const { getProducts, getProduct } = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

router.get('/', getProducts);
router.get('/:id', getProduct);

// GET approved reviews for a product (+ current user's own pending review)
router.get('/:id/reviews', async (req, res) => {
  try {
    const userId = req.headers.authorization
      ? (() => { try { const jwt = require('jsonwebtoken'); const t = req.headers.authorization.split(' ')[1]; return jwt.verify(t, process.env.JWT_SECRET).id; } catch { return null; } })()
      : null;

    const [rows] = await db.query(`
      SELECT r.id, r.rating, r.comment, r.admin_reply, r.created_at, r.status, u.name AS customer
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
        AND (r.status = 'approved' OR r.user_id = ?)
      ORDER BY r.created_at DESC
    `, [req.params.id, userId || 0]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST a review (must be logged in)
router.post('/:id/reviews', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment?.trim()) return res.status(400).json({ error: 'Rating and comment are required' });
  try {
    // Check if user already reviewed this product
    const [[existing]] = await db.query(
      'SELECT id FROM reviews WHERE product_id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (existing) return res.status(409).json({ error: 'You have already reviewed this product' });

    await db.query(
      "INSERT INTO reviews (product_id, user_id, rating, comment, status) VALUES (?,?,?,?,'pending')",
      [req.params.id, req.user.id, rating, comment.trim()]
    );
    res.status(201).json({ message: 'Review submitted! It will appear after admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
