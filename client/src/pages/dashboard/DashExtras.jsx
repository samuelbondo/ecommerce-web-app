import { useState } from 'react';
import Toast from '../../components/Toast';

const SAMPLE_REVIEWS = [
  { id: 1, product: 'Samsung Galaxy A15', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=60&h=60&fit=crop', rating: 5, comment: 'Excellent phone, great value!', date: '2026-06-20' },
  { id: 2, product: 'Wireless Earbuds', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=60&h=60&fit=crop', rating: 4, comment: 'Good sound quality.', date: '2026-06-25' },
];

export function DashReviews() {
  const [reviews, setReviews] = useState(SAMPLE_REVIEWS);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const handleEdit = (r) => { setEditing(r.id); setEditComment(r.comment); setEditRating(r.rating); };
  const handleSave = (id) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, comment: editComment, rating: editRating } : r));
    setEditing(null); notify('Review updated!');
  };
  const handleDelete = (id) => { setReviews(prev => prev.filter(r => r.id !== id)); notify('Review deleted.', 'info'); };

  const Stars = ({ rating, onChange }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => onChange && onChange(i)} style={{ fontSize: '1.1rem', cursor: onChange ? 'pointer' : 'default', color: i <= rating ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </div>
  );

  return (
    <div style={s.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 style={s.title}>My Reviews</h2>
      {reviews.length === 0 ? (
        <div style={s.empty}>⭐ No reviews yet. Purchase products to leave a review.</div>
      ) : reviews.map(r => (
        <div key={r.id} style={s.card}>
          <img src={r.image} alt={r.product} style={s.img} onError={e => { e.target.src = 'https://placehold.co/60x60?text=?'; }} />
          <div style={{ flex: 1 }}>
            <div style={s.productName}>{r.product}</div>
            <Stars rating={editing === r.id ? editRating : r.rating} onChange={editing === r.id ? setEditRating : null} />
            {editing === r.id ? (
              <textarea value={editComment} onChange={e => setEditComment(e.target.value)} style={s.textarea} rows={2} />
            ) : (
              <p style={s.comment}>{r.comment}</p>
            )}
            <div style={s.date}>{new Date(r.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
          <div style={s.actions}>
            {editing === r.id
              ? <button onClick={() => handleSave(r.id)} style={s.saveBtn}>💾 Save</button>
              : <button onClick={() => handleEdit(r)} style={s.editBtn}>✏️ Edit</button>}
            <button onClick={() => handleDelete(r.id)} style={s.deleteBtn}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const SAMPLE_NOTIFS = [
  { id: 1, icon: '📦', message: 'Your order #2 has been placed successfully.', time: '2 hours ago', read: false },
  { id: 2, icon: '🚚', message: 'Order #1 is out for delivery.', time: '1 day ago', read: false },
  { id: 3, icon: '✅', message: 'Order #1 has been delivered.', time: '2 days ago', read: true },
  { id: 4, icon: '🎉', message: 'Welcome to Samuel Store! Enjoy shopping.', time: '3 days ago', read: true },
];

export function DashNotifications() {
  const [notifs, setNotifs] = useState(SAMPLE_NOTIFS);
  const [toast, setToast] = useState(null);

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const remove = (id) => setNotifs(prev => prev.filter(n => n.id !== id));
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={s.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={s.notifHeader}>
        <h2 style={s.title}>Notifications {unread > 0 && <span style={s.unreadBadge}>{unread}</span>}</h2>
        {unread > 0 && <button onClick={markAll} style={s.markAllBtn}>Mark all as read</button>}
      </div>
      {notifs.length === 0 ? (
        <div style={s.empty}>🔔 No notifications.</div>
      ) : notifs.map(n => (
        <div key={n.id} onClick={() => markRead(n.id)} style={{ ...s.notifCard, background: n.read ? '#fff' : '#f0f7ff', cursor: 'pointer' }}>
          <span style={s.notifIcon}>{n.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ ...s.notifMsg, fontWeight: n.read ? '400' : '600' }}>{n.message}</p>
            <span style={s.notifTime}>{n.time}</span>
          </div>
          {!n.read && <span style={s.dot} />}
          <button onClick={e => { e.stopPropagation(); remove(n.id); }} style={s.removeBtn}>×</button>
        </div>
      ))}
    </div>
  );
}

export function DashSettings() {
  const [prefs, setPrefs] = useState({ emailOrders: true, emailPromos: false, smsAlerts: true, newsletter: false });
  const [toast, setToast] = useState(null);

  const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  const save = () => setToast({ message: 'Settings saved!', type: 'success' });

  const Toggle = ({ label, desc, value, onToggle }) => (
    <div style={s.toggleRow}>
      <div>
        <div style={s.toggleLabel}>{label}</div>
        <div style={s.toggleDesc}>{desc}</div>
      </div>
      <div onClick={onToggle} style={{ ...s.toggleTrack, background: value ? '#e94560' : '#e5e7eb' }}>
        <div style={{ ...s.toggleThumb, transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
      </div>
    </div>
  );

  return (
    <div style={s.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 style={s.title}>Account Settings</h2>
      <div style={s.settingsCard}>
        <h3 style={s.settingsSection}>📧 Email Notifications</h3>
        <Toggle label="Order Updates" desc="Get notified when your order status changes" value={prefs.emailOrders} onToggle={() => toggle('emailOrders')} />
        <Toggle label="Promotions & Offers" desc="Receive deals and discount emails" value={prefs.emailPromos} onToggle={() => toggle('emailPromos')} />
        <Toggle label="Newsletter" desc="Weekly product highlights and news" value={prefs.newsletter} onToggle={() => toggle('newsletter')} />
        <h3 style={{ ...s.settingsSection, marginTop: '20px' }}>📱 SMS Notifications</h3>
        <Toggle label="SMS Order Alerts" desc="Receive SMS when orders are shipped or delivered" value={prefs.smsAlerts} onToggle={() => toggle('smsAlerts')} />
        <button onClick={save} style={s.saveBtn}>💾 Save Preferences</button>
      </div>
    </div>
  );
}

const s = {
  container: { padding: '24px', maxWidth: '680px' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '10px' },
  empty: { textAlign: 'center', padding: '48px', color: '#888', background: '#fff', borderRadius: '16px' },
  card: { background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: '14px', alignItems: 'flex-start' },
  img: { width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 },
  productName: { fontWeight: '700', color: '#1a1a2e', marginBottom: '4px', fontSize: '0.9rem' },
  comment: { color: '#555', fontSize: '0.85rem', margin: '6px 0 4px' },
  textarea: { width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem', marginTop: '6px', resize: 'vertical', outline: 'none' },
  date: { color: '#aaa', fontSize: '0.75rem' },
  actions: { display: 'flex', flexDirection: 'column', gap: '6px' },
  editBtn: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem' },
  saveBtn: { padding: '10px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', marginTop: '16px', width: '100%' },
  deleteBtn: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444' },
  notifHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  unreadBadge: { background: '#e94560', color: '#fff', borderRadius: '50%', padding: '1px 7px', fontSize: '0.75rem' },
  markAllBtn: { fontSize: '0.82rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' },
  notifCard: { borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' },
  notifIcon: { fontSize: '1.3rem', flexShrink: 0 },
  notifMsg: { margin: 0, fontSize: '0.88rem', color: '#333' },
  notifTime: { fontSize: '0.75rem', color: '#aaa' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', background: '#e94560', flexShrink: 0 },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '1.2rem', padding: 0, lineHeight: 1 },
  settingsCard: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  settingsSection: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' },
  toggleLabel: { fontWeight: '600', fontSize: '0.88rem', color: '#333' },
  toggleDesc: { fontSize: '0.78rem', color: '#888', marginTop: '2px' },
  toggleTrack: { width: '44px', height: '24px', borderRadius: '99px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: '3px', left: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
};
