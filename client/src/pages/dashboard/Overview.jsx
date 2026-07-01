import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import API from '../../api';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...s.card, borderTop: `4px solid ${color}` }}>
    <div style={{ ...s.cardIcon, background: color + '20', color }}>{icon}</div>
    <div>
      <div style={s.cardValue}>{value}</div>
      <div style={s.cardLabel}>{label}</div>
    </div>
  </div>
);

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

export default function Overview() {
  const { user } = useAuth();
  const { formatPrice } = useSettings();
  const { cart } = useCart();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([API.get(`/orders/${user.id}`), API.get('/products')])
      .then(([o, p]) => { setOrders(o.data); setProducts(p.data.slice(0, 4)); })
      .finally(() => setLoading(false));
  }, [user]);

  const total = orders.length;
  const pending = orders.filter(o => o.status === 'pending').length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const spent = orders.reduce((sum, o) => sum + Number(o.total), 0);

  if (loading) return <div style={s.loading}>Loading dashboard...</div>;

  return (
    <div style={s.container}>
      <div style={s.welcome}>
        <div>
          <h2 style={s.welcomeTitle}>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p style={s.welcomeSub}>Here's what's happening with your account today.</p>
        </div>
        <Link to="/products" style={s.shopBtn}>🛍 Shop Now</Link>
      </div>

      <div style={s.statsGrid}>
        <StatCard icon="📦" label="Total Orders" value={total} color="#3b82f6" />
        <StatCard icon="⏳" label="Pending" value={pending} color="#f59e0b" />
        <StatCard icon="✅" label="Delivered" value={delivered} color="#10b981" />
        <StatCard icon="❌" label="Cancelled" value={cancelled} color="#ef4444" />
        <StatCard icon="💰" label="Total Spent" value={formatPrice(spent)} color="#8b5cf6" />
        <StatCard icon="🛒" label="Cart Items" value={cart.length} color="#e94560" />
      </div>

      {total > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Order Breakdown</h3>
          <div style={s.barWrap}>
            {[['Pending', pending, '#f59e0b'], ['Delivered', delivered, '#10b981'], ['Cancelled', cancelled, '#ef4444']].map(([label, count, color]) => (
              <div key={label} style={s.barRow}>
                <span style={s.barLabel}>{label}</span>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${total ? (count / total) * 100 : 0}%`, background: color }} />
                </div>
                <span style={s.barCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Recent Orders</h3>
          <Link to="/dashboard/orders" style={s.viewAll}>View all →</Link>
        </div>
        {orders.length === 0 ? (
          <div style={s.empty}>
            <p>📭 No orders yet.</p>
            <Link to="/products" style={s.emptyBtn}>Browse Products</Link>
          </div>
        ) : (
          <div className="dash-order-table">
            <div className="dash-order-head">
              <span>Order</span><span>Date</span><span>Amount</span><span>Status</span>
            </div>
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="dash-order-row">
                <span style={s.orderId}>#{o.id}</span>
                <span style={s.muted}>{new Date(o.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span style={s.amount}>{formatPrice(o.total)}</span>
                <span style={{ ...s.badge, background: STATUS_COLOR[o.status] + '20', color: STATUS_COLOR[o.status] }}>{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Recommended For You</h3>
          <Link to="/products" style={s.viewAll}>See all →</Link>
        </div>
        <div style={s.productGrid}>
          {products.map(p => (
            <Link to={`/products/${p.id}`} key={p.id} style={s.productCard}>
              <img src={p.image_url} alt={p.name} style={s.productImg} onError={e => { e.target.src = 'https://placehold.co/120x120?text=?'; }} />
              <div style={s.productName}>{p.name}</div>
              <div style={s.productPrice}>{formatPrice(p.price)}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { padding: '24px' },
  loading: { padding: '48px', textAlign: 'center', color: '#888' },
  welcome: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: '16px', padding: '28px 32px', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
  welcomeTitle: { color: '#fff', fontSize: '1.5rem', margin: 0 },
  welcomeSub: { color: '#a0aec0', marginTop: '6px', fontSize: '0.9rem' },
  shopBtn: { background: '#e94560', color: '#fff', padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', marginBottom: '28px' },
  card: { background: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 },
  cardValue: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a2e' },
  cardLabel: { fontSize: '0.8rem', color: '#888', marginTop: '2px' },
  section: { background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '1.05rem', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  viewAll: { color: '#e94560', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' },
  barWrap: { display: 'flex', flexDirection: 'column', gap: '14px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  barLabel: { width: '80px', fontSize: '0.85rem', color: '#555' },
  barTrack: { flex: 1, height: '10px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '99px', transition: 'width 0.6s ease' },
  barCount: { width: '24px', textAlign: 'right', fontSize: '0.85rem', color: '#555', fontWeight: '600' },
  table: {},
  tableHead: {},
  tableRow: {},
  orderId: { fontWeight: '700', color: '#1a1a2e', fontSize: '0.9rem' },
  muted: { color: '#888', fontSize: '0.85rem' },
  amount: { fontWeight: '600', color: '#1a1a2e', fontSize: '0.9rem' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' },
  empty: { textAlign: 'center', padding: '32px', color: '#888' },
  emptyBtn: { display: 'inline-block', marginTop: '12px', padding: '8px 20px', background: '#e94560', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' },
  productCard: { borderRadius: '10px', border: '1px solid #f0f0f0', padding: '12px', textDecoration: 'none', color: '#333', textAlign: 'center' },
  productImg: { width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' },
  productName: { fontSize: '0.82rem', fontWeight: '600', color: '#333', marginBottom: '4px' },
  productPrice: { fontSize: '0.82rem', color: '#e94560', fontWeight: '700' },
};
