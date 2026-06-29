import { useEffect, useState } from 'react';
import Toast from '../../components/Toast';
import API from '../../api';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  const notify = (msg, type = 'success') => setToast({ message: msg, type });
  const load = () => API.get('/admin/inventory').then(r => setProducts(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const updateStock = async (id) => {
    const stock = editing[id];
    if (stock === undefined || stock === '') return;
    try {
      await API.put(`/admin/inventory/${id}`, { stock: Number(stock) });
      notify('Stock updated!');
      setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
      load();
    } catch { notify('Update failed', 'error'); }
  };

  const stockColor = (s) => s === 0 ? '#ef4444' : s <= 5 ? '#f59e0b' : '#10b981';
  const stockLabel = (s) => s === 0 ? 'Out of Stock' : s <= 5 ? 'Low Stock' : 'In Stock';

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={s.pageHeader}>
        <div><h2 style={s.pageTitle}>Inventory</h2><p style={s.pageSub}>{products.length} products tracked</p></div>
      </div>

      <div style={s.summary}>
        {[
          { label: 'In Stock', count: products.filter(p => p.stock > 5).length, color: '#10b981' },
          { label: 'Low Stock', count: products.filter(p => p.stock > 0 && p.stock <= 5).length, color: '#f59e0b' },
          { label: 'Out of Stock', count: products.filter(p => p.stock === 0).length, color: '#ef4444' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ ...s.summaryCard, borderTop: `4px solid ${color}` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color }}>{count}</div>
            <div style={s.summaryLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={s.toolbar}>
        <input value={search} onChange={e => setSearch(e.target.value)} style={s.search} placeholder="🔍 Search products..." />
      </div>

      <div style={s.tableCard}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {['Product', 'Category', 'Current Stock', 'Status', 'Adjust Stock'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={s.noData}>Loading...</td></tr>
                : filtered.map(p => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.prodRow}>
                        <img src={p.image_url} alt={p.name} style={s.thumb} onError={e => { e.target.src = 'https://placehold.co/36x36?text=?'; }} />
                        <span style={s.prodName}>{p.name}</span>
                      </div>
                    </td>
                    <td style={s.td}>{p.category || '—'}</td>
                    <td style={s.td}><b>{p.stock}</b></td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, color: stockColor(p.stock), background: stockColor(p.stock) + '18' }}>
                        {stockLabel(p.stock)}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.adjustRow}>
                        <input
                          type="number" min="0"
                          value={editing[p.id] !== undefined ? editing[p.id] : p.stock}
                          onChange={e => setEditing(prev => ({ ...prev, [p.id]: e.target.value }))}
                          style={s.stockInput}
                        />
                        <button onClick={() => updateStock(p.id)} style={s.btnSave}>Save</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
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
  summary: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' },
  summaryCard: { background: '#fff', borderRadius: '12px', padding: '18px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  summaryLabel: { color: '#888', fontSize: '0.82rem', marginTop: '4px' },
  toolbar: { marginBottom: '14px' },
  search: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', width: '280px', outline: 'none' },
  tableCard: { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9fb' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 14px', fontSize: '0.85rem', verticalAlign: 'middle' },
  prodRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  thumb: { width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 },
  prodName: { fontWeight: '600', color: '#1a1a2e', fontSize: '0.85rem' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  adjustRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  stockInput: { width: '72px', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '0.88rem', outline: 'none' },
  btnSave: { padding: '7px 14px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  noData: { padding: '32px', textAlign: 'center', color: '#aaa' },
};
