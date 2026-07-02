/**
 * AIChat — Proactive AI Shopping Assistant Widget
 * ─────────────────────────────────────────────────────────────────────────────
 * International standard implementation:
 *
 * 1. Proactive greeting — auto-pops a preview message after 8s on page
 * 2. Context-aware — different message per page (home/products/cart/checkout)
 * 3. Cart abandonment nudge — if cart has items + 30s on cart/checkout page
 * 4. Unread badge — animated pulse dot when there's an unseen message
 * 5. Quick reply chips — one-tap suggestions so users don't have to type
 * 6. Smooth animations — bubble bounces in, preview slides up
 * 7. Minimise without losing history — close hides panel, history preserved
 * 8. Powered by Gemini 2.5 Flash via POST /api/ai/chat
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';

// Generate or retrieve a persistent session ID
const getSessionId = () => {
  let sid = sessionStorage.getItem('chat_sid');
  if (!sid) { sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2); sessionStorage.setItem('chat_sid', sid); }
  return sid;
};

// Context-aware proactive messages per page
const PROACTIVE = {
  '/':          "👋 Welcome! I can help you find the perfect product. What are you looking for today?",
  '/products':  "🔍 Need help finding something? Just describe what you need and I'll find it for you.",
  '/cart':      "🛒 Ready to checkout? I can help with any questions about your order.",
  '/checkout':  "💳 Need help completing your order? I'm here if you have any questions.",
  '/login':     "👋 Welcome back! Sign in to access your orders and exclusive deals.",
  '/register':  "🎉 Creating an account is free and takes less than a minute!",
};

const CART_NUDGE = "🛒 You have items in your cart! Need help choosing or have questions before you checkout?";

// Quick reply suggestions per page
const QUICK_REPLIES = {
  '/':          ['Show me new arrivals', 'What\'s on sale?', 'Help me find a gift'],
  '/products':  ['Filter by price', 'What\'s most popular?', 'Do you have electronics?'],
  '/cart':      ['How long is delivery?', 'What\'s your return policy?', 'Apply a coupon'],
  '/checkout':  ['Is payment secure?', 'Do you ship internationally?', 'Cash on delivery?'],
  default:      ['Browse products', 'Track my order', 'Contact support'],
};

export default function AIChat() {
  const { settings } = useSettings();
  const { cart, addToCart } = useCart();
  const location = useLocation();
  const accent = settings.accent_color || '#e94560';
  const siteName = settings.site_name || 'Samuel Store';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [entered, setEntered] = useState(false);
  const [takenOver, setTakenOver] = useState(false);

  const bottomRef = useRef(null);
  const proactiveTimer = useRef(null);
  const nudgeTimer = useRef(null);
  const hasGreeted = useRef(false);
  const pollRef = useRef(null);
  const sessionId = useRef(getSessionId());

  // Button entrance animation on mount
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Proactive message logic — fires on page change
  useEffect(() => {
    clearTimeout(proactiveTimer.current);
    clearTimeout(nudgeTimer.current);
    setShowPreview(false);

    const path = location.pathname;
    const isCartPage = path === '/cart' || path === '/checkout';

    // Cart abandonment nudge — 30s if cart has items on cart/checkout page
    if (isCartPage && cart.length > 0 && !open) {
      nudgeTimer.current = setTimeout(() => {
        if (!open) {
          setPreview(CART_NUDGE);
          setShowPreview(true);
          if (!hasGreeted.current) setUnread(u => u + 1);
        }
      }, 30000);
      return;
    }

    // General proactive greeting — 8s after landing on any page
    const msg = PROACTIVE[path];
    if (msg && !open) {
      proactiveTimer.current = setTimeout(() => {
        if (!open) {
          setPreview(msg);
          setShowPreview(true);
          if (!hasGreeted.current) setUnread(u => u + 1);
        }
      }, 8000);
    }

    return () => {
      clearTimeout(proactiveTimer.current);
      clearTimeout(nudgeTimer.current);
    };
  }, [location.pathname, cart.length]);

  // Poll for admin replies every 4s when chat is open
  useEffect(() => {
    if (!open) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const res = await API.get(`/ai/chat/poll?session_id=${sessionId.current}`);
        if (res.data.messages?.length) {
          res.data.messages.forEach(m => {
            setMessages(prev => {
              if (prev.some(p => p._id === m.id)) return prev;
              return [...prev, { role: 'admin', content: m.content, _id: m.id, suggested: [] }];
            });
            setUnread(u => u + 1);
          });
        }
        if (res.data.taken_over !== undefined) setTakenOver(res.data.taken_over);
      } catch {}
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // When user opens chat — set welcome message if first time, clear unread
  const handleOpen = useCallback(() => {
    setOpen(true);
    setShowPreview(false);
    setUnread(0);
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      const path = location.pathname;
      const welcome = PROACTIVE[path] || `👋 Hi! I'm your ${siteName} shopping assistant. How can I help you today?`;
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [location.pathname, siteName]);

  const handleClose = () => {
    setOpen(false);
    setShowPreview(false);
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const next = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await API.post('/ai/chat', { messages: next, session_id: sessionId.current, guest_name: 'Guest' });
      if (res.data.taken_over) {
        setTakenOver(true);
        setLoading(false);
        return;
      }
      if (res.data.reply) {
        setMessages(m => [...m, { role: 'assistant', content: res.data.reply, suggested: res.data.suggested || [] }]);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I'm having a connection issue. Please try again in a moment.", suggested: [] }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const quickReplies = QUICK_REPLIES[location.pathname] || QUICK_REPLIES.default;

  return (
    <>
      <style>{`
        /* ── Button ── */
        .aic-btn {
          position: fixed; bottom: 24px; right: 24px; width: 58px; height: 58px;
          border-radius: 50%; background: ${accent}; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.22); z-index: 9000;
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.3s;
          transform: ${entered ? 'scale(1)' : 'scale(0)'};
          opacity: ${entered ? '1' : '0'};
        }
        .aic-btn:hover { transform: scale(1.1) !important; }
        .aic-btn:active { transform: scale(0.96) !important; }

        /* ── Unread pulse badge ── */
        .aic-badge {
          position: absolute; top: -3px; right: -3px;
          width: 20px; height: 20px; background: #10b981;
          border-radius: 50%; border: 2.5px solid #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 800; color: #fff;
          animation: aic-pulse 2s infinite;
        }
        @keyframes aic-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
        }

        /* ── Proactive preview bubble ── */
        .aic-preview {
          position: fixed; bottom: 94px; right: 24px;
          max-width: 260px; background: #fff; border-radius: 14px 14px 4px 14px;
          padding: 12px 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.14);
          font-size: 0.84rem; color: #1a1a2e; line-height: 1.5;
          z-index: 8999; border: 1px solid #e5e7eb; cursor: pointer;
          animation: aic-slide-up 0.35s cubic-bezier(.34,1.56,.64,1);
        }
        .aic-preview::after {
          content: ''; position: absolute; bottom: -8px; right: 20px;
          width: 0; height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #fff;
        }
        .aic-preview-close {
          position: absolute; top: 6px; right: 8px;
          background: none; border: none; cursor: pointer;
          color: #94a3b8; font-size: 1rem; line-height: 1; padding: 2px;
        }
        @keyframes aic-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Panel ── */
        .aic-panel {
          position: fixed; bottom: 94px; right: 24px;
          width: 360px; max-width: calc(100vw - 32px);
          height: 520px; max-height: calc(100vh - 110px);
          background: #fff; border-radius: 20px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.18);
          display: flex; flex-direction: column;
          z-index: 9000; overflow: hidden; border: 1px solid #e5e7eb;
          animation: aic-panel-in 0.3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes aic-panel-in {
          from { opacity: 0; transform: scale(0.92) translateY(16px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Header ── */
        .aic-header {
          background: linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%);
          padding: 16px 18px; display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .aic-header-left { display: flex; align-items: center; gap: 12px; }
        .aic-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4);
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
          flex-shrink: 0;
        }
        .aic-online {
          width: 9px; height: 9px; background: #10b981; border-radius: 50%;
          border: 2px solid #fff; position: absolute; bottom: 0; right: 0;
        }
        .aic-title { color: #fff; font-weight: 700; font-size: 0.95rem; }
        .aic-sub { color: rgba(255,255,255,0.82); font-size: 0.72rem; margin-top: 1px; }
        .aic-close {
          background: rgba(255,255,255,0.15); border: none; color: #fff;
          cursor: pointer; width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; transition: background 0.15s;
        }
        .aic-close:hover { background: rgba(255,255,255,0.28); }

        /* ── Messages ── */
        .aic-messages {
          flex: 1; overflow-y: auto; padding: 16px 14px 8px;
          display: flex; flex-direction: column; gap: 10px;
          scroll-behavior: smooth;
        }
        .aic-messages::-webkit-scrollbar { width: 4px; }
        .aic-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        .aic-msg {
          max-width: 82%; padding: 10px 13px; border-radius: 16px;
          font-size: 0.86rem; line-height: 1.55; word-break: break-word;
        }
        .aic-msg-user {
          background: ${accent}; color: #fff;
          align-self: flex-end; border-bottom-right-radius: 4px;
        }
        .aic-msg-bot {
          background: #f1f5f9; color: #1a1a2e;
          align-self: flex-start; border-bottom-left-radius: 4px;
        }
        .aic-msg-time {
          font-size: 0.68rem; color: #94a3b8; margin-top: 3px;
          align-self: flex-start; padding: 0 4px;
        }
        .aic-msg-time-user { align-self: flex-end; }

        /* ── Typing indicator ── */
        .aic-typing {
          display: flex; gap: 5px; align-items: center;
          padding: 12px 14px; background: #f1f5f9;
          border-radius: 16px; border-bottom-left-radius: 4px;
          align-self: flex-start; width: fit-content;
        }
        .aic-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
          animation: aic-bounce 1.3s infinite ease-in-out;
        }
        .aic-dot:nth-child(2) { animation-delay: 0.18s; }
        .aic-dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes aic-bounce {
          0%,60%,100% { transform: translateY(0); }
          30% { transform: translateY(-7px); }
        }

        /* ── Quick replies ── */
        .aic-chips {
          padding: 8px 14px; display: flex; gap: 6px;
          overflow-x: auto; flex-shrink: 0; scrollbar-width: none;
        }
        .aic-chips::-webkit-scrollbar { display: none; }
        .aic-chip {
          padding: 6px 12px; border-radius: 20px; border: 1.5px solid ${accent}33;
          background: #fff; color: ${accent}; font-size: 0.78rem; font-weight: 600;
          cursor: pointer; white-space: nowrap; transition: all 0.15s; flex-shrink: 0;
        }
        .aic-chip:hover { background: ${accent}; color: #fff; border-color: ${accent}; }

        /* ── Input row ── */
        .aic-input-row {
          padding: 10px 12px 14px; border-top: 1px solid #f1f5f9;
          display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
        }
        .aic-input {
          flex: 1; padding: 10px 13px; border: 1.5px solid #e5e7eb;
          border-radius: 12px; font-size: 0.88rem; outline: none;
          resize: none; font-family: inherit; max-height: 80px;
          transition: border-color 0.15s; line-height: 1.4;
        }
        .aic-input:focus { border-color: ${accent}; box-shadow: 0 0 0 3px ${accent}18; }
        .aic-send {
          width: 40px; height: 40px; border-radius: 12px; background: ${accent};
          border: none; cursor: pointer; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; transition: all 0.15s;
          box-shadow: 0 2px 8px ${accent}44;
        }
        .aic-send:hover { transform: scale(1.06); }
        .aic-send:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        /* ── Powered by ── */
        .aic-powered {
          text-align: center; font-size: 0.68rem; color: #cbd5e1;
          padding: 0 0 10px; flex-shrink: 0;
        }

        .aic-msg-admin {
          background: #eff6ff; color: #1e40af;
          align-self: flex-start; border-bottom-left-radius: 4px;
          border-left: 3px solid #3b82f6;
        }
        .aic-takeover-banner {
          margin: 8px 14px; padding: 8px 12px; background: #eff6ff;
          border-radius: 8px; font-size: 0.78rem; color: #1d4ed8;
          font-weight: 600; text-align: center; border: 1px solid #bfdbfe;
        }

        /* ── Add to Cart chips ── */
        .aic-atc-row { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; align-self: flex-start; max-width: 82%; }
        .aic-atc-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 12px; border-radius: 10px;
          border: 1.5px solid ${accent}44; background: #fff;
          cursor: pointer; font-size: 0.78rem; font-weight: 600; color: #1a1a2e;
          transition: all 0.15s; text-align: left;
        }
        .aic-atc-btn:hover { background: ${accent}; color: #fff; border-color: ${accent}; }
        .aic-atc-btn img { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }

        /* ── Mobile: full-screen panel like WhatsApp / Messenger ── */
        @media (max-width: 600px) {
          .aic-btn { bottom: 16px; right: 16px; width: 52px; height: 52px; }
          .aic-preview { right: 16px; bottom: 80px; max-width: calc(100vw - 80px); }
          .aic-panel {
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%; height: 100%;
            max-width: 100%; max-height: 100%;
            border-radius: 0; border: none;
            /* account for iOS safe areas */
            padding-bottom: env(safe-area-inset-bottom);
          }
          .aic-header { padding: 14px 16px; padding-top: calc(14px + env(safe-area-inset-top)); }
          .aic-input-row { padding: 8px 10px 10px; }
          .aic-input { font-size: 1rem; }
          .aic-msg { font-size: 0.9rem; }
        }
      `}</style>

      {/* Proactive preview bubble */}
      {showPreview && !open && (
        <div className="aic-preview" onClick={handleOpen}>
          <button className="aic-preview-close" onClick={(e) => { e.stopPropagation(); setShowPreview(false); }}>×</button>
          {preview}
        </div>
      )}

      {/* Floating button */}
      <button className="aic-btn" onClick={open ? handleClose : handleOpen} title="AI Shopping Assistant">
        {open
          ? <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        }
        {!open && unread > 0 && (
          <span className="aic-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="aic-panel">

          {/* Header */}
          <div className="aic-header">
            <div className="aic-header-left">
              <div style={{ position: 'relative' }}>
                <div className="aic-avatar">🤖</div>
                <div className="aic-online" />
              </div>
              <div>
                <div className="aic-title">{takenOver ? 'Support Agent' : `${siteName} Assistant`}</div>
                <div className="aic-sub">{takenOver ? '🟢 Live agent connected' : '🟢 Online · Powered by Gemini AI'}</div>
              </div>
            </div>
            <button className="aic-close" onClick={handleClose}>
              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="aic-messages">
            {takenOver && <div className="aic-takeover-banner">👤 A support agent has joined the conversation</div>}
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  className={`aic-msg ${m.role === 'user' ? 'aic-msg-user' : m.role === 'admin' ? 'aic-msg-admin' : 'aic-msg-bot'}`}
                  dangerouslySetInnerHTML={m.role === 'assistant' ? { __html: m.content
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/^\* (.+)/gm, '\u2022 $1')
                    .replace(/\n/g, '<br/>') } : undefined}
                >
                  {m.role === 'user' ? m.content : undefined}
                </div>
                {m.role === 'assistant' && m.suggested?.length > 0 && (
                  <div className="aic-atc-row">
                    {m.suggested.map(p => (
                      <button key={p.id} className="aic-atc-btn" onClick={() => {
                        addToCart(p);
                        setMessages(prev => prev.map((msg, idx) => idx === i
                          ? { ...msg, suggested: msg.suggested.filter(s => s.id !== p.id) }
                          : msg
                        ));
                        setMessages(prev => [...prev, { role: 'assistant', content: `\u2705 **${p.name}** added to your cart!`, suggested: [] }]);
                      }}>
                        {p.image_url && <img src={p.image_url} alt={p.name} />}
                        <span>\uD83D\uDED2 Add "{p.name}" — ${p.price}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className={`aic-msg-time ${m.role === 'user' ? 'aic-msg-time-user' : ''}`}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="aic-typing">
                <div className="aic-dot" /><div className="aic-dot" /><div className="aic-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick reply chips — only show when no conversation yet */}
          {messages.length <= 1 && !loading && (
            <div className="aic-chips">
              {quickReplies.map((q, i) => (
                <button key={i} className="aic-chip" onClick={() => send(q)}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="aic-input-row">
            <textarea
              className="aic-input"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button className="aic-send" onClick={() => send()} disabled={!input.trim() || loading}>
              <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          <div className="aic-powered">Powered by Google Gemini AI</div>
        </div>
      )}
    </>
  );
}
