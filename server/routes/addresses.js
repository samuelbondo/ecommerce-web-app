const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const MAX_ADDRESSES = 5;

// GET /api/addresses
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, created_at ASC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/addresses
router.post('/', authenticate, async (req, res) => {
  const { label, name, phone, address, city, country } = req.body;
  if (!name || !address || !city) return res.status(400).json({ error: 'name, address and city are required' });
  try {
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM addresses WHERE user_id=?', [req.user.id]);
    if (count >= MAX_ADDRESSES) return res.status(400).json({ error: `Maximum ${MAX_ADDRESSES} addresses allowed` });
    const isFirst = count === 0;
    const [r] = await db.query(
      'INSERT INTO addresses (user_id, label, name, phone, address, city, country, is_default) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.id, label || 'Home', name, phone || '', address, city, country || 'Kenya', isFirst ? 1 : 0]
    );
    res.status(201).json({ id: r.insertId, message: 'Address added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/addresses/:id
router.put('/:id', authenticate, async (req, res) => {
  const { label, name, phone, address, city, country } = req.body;
  try {
    await db.query(
      'UPDATE addresses SET label=?, name=?, phone=?, address=?, city=?, country=? WHERE id=? AND user_id=?',
      [label, name, phone, address, city, country, req.params.id, req.user.id]
    );
    res.json({ message: 'Address updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/addresses/:id/default
router.put('/:id/default', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.id]);
    await db.query('UPDATE addresses SET is_default=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ message: 'Default address updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/addresses/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [[addr]] = await db.query('SELECT is_default FROM addresses WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    await db.query('DELETE FROM addresses WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    // if deleted was default, promote the next one
    if (addr?.is_default) {
      await db.query('UPDATE addresses SET is_default=1 WHERE user_id=? ORDER BY created_at ASC LIMIT 1', [req.user.id]);
    }
    res.json({ message: 'Address deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
