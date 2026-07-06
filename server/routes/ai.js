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

    // Fetch order history for logged-in users
    let orders = [];
    if (userId) {
      const [rows] = await db.query(
        `SELECT o.id, o.status, o.payment_status, o.payment_method, o.total, o.created_at,
          GROUP_CONCAT(CONCAT(oi.quantity,'x ',oi.name) SEPARATOR ', ') AS items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = ?
         GROUP BY o.id
         ORDER BY o.created_at DESC
         LIMIT 10`,
        [userId]
      );
      orders = rows;
    }

    const result = await ai.chatAssistant(messages, products, orders);
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

// ── 6. Poll for new admin messages (public) ─────────────────────────────────
router.get('/chat/poll', async (req, res) => {
  const { session_id, last_id = 0 } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const [[conv]] = await db.query(
      `SELECT c.status, u.name AS admin_name, u.avatar AS admin_avatar
       FROM conversations c
       LEFT JOIN users u ON c.admin_id = u.id
       WHERE c.id=?`,
      [session_id]
    );
    if (!conv) return res.json({ messages: [], taken_over: false });
    const [msgs] = await db.query(
      "SELECT id, role, content, created_at FROM conversation_messages WHERE conversation_id=? AND role='admin' AND id>? ORDER BY created_at ASC",
      [session_id, last_id]
    );
    res.json({
      messages: msgs,
      taken_over: conv.status === 'taken_over',
      status: conv.status,
      admin_name: conv.admin_name || null,
      admin_avatar: conv.admin_avatar || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 7. Load conversation history for dashboard ───────────────────────────────
router.get('/chat/history', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const [[conv]] = await db.query('SELECT status FROM conversations WHERE id=?', [session_id]);
    if (!conv) return res.json({ messages: [], taken_over: false, status: null });
    const [msgs] = await db.query(
      'SELECT id, role, content, edited_at, deleted_at, created_at FROM conversation_messages WHERE conversation_id=? ORDER BY created_at ASC',
      [session_id]
    );
    res.json({ messages: msgs, taken_over: conv.status === 'taken_over', status: conv.status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// helper: resolve userId from optional JWT
function resolveUser(req) {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];
    if (token) return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {}
  return null;
}

// ── 8. Customer edits own message (15-min window) ─────────────────────────────
router.patch('/chat/messages/:id', async (req, res) => {
  const { content, session_id } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  if (content.trim().length > 2000) return res.status(400).json({ error: 'Message too long' });
  const userId = resolveUser(req);
  try {
    const [[msg]] = await db.query(
      'SELECT * FROM conversation_messages WHERE id=? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.role !== 'user') return res.status(403).json({ error: 'Can only edit your own messages' });
    const [[conv]] = await db.query('SELECT user_id FROM conversations WHERE id=?', [msg.conversation_id]);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    const isOwner = (userId && conv.user_id === userId) || (session_id && msg.conversation_id === session_id);
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });
    if (Date.now() - new Date(msg.created_at).getTime() > 15 * 60 * 1000)
      return res.status(403).json({ error: 'Edit window expired (15 minutes)' });
    await db.query('UPDATE conversation_messages SET content=?, edited_at=NOW() WHERE id=?', [content.trim(), req.params.id]);
    res.json({ message: 'Message updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 9. Customer soft-deletes own message ──────────────────────────────────────
router.delete('/chat/messages/:id', async (req, res) => {
  const { session_id } = req.query;
  const userId = resolveUser(req);
  try {
    const [[msg]] = await db.query(
      'SELECT * FROM conversation_messages WHERE id=? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.role !== 'user') return res.status(403).json({ error: 'Can only delete your own messages' });
    const [[conv]] = await db.query('SELECT user_id FROM conversations WHERE id=?', [msg.conversation_id]);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    const isOwner = (userId && conv.user_id === userId) || (session_id && msg.conversation_id === session_id);
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE conversation_messages SET deleted_at=NOW() WHERE id=?', [req.params.id]);
    res.json({ message: 'Message deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 10. Submit conversation rating (logged-in customer only) ─────────────────────
router.post('/chat/rate', authenticate, async (req, res) => {
  const { session_id, rating, comment } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5' });
  try {
    const [[conv]] = await db.query('SELECT * FROM conversations WHERE id=?', [session_id]);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.status !== 'closed') return res.status(400).json({ error: 'Can only rate a closed conversation' });
    if (conv.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    // one rating per conversation — upsert
    await db.query(
      `INSERT INTO conversation_ratings (conversation_id, user_id, rating, comment)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment)`,
      [session_id, req.user.id, rating, comment?.trim() || null]
    );
    res.json({ message: 'Rating submitted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 11. Get rating for a conversation (customer) ─────────────────────────────
router.get('/chat/rate', authenticate, async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const [[row]] = await db.query(
      'SELECT rating, comment FROM conversation_ratings WHERE conversation_id=? AND user_id=?',
      [session_id, req.user.id]
    );
    res.json(row || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 12. Public ratings (no auth) ───────────────────────────────────────────────
router.get('/chat/ratings/public', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT cr.rating, cr.comment, cr.created_at,
        CONCAT(LEFT(u.name,1), REPEAT('*', GREATEST(LENGTH(SUBSTRING_INDEX(u.name,' ',1))-1,1)), ' ', LEFT(SUBSTRING_INDEX(u.name,' ',-1),1), '.') AS display_name
       FROM conversation_ratings cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.is_public = 1 AND cr.comment IS NOT NULL AND cr.comment != ''
       ORDER BY cr.created_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
