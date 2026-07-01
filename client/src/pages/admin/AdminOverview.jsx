import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import API from '../../api';

const STAT_CONFIG = [
  { key: 'revenue', label: 'Total Revenue', icon: '💰', color: '#8b5cf6' },
  { key: 'todaySales', label: "Today's Sales", icon: '📈', color: '#10b981' },
  { key: 'monthlySales', label: 'Monthly Sales', icon: '📅', color: '#3b82f6' },
  { key: 'orders', label: 'Total Orders', icon: '📦', color: '#f59e0b' },
  { key: 'customers', label: 'Customers', icon: '👥', color: '#e94560' },
  { key: 'products', label: 'Products', icon: '🏷️', color: '#06b6d4' },
  { key: 'pending', label: 'Pending Orders', icon: '⏳', color: '#f97316' },
  { key: 'lowStock', label: 'Low Stock', icon: '⚠️', color: '#eab308' },
  { key: 'outOfStock', label: 'Out of Stock', icon: '🚫', color: '#ef4444' },
];

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

export default function AdminOverview() {
  const { formatPrice } = useSettings();
  const [stats, setStats] = useState({});
  const [monthly, setMonthly] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/monthly-revenue'),
      API.get('/admin/top-products'),
      API.get('/admin/orders'),
      API.get('/admin/inventory'),
    ]).then(([s, m, t, o, inv]) => {
      setStats(s.data);
      setMonthly(m.data);
      setTopProducts(t.data);
      setRecentOrders(o.data.slice(0, 7));
      setLowStockItems(inv.data.filter(p => p.stock <= 5).slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  const maxRevenue = Math.max(...monthly.map(m => m.revenue), 1);

  if (loading) return <div style={s.loading}>Loading dashboard...</div>;

  return (
    <div style={s.wrap}>
      {/* Stats Grid */}
      <div className="adm-stats-grid">
        {STAT_CONFIG.map(({ key, label, icon, color }) => (
          <div key={key} style={{ ...s.statCard, borderTop: `4px solid ${color}` }}>
            <div style={{ ...s.statIcon, background: color + '18', color }}>{icon}</div>
            <div>
              <div style={s.statVal}>
                {['revenue','todaySales','monthlySales'].includes(key)
                  ? formatPrice(stats[key] || 0)
                  : (stats[key] || 0)}
              </div>
              <div style={s.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-row2">
        {/* Revenue Chart */}
        <div style={s.chartCard}>
          <h3 style={s.cardTitle}>Revenue — Last 6 Months</h3>
          {monthly.length === 0 ? <p style={s.noData}>No data yet</p> : (
            <div style={s.barChart}>
              {monthly.map(m => (
                <div key={m.m} style={s.barCol}>
                  <div style={s.barVal}>{formatPrice(m.revenue)}</div>
                  <div style={s.barWrap}>
                    <div style={{ ...s.bar, height: `${(m.revenue / maxRevenue) * 140}px`, background: '#3b82f6' }} />
                  </div>
                  <div style={s.barLabel}>{m.month}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div style={s.topCard}>
          <h3 style={s.cardTitle}>Top Selling Products</h3>
          {topProducts.map((p, i) => (
            <div key={p.id} style={s.topRow}>
              <span style={s.rank}>#{i + 1}</span>
              <img src={p.image_url} alt={p.name} style={s.topImg} onError={e => { e.target.src = 'https://placehold.co/36x36?text=?'; }} />
              <div style={s.topInfo}>
                <div style={s.topName}>{p.name}</div>
                <div style={s.topSub}>{p.sold} sold</div>
              </div>
              <div style={s.topRevenue}>{formatPrice(p.revenue)}</div>
            </div>
          ))}
          {topProducts.length === 0 && <p style={s.noData}>No sales data yet</p>}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div style={{ ...s.tableCard, marginBottom: 24 }}>
          <h3 style={{ ...s.cardTitle, color: '#f59e0b' }}>⚠️ Low Stock Alert ({lowStockItems.length})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {lowStockItems.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: p.stock === 0 ? '#fef2f2' : '#fffbeb', borderRadius: 8, border: `1px solid ${p.stock === 0 ? '#fecaca' : '#fde68a'}` }}>
                <img src={p.image_url} alt={p.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} onError={e => { e.target.src = 'https://placehold.co/32x32?text=?'; }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1a2e' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: p.stock === 0 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div style={s.tableCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ ...s.cardTitle, margin: 0 }}>Recent Orders</h3>
          {stats.pending > 0 && <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#d97706', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>⏳ {stats.pending} pending</span>}
        </div>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id} style={s.tr}>
                  <td style={s.td}><span style={s.orderId}>#{o.id}</span></td>
                  <td style={s.td}><div style={s.custName}>{o.customer_name}</div><div style={s.custEmail}>{o.customer_email}</div></td>
                  <td style={s.td}>{o.items?.length || 0} item(s)</td>
                  <td style={s.td}><b>{formatPrice(o.total)}</b></td>
                  <td style={s.td}><span style={{ ...s.badge, background: STATUS_COLOR[o.status] + '20', color: STATUS_COLOR[o.status] }}>{o.status}</span></td>
                  <td style={s.td}>{new Date(o.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && <tr><td colSpan={6} style={s.noData}>No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { padding: '24px' },
  loading: { padding: '60px', textAlign: 'center', color: '#888' },
  statsGrid: { marginBottom: '24px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  statIcon: { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
  statVal: { fontSize: '1.15rem', fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: '0.75rem', color: '#888', marginTop: '2px' },
  row2: { marginBottom: '24px' },
  chartCard: { background: '#fff', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  topCard: { background: '#fff', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', margin: '0 0 18px' },
  barChart: { display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', paddingBottom: '4px' },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  barVal: { fontSize: '0.6rem', color: '#888', textAlign: 'center' },
  barWrap: { display: 'flex', alignItems: 'flex-end', height: '140px' },
  bar: { width: '32px', borderRadius: '6px 6px 0 0', minHeight: '4px', transition: 'height 0.5s' },
  barLabel: { fontSize: '0.75rem', color: '#888', fontWeight: '600' },
  topRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  rank: { width: '22px', fontWeight: '800', color: '#aaa', fontSize: '0.8rem' },
  topImg: { width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 },
  topInfo: { flex: 1 },
  topName: { fontSize: '0.83rem', fontWeight: '600', color: '#1a1a2e' },
  topSub: { fontSize: '0.72rem', color: '#aaa' },
  topRevenue: { fontSize: '0.83rem', fontWeight: '700', color: '#10b981' },
  noData: { color: '#aaa', textAlign: 'center', padding: '20px', fontSize: '0.85rem' },
  tableCard: { background: '#fff', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  tableWrap: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9fb' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 14px', fontSize: '0.85rem', color: '#333', verticalAlign: 'middle' },
  orderId: { fontWeight: '700', color: '#1a1a2e' },
  custName: { fontWeight: '600', fontSize: '0.85rem' },
  custEmail: { fontSize: '0.75rem', color: '#aaa' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', textTransform: 'capitalize' },
};
