import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import API from '../../api';

export default function AdminReports() {
  const { formatPrice } = useSettings();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tab, setTab] = useState('sales');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.get('/admin/orders'), API.get('/admin/products'), API.get('/admin/customers')])
      .then(([o, p, c]) => { setOrders(o.data); setProducts(p.data); setCustomers(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const delivered = orders.filter(o => o.status === 'delivered');
  const cancelled = orders.filter(o => o.status === 'cancelled');
  const lowStock = products.filter(p => p.stock <= 5);

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename + '.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = ['sales', 'products', 'customers', 'inventory'];

  return (
    <div style={s.wrap}>
      <div style={s.pageHeader}>
        <div><h2 style={s.pageTitle}>Reports</h2><p style={s.pageSub}>Export and analyze your store data</p></div>
      </div>

      {/* Summary Cards */}
      <div style={s.summaryGrid}>
        {[
          { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: '💰', color: '#8b5cf6' },
          { label: 'Total Orders', value: orders.length, icon: '📦', color: '#3b82f6' },
          { label: 'Delivered', value: delivered.length, icon: '✅', color: '#10b981' },
          { label: 'Cancelled', value: cancelled.length, icon: '❌', color: '#ef4444' },
          { label: 'Customers', value: customers.length, icon: '👥', color: '#e94560' },
          { label: 'Low Stock', value: lowStock.length, icon: '⚠️', color: '#f59e0b' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ ...s.card, borderTop: `4px solid ${color}` }}>
            <span style={{ fontSize: '1.3rem' }}>{icon}</span>
            <div><div style={s.cardVal}>{value}</div><div style={s.cardLbl}>{label}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Table + Export */}
      <div style={s.tableCard}>
        <div style={s.tableHeader}>
          <h3 style={s.tableTitle}>{tab.charAt(0).toUpperCase() + tab.slice(1)} Report</h3>
          <button onClick={() => {
            if (tab === 'sales') exportCSV(orders.map(o => ({ id: o.id, customer: o.customer_name, total: o.total, status: o.status, date: o.created_at })), 'sales_report');
            if (tab === 'products') exportCSV(products.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock, category: p.category })), 'products_report');
            if (tab === 'customers') exportCSV(customers.map(c => ({ id: c.id, name: c.name, email: c.email, orders: c.total_orders, spent: c.total_spent })), 'customers_report');
            if (tab === 'inventory') exportCSV(lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock, category: p.category })), 'inventory_report');
          }} style={s.btnExport}>⬇️ Export CSV</button>
        </div>
        <div style={s.tableWrap}>
          {loading ? <p style={s.noData}>Loading...</p> : (
            <table style={s.table}>
              {tab === 'sales' && <>
                <thead><tr style={s.thead}>{['#', 'Customer', 'Total', 'Status', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{orders.slice(0, 20).map(o => (
                  <tr key={o.id} style={s.tr}>
                    <td style={s.td}>#{o.id}</td>
                    <td style={s.td}>{o.customer_name}</td>
                    <td style={s.td}><b>{formatPrice(o.total)}</b></td>
                    <td style={s.td}><span style={{ ...s.badge, color: o.status === 'delivered' ? '#10b981' : o.status === 'cancelled' ? '#ef4444' : '#f59e0b', background: (o.status === 'delivered' ? '#10b981' : o.status === 'cancelled' ? '#ef4444' : '#f59e0b') + '18' }}>{o.status}</span></td>
                    <td style={s.td}>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </>}
              {tab === 'products' && <>
                <thead><tr style={s.thead}>{['#', 'Name', 'Price', 'Stock', 'Category'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{products.map(p => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}>{p.id}</td>
                    <td style={s.td}>{p.name}</td>
                    <td style={s.td}>{formatPrice(p.price)}</td>
                    <td style={s.td}>{p.stock}</td>
                    <td style={s.td}>{p.category}</td>
                  </tr>
                ))}</tbody>
              </>}
              {tab === 'customers' && <>
                <thead><tr style={s.thead}>{['#', 'Name', 'Email', 'Orders', 'Total Spent', 'Joined'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{customers.map(c => (
                  <tr key={c.id} style={s.tr}>
                    <td style={s.td}>{c.id}</td>
                    <td style={s.td}>{c.name}</td>
                    <td style={s.td}>{c.email}</td>
                    <td style={s.td}>{c.total_orders}</td>
                    <td style={s.td}>{formatPrice(c.total_spent)}</td>
                    <td style={s.td}>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </>}
              {tab === 'inventory' && <>
                <thead><tr style={s.thead}>{['#', 'Product', 'Stock', 'Category', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{lowStock.map(p => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}>{p.id}</td>
                    <td style={s.td}>{p.name}</td>
                    <td style={s.td}><b style={{ color: p.stock === 0 ? '#ef4444' : '#f59e0b' }}>{p.stock}</b></td>
                    <td style={s.td}>{p.category}</td>
                    <td style={s.td}><span style={{ color: p.stock === 0 ? '#ef4444' : '#f59e0b', fontSize: '0.78rem', fontWeight: '600' }}>{p.stock === 0 ? 'Out of Stock' : 'Low Stock'}</span></td>
                  </tr>
                ))}</tbody>
              </>}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { padding: '24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '14px', marginBottom: '24px' },
  card: { background: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardVal: { fontSize: '1.1rem', fontWeight: '800', color: '#1a1a2e' },
  cardLbl: { fontSize: '0.72rem', color: '#888', marginTop: '2px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  tabBtn: { padding: '7px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: '#555' },
  tabActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  tableCard: { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f5f5f5' },
  tableTitle: { margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1a1a2e' },
  btnExport: { padding: '8px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.83rem', fontWeight: '600' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9fb' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '11px 14px', fontSize: '0.85rem', color: '#333', verticalAlign: 'middle' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', textTransform: 'capitalize' },
  noData: { textAlign: 'center', padding: '32px', color: '#aaa' },
};
