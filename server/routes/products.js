const router = require('express').Router();
const { getProducts, getProduct } = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

router.get('/', getProducts);
router.get('/:id', getProduct);

// GET approved reviews for a product
router.get('/:id/reviews', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.rating, r.comment, r.admin_reply, r.created_at, u.name AS customer
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST a review (must be logged in)
router.post('/:id/reviews', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment?.trim()) return res.status(400).json({ error: 'Rating and comment are required' });
  try {
    await db.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)',
      [req.params.id, req.user.id, rating, comment]
    );
    res.status(201).json({ message: 'Review submitted for approval' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'You already reviewed this product' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
