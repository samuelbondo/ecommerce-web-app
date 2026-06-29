import { useState, useEffect } from 'react';
import Toast from '../../components/Toast';
import API from '../../api';

const Stars = ({ rating }) => (
  <span>{[1,2,3,4,5].map(i => (
    <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#e5e7eb', fontSize: '0.9rem' }}>★</span>
  ))}</span>
);

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const load = () => {
    setLoading(true);
    API.get('/admin/reviews').then(r => setReviews(r.data)).catch(() => notify('Failed to load reviews', 'error')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/admin/reviews/${id}/status`, { status });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      notify(`Review ${status}`);
    } catch { notify('Failed to update', 'error'); }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await API.delete(`/admin/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      notify('Review deleted', 'info');
    } catch { notify('Failed to delete', 'error'); }
  };

  const submitReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await API.put(`/admin/reviews/${id}/reply`, { reply: replyText });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, admin_reply: replyText } : r));
      setReplyId(null); setReplyText('');
      notify('Reply posted!');
    } catch { notify('Failed to post reply', 'error'); }
  };

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);
  const STATUS_COLOR = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Reviews</h2>
          <p style={s.pageSub}>{reviews.length} total · {reviews.filter(r => r.status === 'pending').length} pending approval</p>
        </div>
      </div>

      <div style={s.filters}>
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? reviews.length : reviews.filter(r => r.status === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Loading reviews...</div>
      ) : (
        <div style={s.list}>
          {filtered.length === 0 && <div style={s.empty}>No reviews found.</div>}
          {filtered.map(r => (
            <div key={r.id} style={s.card}>
              <div style={s.cardTop}>
                <img src={r.image_url} alt={r.product} style={s.img}
                  onError={e => { e.target.src = 'https://placehold.co/48x48?text=?'; }} />
                <div style={{ flex: 1 }}>
                  <div style={s.product}>{r.product}</div>
                  <div style={s.customer}>by {r.customer} · {new Date(r.created_at).toLocaleDateString()}</div>
                  <Stars rating={r.rating} />
                </div>
                <span style={{ ...s.badge, background: STATUS_COLOR[r.status] + '20', color: STATUS_COLOR[r.status] }}>{r.status}</span>
              </div>
              <p style={s.comment}>"{r.comment}"</p>
              {r.admin_reply && (
                <div style={s.replyBox}><b>Store reply:</b> {r.admin_reply}</div>
              )}

              {replyId === r.id && (
                <div style={s.replyForm}>
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                    style={s.textarea} rows={2} placeholder="Write a reply..." />
                  <div style={s.replyBtns}>
                    <button onClick={() => submitReply(r.id)} style={s.btnPrimary}>Post Reply</button>
                    <button onClick={() => setReplyId(null)} style={s.btnCancel}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={s.actions}>
                {r.status === 'pending' && <>
                  <button onClick={() => updateStatus(r.id, 'approved')} style={s.btnApprove}>✓ Approve</button>
                  <button onClick={() => updateStatus(r.id, 'rejected')} style={s.btnReject}>✗ Reject</button>
                </>}
                {r.status === 'approved' && (
                  <button onClick={() => updateStatus(r.id, 'rejected')} style={s.btnReject}>✗ Reject</button>
                )}
                {r.status === 'rejected' && (
                  <button onClick={() => updateStatus(r.id, 'approved')} style={s.btnApprove}>✓ Approve</button>
                )}
                <button onClick={() => { setReplyId(r.id); setReplyText(r.admin_reply || ''); }} style={s.btnReply}>
                  💬 {r.admin_reply ? 'Edit Reply' : 'Reply'}
                </button>
                <button onClick={() => deleteReview(r.id)} style={s.btnDel}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { padding: '24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  filters: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: '#555' },
  filterActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  list: { display: 'flex', flexDirection: 'column', gap: '14px' },
  empty: { textAlign: 'center', padding: '40px', color: '#aaa', background: '#fff', borderRadius: '14px' },
  card: { background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' },
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  img: { width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 },
  product: { fontWeight: '700', color: '#1a1a2e', fontSize: '0.9rem' },
  customer: { color: '#888', fontSize: '0.78rem', margin: '2px 0' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'capitalize', flexShrink: 0 },
  comment: { color: '#444', fontSize: '0.88rem', margin: 0, fontStyle: 'italic' },
  replyBox: { background: '#f0f7ff', borderRadius: '8px', padding: '10px', fontSize: '0.83rem', color: '#333', borderLeft: '3px solid #3b82f6' },
  replyForm: { display: 'flex', flexDirection: 'column', gap: '8px' },
  textarea: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  replyBtns: { display: 'flex', gap: '8px' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  btnApprove: { padding: '5px 14px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' },
  btnReject: { padding: '5px 14px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' },
  btnReply: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#3b82f6' },
  btnDel: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444' },
  btnPrimary: { padding: '7px 16px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' },
  btnCancel: { padding: '7px 14px', borderRadius: '7px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' },
};
