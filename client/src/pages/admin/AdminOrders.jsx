import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Toast from '../../components/Toast';
import API from '../../api';

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };
const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { formatPrice } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const PER = 10;

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const load = () => API.get('/admin/orders').then(r => setOrders(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch = o.customer_name?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
    return matchFilter && matchSearch;
  });

  const pages = Math.ceil(filtered.length / PER);
  const paginated = filtered.slice((page - 1) * PER, page * PER);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/admin/orders/${id}/status`, { status });
      notify(`Order #${id} marked as ${status}`);
      load();
    } catch { notify('Update failed', 'error'); }
  };

  const printInvoice = (o) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Invoice #${o.id}</title>
      <style>body{font-family:sans-serif;padding:32px;color:#222}h1{color:#e94560}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5}tfoot td{font-weight:bold}</style>
      </head><body>
      <h1>Samuel Store</h1><h2>Invoice #${o.id}</h2>
      <p>Customer: ${o.customer_name} (${o.customer_email})</p>
      <p>Date: ${new Date(o.created_at).toLocaleDateString()}</p>
      <p>Status: ${o.status}</p>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>${o.items?.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${formatPrice(i.price)}</td><td>${formatPrice(i.price * i.quantity)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="3">Grand Total</td><td>${formatPrice(o.total)}</td></tr></tfoot>
      </table></body></html>`);
    win.document.close(); win.print();
  };

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Order Detail Modal */}
      {selected && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Order #{selected.id} — {selected.customer_name}</h3>
              <button onClick={() => setSelected(null)} style={s.closeBtn}>×</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.detailGrid}>
                <div><span style={s.detailLabel}>Customer</span><span style={s.detailVal}>{selected.customer_name}</span></div>
                <div><span style={s.detailLabel}>Email</span><span style={s.detailVal}>{selected.customer_email}</span></div>
                <div><span style={s.detailLabel}>Date</span><span style={s.detailVal}>{new Date(selected.created_at).toLocaleDateString()}</span></div>
                <div><span style={s.detailLabel}>Total</span><span style={{ ...s.detailVal, color: '#e94560', fontWeight: '700' }}>{formatPrice(selected.total)}</span></div>
              </div>
              <div style={s.detailItems}>
                {selected.items?.map(i => (
                  <div key={i.id} style={s.detailItem}>
                    <img src={i.image_url} alt={i.name} style={s.detailImg} onError={e => { e.target.src = 'https://placehold.co/44x44?text=?'; }} />
                    <div style={{ flex: 1 }}><div style={s.detailItemName}>{i.name}</div><div style={s.detailItemQty}>Qty: {i.quantity}</div></div>
                    <div style={s.detailItemPrice}>{formatPrice(i.price * i.quantity)}</div>
                  </div>
                ))}
              </div>
              <div style={s.detailStatus}>
                <label style={s.label}>Update Status</label>
                <div style={s.statusBtns}>
                  {STATUSES.map(st => (
                    <button key={st} onClick={() => { updateStatus(selected.id, st); setSelected({ ...selected, status: st }); }}
                      style={{ ...s.statusBtn, background: selected.status === st ? STATUS_COLOR[st] : '#f5f5f5', color: selected.status === st ? '#fff' : '#555' }}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => printInvoice(selected)} style={s.btnPrint}>🖨️ Print Invoice</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.pageHeader}>
        <div><h2 style={s.pageTitle}>Orders</h2><p style={s.pageSub}>{orders.length} total orders</p></div>
      </div>

      <div style={s.toolbar}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={s.search} placeholder="🔍 Search by name or order ID..." />
        <div style={s.filters}>
          {['all', ...STATUSES].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={s.tableCard}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {['#', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={s.noData}>Loading...</td></tr>
                : paginated.length === 0 ? <tr><td colSpan={7} style={s.noData}>No orders found</td></tr>
                : paginated.map(o => (
                  <tr key={o.id} style={s.tr}>
                    <td style={s.td}><b style={{ color: '#1a1a2e' }}>#{o.id}</b></td>
                    <td style={s.td}><div style={s.custName}>{o.customer_name}</div><div style={s.custEmail}>{o.customer_email}</div></td>
                    <td style={s.td}>{o.items?.length || 0}</td>
                    <td style={s.td}><b>{formatPrice(o.total)}</b></td>
                    <td style={s.td}><span style={{ ...s.badge, background: STATUS_COLOR[o.status] + '20', color: STATUS_COLOR[o.status] }}>{o.status}</span></td>
                    <td style={s.td}>{new Date(o.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button onClick={() => setSelected(o)} style={s.btnView}>👁 View</button>
                        <button onClick={() => printInvoice(o)} style={s.btnPrint2}>🖨️</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={s.pagination}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={s.pageBtn}>← Prev</button>
            {Array.from({ length: pages }, (_, i) => <button key={i} onClick={() => setPage(i + 1)} style={{ ...s.pageBtn, ...(page === i + 1 ? s.pageActive : {}) }}>{i + 1}</button>)}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} style={s.pageBtn}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: { padding: '24px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#fff', borderRadius: '16px', width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' },
  modalTitle: { fontSize: '1rem', fontWeight: '700', margin: 0, color: '#1a1a2e' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' },
  modalBody: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8f9fb', borderRadius: '10px', padding: '14px' },
  detailLabel: { display: 'block', fontSize: '0.72rem', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' },
  detailVal: { fontSize: '0.88rem', color: '#333', fontWeight: '500' },
  detailItems: { display: 'flex', flexDirection: 'column', gap: '10px' },
  detailItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f8f9fb', borderRadius: '8px' },
  detailImg: { width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 },
  detailItemName: { fontWeight: '600', fontSize: '0.85rem', color: '#1a1a2e' },
  detailItemQty: { fontSize: '0.75rem', color: '#aaa' },
  detailItemPrice: { fontWeight: '700', color: '#e94560', fontSize: '0.85rem' },
  detailStatus: { display: 'flex', flexDirection: 'column', gap: '8px' },
  statusBtns: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  statusBtn: { padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', textTransform: 'capitalize' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#555' },
  btnPrint: { padding: '10px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  toolbar: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  search: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', width: '280px', outline: 'none' },
  filters: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#555' },
  filterActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  tableCard: { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9fb' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 14px', fontSize: '0.85rem', verticalAlign: 'middle' },
  custName: { fontWeight: '600', fontSize: '0.85rem', color: '#1a1a2e' },
  custEmail: { fontSize: '0.73rem', color: '#aaa' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', textTransform: 'capitalize' },
  actions: { display: 'flex', gap: '6px' },
  btnView: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#555' },
  btnPrint2: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem' },
  noData: { padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '0.88rem' },
  pagination: { display: 'flex', gap: '6px', padding: '16px', justifyContent: 'center', borderTop: '1px solid #f5f5f5' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' },
  pageActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
};
