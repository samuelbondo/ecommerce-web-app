/**
 * Samuel Store — AI Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * All AI-powered endpoints. Mounted at /api/ai in index.js.
 *
 * Endpoints:
 *   POST /api/ai/describe          → generate product description (admin only)
 *   POST /api/ai/search            → semantic product search (public)
 *   POST /api/ai/review-summary    → summarise product reviews (public)
 *   POST /api/ai/chat              → shopping assistant (public)
 *   POST /api/ai/translate         → translate text (public)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const ai = require('../services/gemini');

// ── 1. Generate product description (admin only) ──────────────────────────────
router.post('/describe', authenticate, requireAdmin, async (req, res) => {
  const { name, category, price } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required' });

  const result = await ai.generateDescription(name, category, price);
  if (!result.ok) return res.status(503).json({ error: result.error });
  res.json({ description: result.text });
});

// ── 2. Semantic search (public) ───────────────────────────────────────────────
router.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: 'Query is required' });

  try {
    const [products] = await db.query(
      'SELECT id, name, description, category_id, price, stock, (SELECT name FROM categories WHERE id = category_id) AS category FROM products'
    );
    const result = await ai.semanticSearch(query, products);
    if (!result.ok) return res.status(503).json({ error: result.error });
    res.json({ ids: result.ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 3. Review sentiment summary (public) ──────────────────────────────────────
router.post('/review-summary', async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id is required' });

  try {
    const [reviews] = await db.query(
      "SELECT rating, comment FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 20",
      [product_id]
    );
    if (!reviews.length) return res.json({ summary: '' });

    const result = await ai.reviewSummary(reviews);
    if (!result.ok) return res.status(503).json({ error: result.error });
    res.json({ summary: result.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 4. Shopping assistant chat (public) ───────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length)
    return res.status(400).json({ error: 'messages array is required' });

  try {
    const [products] = await db.query(
      'SELECT p.id, p.name, p.price, p.stock, p.description, p.image_url, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.visible = 1'
    );
    const result = await ai.chatAssistant(messages, products);
    if (!result.ok) return res.status(503).json({ error: result.error });

    // Find products mentioned in the reply so the frontend can show Add to Cart buttons
    const reply = result.text;
    const suggested = products.filter(p =>
      reply.toLowerCase().includes(p.name.toLowerCase()) && p.stock > 0
    ).slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price, image_url: p.image_url }));

    res.json({ reply, suggested });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 5. Translate text (public) ────────────────────────────────────────────────
router.post('/translate', async (req, res) => {
  const { text, language } = req.body;
  if (!text || !language) return res.status(400).json({ error: 'text and language are required' });

  const result = await ai.translateText(text, language);
  if (!result.ok) return res.status(503).json({ error: result.error });
  res.json({ translated: result.text });
});

module.exports = router;
