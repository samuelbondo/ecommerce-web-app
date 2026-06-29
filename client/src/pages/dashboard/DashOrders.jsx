import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import API from '../../api';

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };
const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function DashOrders() {
  const { user } = useAuth();
  const { formatPrice } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  useEffect(() => {
    if (!user) return;
    API.get(`/orders/${user.id}`).then(r => setOrders(r.data)).finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDownload = (order) => {
    const lines = [
      `SAMUEL STORE — INVOICE`,
      `Order #${order.id}`,
      `Date: ${new Date(order.created_at).toLocaleDateString()}`,
      `Status: ${order.status}`,
      ``,
      `Items:`,
      ...order.items.map(i => `  ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`),
      ``,
      `Total: ${formatPrice(order.total)}`,
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `invoice_order_${order.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={s.loading}>Loading orders...</div>;

  return (
    <div style={s.container}>
      <h2 style={s.title}>Order History</h2>

      {/* Filters */}
      <div style={s.filters}>
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {paginated.length === 0 ? (
        <div style={s.empty}>📭 No orders found.</div>
      ) : (
        paginated.map(order => (
          <div key={order.id} style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <span style={s.orderId}>Order #{order.id}</span>
                <span style={s.date}>{new Date(order.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div style={s.headerRight}>
                <span style={{ ...s.badge, background: STATUS_COLOR[order.status] + '20', color: STATUS_COLOR[order.status] }}>{order.status}</span>
                <span style={s.total}>{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Tracking Steps */}
            {order.status !== 'cancelled' && (
              <div style={s.steps}>
                {STEPS.map((step, i) => {
                  const idx = STEPS.indexOf(order.status);
                  const done = i <= idx;
                  return (
                    <div key={step} style={s.step}>
                      <div style={{ ...s.stepDot, background: done ? '#10b981' : '#e5e7eb', border: `2px solid ${done ? '#10b981' : '#d1d5db'}` }}>
                        {done && <span style={s.stepCheck}>✓</span>}
                      </div>
                      {i < STEPS.length - 1 && <div style={{ ...s.stepLine, background: i < idx ? '#10b981' : '#e5e7eb' }} />}
                      <div style={{ ...s.stepLabel, color: done ? '#10b981' : '#9ca3af' }}>{step}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Items */}
            <div style={s.items}>
              {order.items.map(item => (
                <div key={item.id} style={s.item}>
                  <img src={item.image_url} alt={item.name} style={s.img} onError={e => { e.target.src = 'https://placehold.co/56x56?text=?'; }} />
                  <div style={s.itemInfo}>
                    <span style={s.itemName}>{item.name}</span>
                    <span style={s.itemQty}>Qty: {item.quantity}</span>
                  </div>
                  <span style={s.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={s.actions}>
              <button onClick={() => setSelected(selected === order.id ? null : order.id)} style={s.actionBtn}>
                {selected === order.id ? 'Hide Details' : '🔍 View Details'}
              </button>
              <button onClick={() => handleDownload(order)} style={s.actionBtnPrimary}>📄 Download Invoice</button>
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={s.pageBtn}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} style={{ ...s.pageBtn, ...(page === i + 1 ? s.pageActive : {}) }}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={s.pageBtn}>Next →</button>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { padding: '24px' },
  loading: { padding: '48px', textAlign: 'center', color: '#888' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px', color: '#1a1a2e' },
  filters: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: '#555' },
  filterActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  empty: { textAlign: 'center', padding: '48px', color: '#888', background: '#fff', borderRadius: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' },
  orderId: { fontWeight: '700', fontSize: '1rem', marginRight: '12px', color: '#1a1a2e' },
  date: { color: '#888', fontSize: '0.85rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' },
  total: { fontWeight: '700', color: '#1a1a2e' },
  steps: { display: 'flex', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f5f5f5' },
  step: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 },
  stepDot: { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepCheck: { color: '#fff', fontSize: '0.7rem', fontWeight: '700' },
  stepLine: { position: 'absolute', top: '12px', left: '50%', width: '100%', height: '2px', zIndex: 0 },
  stepLabel: { fontSize: '0.7rem', marginTop: '6px', textTransform: 'capitalize', textAlign: 'center' },
  items: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  item: { display: 'flex', alignItems: 'center', gap: '12px' },
  img: { width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemName: { display: 'block', fontWeight: '500', fontSize: '0.9rem', color: '#333' },
  itemQty: { display: 'block', color: '#888', fontSize: '0.8rem' },
  itemPrice: { fontWeight: '600', color: '#e94560', fontSize: '0.9rem' },
  actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  actionBtn: { padding: '7px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.83rem', color: '#555' },
  actionBtnPrimary: { padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer', fontSize: '0.83rem' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' },
  pageBtn: { padding: '7px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' },
  pageActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
};
