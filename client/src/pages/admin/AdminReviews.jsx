import { useState } from 'react';
import Toast from '../../components/Toast';

const SAMPLE = [
  { id: 1, product: 'Samsung Galaxy A15', customer: 'John Doe', rating: 5, comment: 'Excellent product, highly recommend!', date: '2026-06-25', status: 'pending', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=48&h=48&fit=crop' },
  { id: 2, product: 'Wireless Earbuds', customer: 'Jane Smith', rating: 2, comment: 'Battery dies too fast. Not happy.', date: '2026-06-24', status: 'pending', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=48&h=48&fit=crop' },
  { id: 3, product: 'Running Shoes', customer: 'Ali Hassan', rating: 4, comment: 'Very comfortable, true to size.', date: '2026-06-23', status: 'approved', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=48&h=48&fit=crop' },
  { id: 4, product: 'Electric Kettle', customer: 'Mary Wanjiku', rating: 1, comment: 'Broke after 2 days. Terrible quality!', date: '2026-06-22', status: 'rejected', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=48&h=48&fit=crop' },
];

const Stars = ({ rating }) => (
  <span>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#e5e7eb', fontSize: '0.9rem' }}>★</span>)}</span>
);

export default function AdminReviews() {
  const [reviews, setReviews] = useState(SAMPLE);
  const [filter, setFilter] = useState('all');
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const updateStatus = (id, status) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    notify(`Review ${status}`);
  };

  const deleteReview = (id) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    notify('Review deleted', 'info');
  };

  const submitReply = (id) => {
    if (!replyText.trim()) return;
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: replyText } : r));
    setReplyId(null); setReplyText('');
    notify('Reply posted!');
  };

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);
  const STATUS_COLOR = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={s.pageHeader}>
        <div><h2 style={s.pageTitle}>Reviews</h2><p style={s.pageSub}>{reviews.length} total reviews</p></div>
      </div>

      <div style={s.filters}>
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? reviews.length : reviews.filter(r => r.status === f).length})
          </button>
        ))}
      </div>

      <div style={s.list}>
        {filtered.length === 0 && <div style={s.empty}>No reviews found.</div>}
        {filtered.map(r => (
          <div key={r.id} style={s.card}>
            <div style={s.cardTop}>
              <img src={r.image} alt={r.product} style={s.img} onError={e => { e.target.src='https://placehold.co/48x48?text=?'; }} />
              <div style={{ flex: 1 }}>
                <div style={s.product}>{r.product}</div>
                <div style={s.customer}>by {r.customer} · {new Date(r.date).toLocaleDateString()}</div>
                <Stars rating={r.rating} />
              </div>
              <span style={{ ...s.badge, background: STATUS_COLOR[r.status] + '20', color: STATUS_COLOR[r.status] }}>{r.status}</span>
            </div>
            <p style={s.comment}>{r.comment}</p>
            {r.reply && <div style={s.replyBox}><b>Admin reply:</b> {r.reply}</div>}

            {replyId === r.id && (
              <div style={s.replyForm}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} style={s.textarea} rows={2} placeholder="Write a reply..." />
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
              <button onClick={() => { setReplyId(r.id); setReplyText(r.reply || ''); }} style={s.btnReply}>💬 Reply</button>
              <button onClick={() => deleteReview(r.id)} style={s.btnDel}>🗑 Delete</button>
            </div>
          </div>
        ))}
      </div>
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
  textarea: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', outline: 'none', resize: 'vertical' },
  replyBtns: { display: 'flex', gap: '8px' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  btnApprove: { padding: '5px 14px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' },
  btnReject: { padding: '5px 14px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' },
  btnReply: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#3b82f6' },
  btnDel: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444' },
  btnPrimary: { padding: '7px 16px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' },
  btnCancel: { padding: '7px 14px', borderRadius: '7px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' },
};
