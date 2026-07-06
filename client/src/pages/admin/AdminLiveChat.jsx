import { useState, useEffect, useRef } from 'react';
import Toast from '../../components/Toast';
import API from '../../api';

export default function AdminLiveChat() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editMsgText, setEditMsgText] = useState('');
  const [ratingsStats, setRatingsStats] = useState({ avg_rating: null, total: 0 });
  const [convRating, setConvRating] = useState(null);
  const [showRatings, setShowRatings] = useState(false);
  const [allRatings, setAllRatings] = useState([]);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  // Load AI toggle state
  useEffect(() => {
    API.get('/admin/settings').then(r => {
      setAiEnabled(r.data.ai_enabled !== '0');
    }).catch(() => {});
    API.get('/admin/conversations/ratings').then(r => setRatingsStats(r.data)).catch(() => {});
  }, []);

  const loadConversations = () => {
    API.get('/admin/conversations')
      .then(r => setConversations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 5000);
    return () => clearInterval(t);
  }, []);

  const openConversation = async (conv) => {
    setSelected(conv);
    setConvRating(conv.customer_rating ? { rating: conv.customer_rating, is_public: false } : null);
    const res = await API.get(`/admin/conversations/${conv.id}/messages`);
    setMessages(res.data);
    // fetch full rating with is_public
    if (conv.customer_rating) {
      API.get('/admin/conversations/ratings/all')
        .then(r => {
          const found = r.data.find(x => x.conversation_id === conv.id);
          if (found) setConvRating(found);
        }).catch(() => {});
    }
  };

  // Poll for new messages in selected conversation
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selected) return;
    pollRef.current = setInterval(async () => {
      const res = await API.get(`/admin/conversations/${selected.id}/messages`).catch(() => null);
      if (res) setMessages(res.data);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAI = async () => {
    const next = !aiEnabled;
    try {
      await API.post('/admin/settings', { settings: { ai_enabled: next ? '1' : '0' } });
      setAiEnabled(next);
      notify(next ? 'AI assistant enabled' : 'AI assistant disabled');
    } catch { notify('Failed to update', 'error'); }
  };

  const takeover = async () => {
    await API.post(`/admin/conversations/${selected.id}/takeover`);
    setSelected(s => ({ ...s, status: 'taken_over' }));
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'taken_over' } : c));
    notify('You have taken over this conversation');
  };

  const release = async () => {
    await API.post(`/admin/conversations/${selected.id}/release`);
    setSelected(s => ({ ...s, status: 'open' }));
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'open' } : c));
    notify('Conversation released back to AI');
  };

  const closeConv = async () => {
    if (!window.confirm('Close this conversation? The customer will be asked to rate their experience.')) return;
    await API.post(`/admin/conversations/${selected.id}/close`);
    setSelected(s => ({ ...s, status: 'closed' }));
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'closed' } : c));
    notify('Conversation closed — customer notified to rate');
    API.get('/admin/conversations/ratings').then(r => setRatingsStats(r.data)).catch(() => {});
  };

  const reopenConv = async () => {
    await API.post(`/admin/conversations/${selected.id}/reopen`);
    setSelected(s => ({ ...s, status: 'open' }));
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'open' } : c));
    notify('Conversation reopened');
  };

  const deleteMsg = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    await API.delete(`/admin/conversations/${selected.id}/messages/${msgId}`);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const startEditMsg = (msg) => { setEditingMsgId(msg.id); setEditMsgText(msg.content); };

  const submitEditMsg = async (msg) => {
    if (!editMsgText.trim() || editMsgText.trim() === msg.content) { setEditingMsgId(null); return; }
    try {
      await API.patch(`/admin/conversations/${selected.id}/messages/${msg.id}`, { content: editMsgText.trim() });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: editMsgText.trim(), edited_at: new Date().toISOString() } : m));
    } catch (err) { notify(err.response?.data?.error || 'Edit failed', 'error'); }
    setEditingMsgId(null);
  };

  const openRatings = () => {
    API.get('/admin/conversations/ratings/all').then(r => { setAllRatings(r.data); setShowRatings(true); }).catch(() => {});
  };

  const togglePublic = async (r) => {
    await API.patch(`/admin/conversations/ratings/${r.id}/public`, { is_public: !r.is_public });
    setAllRatings(prev => prev.map(x => x.id === r.id ? { ...x, is_public: !x.is_public } : x));
    // refresh conv rating if it's the selected one
    if (selected && r.conversation_id === selected.id) setConvRating(prev => ({ ...prev, is_public: !r.is_public }));
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    await API.post(`/admin/conversations/${selected.id}/reply`, { content: reply.trim() });
    setMessages(m => [...m, { role: 'admin', content: reply.trim(), created_at: new Date().toISOString() }]);
    setReply('');
  };

  const deleteConv = async (id) => {
    await API.delete(`/admin/conversations/${id}`);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
    notify('Conversation deleted', 'info');
  };

  const STATUS_COLOR = { open: '#10b981', taken_over: '#3b82f6', closed: '#94a3b8' };
  const STATUS_LABEL = { open: '🤖 AI', taken_over: '👤 Agent', closed: '✓ Closed' };
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Live Chat</h2>
          <p style={s.pageSub}>{conversations.length} conversations · {conversations.filter(c => c.status === 'open').length} active · {conversations.filter(c => c.status === 'closed').length} closed</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Support rating KPI */}
          {ratingsStats.total > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>⭐</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#92400e' }}>{ratingsStats.avg_rating}</span>
              <span style={{ fontSize: '0.75rem', color: '#92400e' }}>/ 5 &nbsp;&middot;&nbsp; {ratingsStats.total} rating{ratingsStats.total !== 1 ? 's' : ''}</span>
              <button onClick={openRatings} style={{ marginLeft: 6, padding: '3px 10px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>Manage</button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>AI Assistant</span>
            <button onClick={toggleAI} style={{ ...s.toggle, background: aiEnabled ? '#10b981' : '#e5e7eb' }}>
              <div style={{ ...s.toggleKnob, transform: aiEnabled ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
            <span style={{ fontSize: '0.82rem', color: aiEnabled ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
              {aiEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      <div style={s.layout}>
        {/* Conversation list */}
        <div style={s.sidebar}>
          {loading && <div style={s.empty}>Loading...</div>}
          {!loading && conversations.length === 0 && <div style={s.empty}>No conversations yet</div>}
          {conversations.map(c => (
            <div key={c.id} onClick={() => openConversation(c)}
              style={{ ...s.convItem, ...(selected?.id === c.id ? s.convActive : {}) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e' }}>
                  {c.user_name || c.guest_name || 'Guest'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {c.customer_rating && <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>{'★'.repeat(c.customer_rating)}</span>}
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: STATUS_COLOR[c.status], background: STATUS_COLOR[c.status] + '18', padding: '2px 8px', borderRadius: 10 }}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }} className="truncate">
                {c.last_message || 'No messages yet'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>{new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.message_count} msgs</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat panel */}
        <div style={s.chatPanel}>
          {!selected ? (
            <div style={s.noChat}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Select a conversation</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Click a conversation on the left to view and respond</div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={s.chatHeader}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a1a2e' }}>{selected.user_name || selected.guest_name || 'Guest'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selected.user_email || 'Guest user'} · {selected.message_count} messages</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selected.status === 'open' && <button onClick={takeover} style={s.btnTakeover}>👤 Take Over</button>}
                  {selected.status === 'taken_over' && <button onClick={release} style={s.btnRelease}>🤖 Release to AI</button>}
                  {selected.status !== 'closed' && <button onClick={closeConv} style={s.btnClose}>✓ Close</button>}
                  {selected.status === 'closed' && <button onClick={reopenConv} style={s.btnReopen}>↩ Reopen</button>}
                  <button onClick={() => deleteConv(selected.id)} style={s.btnDel}>🗑</button>
                </div>
              </div>

              {/* Messages */}
              <div style={s.messages}>
                {messages.map((m, i) => (
                  <div key={i}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}
                    onMouseEnter={e => { const a = e.currentTarget.querySelector('.alc-actions'); if (a) a.style.opacity = '1'; }}
                    onMouseLeave={e => { const a = e.currentTarget.querySelector('.alc-actions'); if (a) a.style.opacity = '0'; }}
                  >
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 3, paddingLeft: 4, paddingRight: 4 }}>
                      {m.role === 'user' ? 'Customer' : m.role === 'admin' ? '👤 You' : '🤖 AI'}
                    </div>
                    {editingMsgId === m.id ? (
                      <div style={{ display: 'flex', gap: 6, maxWidth: '75%' }}>
                        <textarea
                          autoFocus
                          value={editMsgText}
                          onChange={e => setEditMsgText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEditMsg(m); } if (e.key === 'Escape') setEditingMsgId(null); }}
                          style={s.replyInput}
                          rows={2}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <button onClick={() => submitEditMsg(m)} style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Save</button>
                          <button onClick={() => setEditingMsgId(null)} style={{ padding: '4px 10px', background: '#e5e7eb', color: '#555', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                        <div style={{
                          maxWidth: '75%', padding: '10px 14px', borderRadius: 14, fontSize: '0.88rem', lineHeight: 1.5,
                          background: m.role === 'user' ? '#f1f5f9' : m.role === 'admin' ? '#1a1a2e' : '#eff6ff',
                          color: m.role === 'admin' ? '#fff' : '#1a1a2e',
                          borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                          borderBottomLeftRadius: m.role !== 'user' ? 4 : 14,
                          fontStyle: m.deleted_at ? 'italic' : 'normal',
                          opacity: m.deleted_at ? 0.5 : 1,
                        }}>
                          {m.deleted_at ? '🚫 Deleted by admin' : m.content}
                        </div>
                        {!m.deleted_at && selected.status !== 'closed' && (
                          <div className="alc-actions" style={{ display: 'flex', flexDirection: 'column', gap: 3, opacity: 0, transition: 'opacity 0.15s' }}>
                            <button onClick={() => startEditMsg(m)} title="Edit" style={s.msgActionBtn}>✏️</button>
                            <button onClick={() => deleteMsg(m.id)} title="Delete" style={{ ...s.msgActionBtn, color: '#ef4444' }}>🗑</button>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.edited_at && !m.deleted_at && <span style={{ marginLeft: 4 }}>(edited)</span>}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Customer rating display */}
              {convRating && (
                <div style={{ padding: '10px 16px', background: '#fffbeb', borderTop: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>Customer rated:</span>
                  <span style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: 2 }}>{stars(convRating.rating || convRating)}</span>
                  {convRating.comment && <span style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic' }}>"{convRating.comment}"</span>}
                  <button
                    onClick={() => togglePublic(convRating)}
                    style={{ marginLeft: 'auto', padding: '3px 12px', background: convRating.is_public ? '#10b981' : '#e5e7eb', color: convRating.is_public ? '#fff' : '#555', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                  >{convRating.is_public ? '🌍 Public' : '🔒 Private'}</button>
                </div>
              )}

              {/* Reply box */}
              {selected.status === 'taken_over' ? (
                <div style={s.replyBox}>
                  <textarea value={reply} onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder="Type a reply... (Enter to send)"
                    style={s.replyInput} rows={2} />
                  <button onClick={sendReply} disabled={!reply.trim()} style={s.btnSend}>Send</button>
                </div>
              ) : selected.status === 'closed' ? (
                <div style={{ padding: '12px 16px', background: '#f8f9fb', borderTop: '1px solid #f1f5f9', fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                  This conversation is <strong>closed</strong> — click <strong>↩ Reopen</strong> to continue
                </div>
              ) : (
                <div style={{ padding: '12px 16px', background: '#f8f9fb', borderTop: '1px solid #f1f5f9', fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                  Click <strong>Take Over</strong> to reply directly to this customer
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ratings management modal */}
      {showRatings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a1a2e' }}>⭐ Support Ratings</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>{allRatings.length} total · {allRatings.filter(r => r.is_public).length} public</div>
              </div>
              <button onClick={() => setShowRatings(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {allRatings.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No ratings yet</div>}
              {allRatings.map(r => (
                <div key={r.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8f9fb', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {r.customer_avatar
                      ? <img src={r.customer_avatar} alt={r.customer_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{r.customer_name?.[0]}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e' }}>{r.customer_name}</span>
                      <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span style={{ fontSize: '0.7rem', color: '#cbd5e1', marginLeft: 'auto' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <div style={{ fontSize: '0.82rem', color: '#555', fontStyle: 'italic', marginBottom: 4 }}>"{ r.comment}"</div>}
                  </div>
                  <button
                    onClick={() => togglePublic(r)}
                    style={{ padding: '4px 12px', background: r.is_public ? '#10b981' : '#e5e7eb', color: r.is_public ? '#fff' : '#555', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}
                  >{r.is_public ? '🌍 Public' : '🔒 Private'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { padding: '24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: 12 },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0 },
  toggleKnob: { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  layout: { display: 'flex', gap: 16, height: 'calc(100vh - 180px)', minHeight: 500 },
  sidebar: { width: 300, flexShrink: 0, background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  convItem: { padding: '14px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.15s' },
  convActive: { background: '#f0f7ff', borderLeft: '3px solid #3b82f6' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '0.88rem' },
  chatPanel: { flex: 1, background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  noChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' },
  chatHeader: { padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  messages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' },
  replyBox: { padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 },
  replyInput: { flex: 1, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.88rem', outline: 'none', resize: 'none', fontFamily: 'inherit' },
  btnSend: { padding: '10px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' },
  btnTakeover: { padding: '6px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 },
  btnRelease: { padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 },
  btnClose: { padding: '6px 14px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 },
  btnReopen: { padding: '6px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 },
  btnDel: { padding: '6px 10px', background: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem' },
  msgActionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px', borderRadius: 4, lineHeight: 1 },
};
