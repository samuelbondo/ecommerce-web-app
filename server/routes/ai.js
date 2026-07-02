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
  const { messages, session_id, guest_name } = req.body;
  if (!Array.isArray(messages) || !messages.length)
    return res.status(400).json({ error: 'messages array is required' });

  // Resolve user from JWT if present
  let userId = null;
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];
    if (token) userId = jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {}

  try {
    // Check if AI is enabled in settings
    const [[aiSetting]] = await db.query("SELECT value FROM settings WHERE key_name='ai_enabled'");
    const aiEnabled = !aiSetting || aiSetting.value !== '0';

    // Upsert conversation
    if (session_id) {
      await db.query(
        `INSERT INTO conversations (id, user_id, guest_name, status) VALUES (?,?,?,'open')
         ON DUPLICATE KEY UPDATE updated_at=NOW()`,
        [session_id, userId, guest_name || 'Guest']
      );
      // Save user message
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'user') {
        await db.query(
          'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?,?,?)',
          [session_id, 'user', lastMsg.content]
        );
      }
      // Check if admin has taken over
      const [[conv]] = await db.query('SELECT status FROM conversations WHERE id=?', [session_id]);
      if (conv?.status === 'taken_over') {
        return res.json({ reply: null, suggested: [], taken_over: true });
      }
    }

    if (!aiEnabled) {
      return res.json({ reply: "Our AI assistant is currently offline. A support agent will be with you shortly.", suggested: [], taken_over: false });
    }

    const [products] = await db.query(
      'SELECT p.id, p.name, p.price, p.stock, p.description, p.image_url, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.visible = 1'
    );
    const result = await ai.chatAssistant(messages, products);
    if (!result.ok) return res.status(503).json({ error: result.error });

    const idMatch = result.text.match(/RECOMMENDED_IDS:\[([\d,\s]*)\]/);
    const recommendedIds = idMatch ? idMatch[1].split(',').map(n => parseInt(n.trim())).filter(Boolean) : [];
    const reply = result.text.replace(/\nRECOMMENDED_IDS:\[[\d,\s]*\]/, '').trim();

    const suggested = products
      .filter(p => recommendedIds.includes(p.id) && p.stock > 0)
      .slice(0, 3)
      .map(p => ({ id: p.id, name: p.name, price: p.price, image_url: p.image_url }));

    // Save assistant reply
    if (session_id) {
      await db.query(
        'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?,?,?)',
        [session_id, 'assistant', reply]
      );
    }

    res.json({ reply, suggested, taken_over: false });
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

// ── 6. Poll for new admin messages (public) ───────────────────────────────────────
router.get('/chat/poll', async (req, res) => {
  const { session_id, last_id = 0 } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const [[conv]] = await db.query('SELECT status FROM conversations WHERE id=?', [session_id]);
    if (!conv) return res.json({ messages: [], taken_over: false });
    const [msgs] = await db.query(
      "SELECT id, role, content, created_at FROM conversation_messages WHERE conversation_id=? AND role='admin' AND id>? ORDER BY created_at ASC",
      [session_id, last_id]
    );
    res.json({ messages: msgs, taken_over: conv.status === 'taken_over' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
