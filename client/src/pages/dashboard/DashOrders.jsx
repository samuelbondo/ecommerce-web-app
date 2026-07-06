import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import API from '../../api';
import { fmtOrderId } from '../../utils/formatOrderId';

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };
const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function DashOrders() {
  const { user } = useAuth();
  const { formatPrice, settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
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
    const storeName = settings.site_name || 'Samuel Store';
    const oid = fmtOrderId(order.id, order.created_at);
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice — ${oid}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:40px;color:#1a1a2e;background:#fff}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #e94560;padding-bottom:20px;margin-bottom:28px}
    .brand{font-size:1.6rem;font-weight:800;color:#e94560;letter-spacing:1px}
    .brand-sub{font-size:0.78rem;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:2px}
    .meta{text-align:right;font-size:0.85rem;color:#555;line-height:1.8}
    .meta strong{color:#1a1a2e;font-size:1rem}
    .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:0.72rem;font-weight:700;text-transform:capitalize;background:#d1fae5;color:#065f46}
    .section-title{font-size:0.72rem;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
    .info-box{background:#f8f9fb;border-radius:8px;padding:12px 16px;font-size:0.88rem;color:#555;line-height:1.8}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    thead tr{background:#1a1a2e;color:#fff}
    th{padding:11px 14px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;font-weight:600}
    td{padding:11px 14px;border-bottom:1px solid #f0f0f0;font-size:0.88rem}
    tfoot td{font-weight:700;font-size:0.95rem;border-top:2px solid #e94560;border-bottom:none}
    .grand{color:#e94560;font-size:1.05rem}
    .footer{margin-top:40px;text-align:center;font-size:0.75rem;color:#bbb;border-top:1px solid #f0f0f0;padding-top:16px}
    @media print{body{padding:20px}}
  </style>
</head>
<body>
  <div class="header">
    <div><div class="brand">${storeName}</div><div class="brand-sub">Official Invoice</div></div>
    <div class="meta"><strong>${oid}</strong><br/>${new Date(order.created_at).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'})}<br/><span class="badge">${order.status}</span></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
    <div><div class="section-title">Bill To</div>
      <div class="info-box"><strong>${order.customer_name || user?.name || '—'}</strong><br/>${order.customer_email || user?.email || ''}<br/>${order.customer_phone ? order.customer_phone + '<br/>' : ''}${order.customer_address ? order.customer_address : ''}</div>
    </div>
    <div><div class="section-title">Payment</div>
      <div class="info-box">Method: <strong>${order.payment_method === 'cod' ? 'Cash on Delivery' : 'PayPal'}</strong><br/>Status: <strong>${order.payment_status || 'pending'}</strong>${order.payment_id ? '<br/>Ref: ' + order.payment_id : ''}</div>
    </div>
  </div>
  <div class="section-title">Order Items</div>
  <table>
    <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
    <tbody>${order.items.map(i => `<tr><td>${i.name}${i.variant_name ? ` <span style="color:#e94560;font-size:0.78rem">(${i.variant_name})</span>` : ''}</td><td>${i.quantity}</td><td>${formatPrice(i.price)}</td><td>${formatPrice(i.price * i.quantity)}</td></tr>`).join('')}</tbody>
    <tfoot>
      <tr><td colspan="3">Shipping</td><td style="color:#16a34a">Free</td></tr>
      <tr><td colspan="3">Grand Total</td><td class="grand">${formatPrice(order.total)}</td></tr>
    </tfoot>
  </table>
  <div class="footer">Thank you for shopping at ${storeName} · This is a computer-generated invoice · © ${new Date().getFullYear()} ${storeName}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${oid}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={s.loading}>Loading orders...</div>;

  return (
    <div style={s.container}>
      <h2 style={s.title}>Order History</h2>

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
      ) : paginated.map(order => (
        <div key={order.id} style={s.card}>
          <div style={s.cardHeader}>
            <div>
              <span style={s.orderId}>{fmtOrderId(order.id, order.created_at)}</span>
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
                  {item.variant_name && <span style={s.itemVariant}>{item.variant_name}</span>}
                  <span style={s.itemQty}>Qty: {item.quantity}</span>
                </div>
                <span style={s.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={s.actions}>
            <button onClick={() => setExpanded(expanded === order.id ? null : order.id)} style={s.actionBtn}>
              {expanded === order.id ? '▲ Hide Details' : '▼ View Details'}
            </button>
            <button onClick={() => handleDownload(order)} style={s.actionBtnPrimary}>📄 Download Invoice</button>
          </div>

          {/* Expanded Details */}
          {expanded === order.id && (
            <div style={s.details}>
              <div style={s.detailsGrid}>
                <div>
                  <div style={s.detailLabel}>Customer</div>
                  <div style={s.detailValue}>{order.customer_name || user?.name || '—'}</div>
                  {order.customer_email && <div style={s.detailMuted}>{order.customer_email}</div>}
                  {order.customer_phone && <div style={s.detailMuted}>{order.customer_phone}</div>}
                </div>
                <div>
                  <div style={s.detailLabel}>Shipping Address</div>
                  <div style={s.detailValue}>{order.customer_address || '—'}</div>
                </div>
                <div>
                  <div style={s.detailLabel}>Payment</div>
                  <div style={s.detailValue}>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'PayPal'}</div>
                  <div style={s.detailMuted}>Status: {order.payment_status || 'pending'}</div>
                  {order.payment_id && <div style={s.detailMuted}>ID: {order.payment_id}</div>}
                </div>
                <div>
                  <div style={s.detailLabel}>Order Summary</div>
                  <div style={s.detailValue}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                  <div style={s.detailMuted}>Shipping: <span style={{ color: '#16a34a' }}>Free</span></div>
                  <div style={{ ...s.detailValue, color: '#e94560', marginTop: 4 }}>Total: {formatPrice(order.total)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

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
  container: { padding: '16px', boxSizing: 'border-box', width: '100%' },
  loading: { padding: '48px', textAlign: 'center', color: '#888' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px', color: '#1a1a2e' },
  filters: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: '#555' },
  filterActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  empty: { textAlign: 'center', padding: '48px', color: '#888', background: '#fff', borderRadius: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' },
  orderId: { fontWeight: '700', fontSize: '0.88rem', marginRight: '12px', color: '#1a1a2e', fontFamily: 'monospace', letterSpacing: '0.5px' },
  date: { color: '#888', fontSize: '0.85rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' },
  total: { fontWeight: '700', color: '#1a1a2e' },
  steps: { display: 'flex', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f5f5f5' },
  step: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 },
  stepDot: { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepCheck: { color: '#fff', fontSize: '0.7rem', fontWeight: '700' },
  stepLine: { position: 'absolute', top: '12px', left: '50%', width: '100%', height: '2px', zIndex: 0 },
  stepLabel: { fontSize: '0.62rem', marginTop: '6px', textTransform: 'capitalize', textAlign: 'center' },
  items: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  item: { display: 'flex', alignItems: 'center', gap: '10px' },
  img: { width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
  itemInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  itemName: { fontWeight: '500', fontSize: '0.9rem', color: '#333' },
  itemVariant: { fontSize: '0.75rem', color: '#888' },
  itemQty: { color: '#888', fontSize: '0.8rem' },
  itemPrice: { fontWeight: '600', color: '#e94560', fontSize: '0.9rem', whiteSpace: 'nowrap' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtn: { flex: '1 1 auto', padding: '7px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.83rem', color: '#555', textAlign: 'center' },
  actionBtnPrimary: { flex: '1 1 auto', padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer', fontSize: '0.83rem', textAlign: 'center' },
  details: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f5f5f5' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' },
  detailLabel: { fontSize: '0.72rem', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  detailValue: { fontSize: '0.88rem', fontWeight: '600', color: '#1a1a2e' },
  detailMuted: { fontSize: '0.82rem', color: '#888', marginTop: '2px' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' },
  pageBtn: { padding: '7px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' },
  pageActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
};
