/**
 * AIChat — Floating Shopping Assistant Widget
 * ─────────────────────────────────────────────────────────────────────────────
 * Appears on all public pages as a floating button (bottom-right).
 * Opens a chat panel where customers can ask anything about the store,
 * find products, get recommendations, and get help in any language.
 *
 * Powered by: POST /api/ai/chat (Gemini 2.5 Flash on the backend)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from 'react';
import API from '../api';
import { useSettings } from '../context/SettingsContext';

const WELCOME = "Hi! I'm your shopping assistant 👋 Ask me anything — I can help you find products, check prices, or answer questions about the store.";

export default function AIChat() {
  const { settings } = useSettings();
  const accent = settings.accent_color || '#e94560';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await API.post('/ai/chat', { messages: next });
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      <style>{`
        .ai-chat-btn { position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:50%; background:${accent}; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(0,0,0,0.2); z-index:9000; transition:transform 0.2s; }
        .ai-chat-btn:hover { transform:scale(1.08); }
        .ai-chat-panel { position:fixed; bottom:92px; right:24px; width:340px; max-width:calc(100vw - 32px); height:480px; max-height:calc(100vh - 120px); background:#fff; border-radius:18px; box-shadow:0 8px 40px rgba(0,0,0,0.16); display:flex; flex-direction:column; z-index:9000; overflow:hidden; border:1px solid #e5e7eb; }
        .ai-chat-header { background:${accent}; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; }
        .ai-chat-header-left { display:flex; align-items:center; gap:10px; }
        .ai-chat-avatar { width:34px; height:34px; border-radius:50%; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
        .ai-chat-title { color:#fff; font-weight:700; font-size:0.92rem; }
        .ai-chat-sub { color:rgba(255,255,255,0.8); font-size:0.72rem; }
        .ai-chat-close { background:none; border:none; color:#fff; cursor:pointer; font-size:1.3rem; line-height:1; padding:2px; opacity:0.8; }
        .ai-chat-close:hover { opacity:1; }
        .ai-chat-messages { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; }
        .ai-msg { max-width:85%; padding:10px 13px; border-radius:14px; font-size:0.86rem; line-height:1.55; }
        .ai-msg-user { background:${accent}; color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }
        .ai-msg-assistant { background:#f1f5f9; color:#1a1a2e; align-self:flex-start; border-bottom-left-radius:4px; }
        .ai-chat-typing { display:flex; gap:4px; align-items:center; padding:10px 13px; background:#f1f5f9; border-radius:14px; border-bottom-left-radius:4px; align-self:flex-start; }
        .ai-dot { width:7px; height:7px; border-radius:50%; background:#94a3b8; animation:ai-bounce 1.2s infinite; }
        .ai-dot:nth-child(2) { animation-delay:0.2s; }
        .ai-dot:nth-child(3) { animation-delay:0.4s; }
        @keyframes ai-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        .ai-chat-input-row { padding:12px; border-top:1px solid #f1f5f9; display:flex; gap:8px; }
        .ai-chat-input { flex:1; padding:9px 13px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.88rem; outline:none; resize:none; font-family:inherit; }
        .ai-chat-input:focus { border-color:${accent}; }
        .ai-chat-send { width:38px; height:38px; border-radius:10px; background:${accent}; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:opacity 0.15s; }
        .ai-chat-send:disabled { opacity:0.5; cursor:not-allowed; }
        .ai-badge { position:absolute; top:-4px; right:-4px; width:18px; height:18px; background:#10b981; border-radius:50%; border:2px solid #fff; }
      `}</style>

      <button className="ai-chat-btn" onClick={() => setOpen(o => !o)} title="AI Shopping Assistant" style={{ position: 'fixed' }}>
        {open
          ? <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        }
        {!open && <span className="ai-badge" />}
      </button>

      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div className="ai-chat-header-left">
              <div className="ai-chat-avatar">🤖</div>
              <div>
                <div className="ai-chat-title">Shopping Assistant</div>
                <div className="ai-chat-sub">Powered by Gemini AI · Always online</div>
              </div>
            </div>
            <button className="ai-chat-close" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="ai-chat-typing">
                <div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="ai-chat-input-row">
            <textarea
              className="ai-chat-input"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              disabled={loading}
            />
            <button className="ai-chat-send" onClick={send} disabled={!input.trim() || loading}>
              <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
