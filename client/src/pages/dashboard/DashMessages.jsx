import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import API from '../../api';

const getSessionId = (userId) => {
  const key = `chat_sid_${userId}`;
  let sid = localStorage.getItem(key);
  if (!sid) { sid = `sess_${userId}_${Date.now()}`; localStorage.setItem(key, sid); }
  return sid;
};

export default function DashMessages() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const accent = settings.accent_color || '#e94560';
  const siteName = settings.site_name || 'Samuel Store';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [adminInfo, setAdminInfo] = useState({ name: null, avatar: null });
  const [initialized, setInitialized] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const lastMsgIdRef = useRef(0);
  const sessionId = useRef(getSessionId(user?.id));

  // Load conversation history on mount
  useEffect(() => {
    if (!user) return;
    API.get(`/ai/chat/history?session_id=${sessionId.current}`)
      .then(r => {
        if (r.data.messages?.length) {
          setMessages(r.data.messages.map(m => ({
            role: m.role,
            content: m.content,
            suggested: [],
            _id: m.id,
            edited_at: m.edited_at,
            deleted_at: m.deleted_at,
            created_at: m.created_at,
          })));
          lastMsgIdRef.current = r.data.messages[r.data.messages.length - 1]?.id || 0;
          if (r.data.taken_over) setTakenOver(true);
        } else {
          // First time — show welcome
          setMessages([{
            role: 'assistant',
            content: `👋 Hi ${user.name.split(' ')[0]}! I'm your ${siteName} assistant. I can help you track orders, find products, or answer any questions. What can I do for you?`,
            suggested: [],
          }]);
        }
        setInitialized(true);
      })
      .catch(() => {
        setMessages([{
          role: 'assistant',
          content: `👋 Hi ${user.name.split(' ')[0]}! How can I help you today?`,
          suggested: [],
        }]);
        setInitialized(true);
      });
  }, [user]);

  // Poll for admin replies every 4s
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await API.get(`/ai/chat/poll?session_id=${sessionId.current}&last_id=${lastMsgIdRef.current}`);
        if (res.data.messages?.length) {
          res.data.messages.forEach(m => {
            setMessages(prev => {
              if (prev.some(p => p._id === m.id)) return prev;
              lastMsgIdRef.current = m.id;
              return [...prev, { role: 'admin', content: m.content, suggested: [], _id: m.id, created_at: m.created_at }];
            });
          });
        }
        if (res.data.taken_over !== undefined) setTakenOver(res.data.taken_over);
        if (res.data.admin_name) setAdminInfo({ name: res.data.admin_name, avatar: res.data.admin_avatar });
      } catch {}
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const deleteMsg = async (msg) => {
    await API.delete(`/ai/chat/messages/${msg._id}?session_id=${sessionId.current}`);
    setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, deleted_at: new Date().toISOString() } : m));
  };

  const startEdit = (msg) => { setEditingId(msg._id); setEditText(msg.content); };

  const submitEdit = async (msg) => {
    if (!editText.trim() || editText.trim() === msg.content) { setEditingId(null); return; }
    try {
      await API.patch(`/ai/chat/messages/${msg._id}`, { content: editText.trim(), session_id: sessionId.current });
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, content: editText.trim(), edited_at: new Date().toISOString() } : m));
    } catch (err) {
      alert(err.response?.data?.error || 'Edit failed');
    }
    setEditingId(null);
  };

  const canEdit = (msg) => msg.role === 'user' && !msg.deleted_at && (Date.now() - new Date(msg.created_at).getTime() < 15 * 60 * 1000);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const next = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await API.post('/ai/chat', {
        messages: next,
        session_id: sessionId.current,
        guest_name: user.name,
      });
      if (res.data.taken_over) { setTakenOver(true); setLoading(false); return; }
      if (res.data.reply) {
        setMessages(m => [...m, { role: 'assistant', content: res.data.reply, suggested: res.data.suggested || [] }]);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I'm having a connection issue. Please try again.", suggested: [] }]);
    }
    setLoading(false);
  }, [messages, input, loading, user]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const renderContent = (content) => ({
    __html: content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^\* (.+)/gm, '• $1')
      .replace(/\[(.+?)\]\((\/[^)]+)\)/g, `<a href="$2" style="color:${accent};font-weight:700;text-decoration:underline">$1</a>`)
      .replace(/\n/g, '<br/>'),
  });

  const QUICK = ['Where is my order?', 'Track my delivery', 'Show me new products', 'What payment methods do you accept?'];

  return (
    <div style={s.page}>
      <style>{`
        .dm-msg-user { background: ${accent}; color: #fff; align-self: flex-end; border-radius: 18px 18px 4px 18px; }
        .dm-msg-bot  { background: #f1f5f9; color: #1a1a2e; align-self: flex-start; border-radius: 18px 18px 18px 4px; }
        .dm-msg-admin { background: #eff6ff; color: #1e40af; align-self: flex-start; border-radius: 18px 18px 18px 4px; border-left: 3px solid #3b82f6; }
        .dm-input:focus { border-color: ${accent}; box-shadow: 0 0 0 3px ${accent}18; }
        .dm-send:hover { opacity: 0.88; transform: scale(1.05); }
        .dm-chip:hover { background: ${accent}; color: #fff; border-color: ${accent}; }
        .dm-dot { width:8px;height:8px;border-radius:50%;background:#94a3b8;animation:dm-bounce 1.3s infinite ease-in-out; }
        .dm-dot:nth-child(2){animation-delay:.18s}.dm-dot:nth-child(3){animation-delay:.36s}
        @keyframes dm-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={{ ...s.avatar, overflow: 'hidden', padding: 0 }}>
            {takenOver && adminInfo.avatar
              ? <img src={adminInfo.avatar} alt={adminInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <span style={{ fontSize: '1.2rem' }}>{takenOver ? '👤' : '🤖'}</span>
            }
          </div>
          <div>
            <div style={s.headerTitle}>{takenOver ? (adminInfo.name || 'Support Agent') : `${siteName} Assistant`}</div>
            <div style={s.headerSub}>
              <span style={s.onlineDot} />
              {takenOver ? 'Live agent connected' : 'Online · Always here to help'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={s.messages}>
        {!initialized && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '0.88rem' }}>Loading conversation...</div>
        )}
        {takenOver && (
          <div style={s.takeoverBanner}>👤 A support agent has joined the conversation</div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={s.msgWrap}
            onMouseEnter={e => e.currentTarget.querySelector('.dm-actions')?.style && (e.currentTarget.querySelector('.dm-actions').style.opacity = '1')}
            onMouseLeave={e => e.currentTarget.querySelector('.dm-actions')?.style && (e.currentTarget.querySelector('.dm-actions').style.opacity = '0')}
          >
            {m.deleted_at ? (
              <div style={{ ...s.msg, background: '#f1f5f9', color: '#94a3b8', fontStyle: 'italic', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                🚫 This message was deleted
              </div>
            ) : editingId === m._id ? (
              <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end', maxWidth: '72%' }}>
                <textarea
                  autoFocus
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(m); } if (e.key === 'Escape') setEditingId(null); }}
                  style={{ ...s.input, minWidth: 200 }}
                  rows={2}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={() => submitEdit(m)} style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ padding: '4px 10px', background: '#e5e7eb', color: '#555', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div
                  className={`dm-msg ${m.role === 'user' ? 'dm-msg-user' : m.role === 'admin' ? 'dm-msg-admin' : 'dm-msg-bot'}`}
                  style={s.msg}
                  dangerouslySetInnerHTML={m.role !== 'user' ? renderContent(m.content) : undefined}
                >
                  {m.role === 'user' ? m.content : undefined}
                </div>
                {m.role === 'user' && (
                  <div className="dm-actions" style={{ display: 'flex', flexDirection: 'column', gap: 3, opacity: 0, transition: 'opacity 0.15s' }}>
                    {canEdit(m) && (
                      <button onClick={() => startEdit(m)} title="Edit" style={s.actionBtn}>✏️</button>
                    )}
                    <button onClick={() => deleteMsg(m)} title="Delete" style={{ ...s.actionBtn, color: '#ef4444' }}>🗑</button>
                  </div>
                )}
              </div>
            )}
            <div style={{ ...s.time, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'admin' ? '👤 Support' : m.role === 'assistant' ? '🤖 AI' : 'You'} · {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {m.edited_at && !m.deleted_at && <span style={{ marginLeft: 4, color: '#cbd5e1' }}>(edited)</span>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '12px 14px', background: '#f1f5f9', borderRadius: '18px 18px 18px 4px', alignSelf: 'flex-start', width: 'fit-content' }}>
            <div className="dm-dot" /><div className="dm-dot" /><div className="dm-dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies — only at start */}
      {messages.length <= 1 && initialized && (
        <div style={s.chips}>
          {QUICK.map((q, i) => (
            <button key={i} className="dm-chip" style={s.chip} onClick={() => send(q)}>{q}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={s.inputRow}>
        <textarea
          className="dm-input"
          style={s.input}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          className="dm-send"
          style={{ ...s.send, background: accent }}
          onClick={() => send()}
          disabled={!input.trim() || loading}
        >
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

    </div>
  );
}

const s = {
  page: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: '#f8f9fb', overflow: 'hidden' },
  header: { background: '#fff', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
  headerTitle: { fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' },
  headerSub: { fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' },
  messages: { flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  msgWrap: { display: 'flex', flexDirection: 'column', gap: 3 },
  msg: { maxWidth: '72%', padding: '11px 15px', fontSize: '0.9rem', lineHeight: 1.55, wordBreak: 'break-word' },
  time: { fontSize: '0.68rem', color: '#94a3b8', padding: '0 4px' },
  takeoverBanner: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 14px', fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600, textAlign: 'center', margin: '4px 0' },
  chips: { padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0, borderTop: '1px solid #f1f5f9', background: '#fff' },
  chip: { padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  inputRow: { padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'flex-end', background: '#fff', flexShrink: 0 },
  input: { flex: 1, padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: '0.9rem', outline: 'none', resize: 'none', fontFamily: 'inherit', maxHeight: 100, lineHeight: 1.4, transition: 'border-color 0.15s' },
  send: { width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' },
  powered: { textAlign: 'center', fontSize: '0.68rem', color: '#cbd5e1', padding: '6px 0 10px', background: '#fff', flexShrink: 0 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px', borderRadius: 4, lineHeight: 1 },
};
