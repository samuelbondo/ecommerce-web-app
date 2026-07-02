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
  const [checked, setChecked] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
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

  const deleteOrder = async (id) => {
    try {
      await API.delete(`/admin/orders/${id}`);
      setOrders(p => p.filter(o => o.id !== id));
      setSelected(null); setConfirmDeleteId(null);
      notify('Order deleted');
    } catch { notify('Delete failed', 'error'); }
  };

  const applyBulkStatus = async () => {
    if (!bulkStatus || !checked.length) return;
    try {
      await API.put('/admin/orders/bulk-status', { ids: checked, status: bulkStatus });
      notify(`${checked.length} orders updated to ${bulkStatus}`);
      setChecked([]); setBulkStatus(''); load();
    } catch { notify('Bulk update failed', 'error'); }
  };

  const exportCSV = () => {
    const rows = [['ID', 'Customer', 'Email', 'Total', 'Status', 'Date'],
      ...orders.map(o => [o.id, o.customer_name, o.customer_email, o.total, o.status, new Date(o.created_at).toLocaleDateString()])];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
  };

  const toggleCheck = (id) => setChecked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setChecked(checked.length === paginated.length ? [] : paginated.map(o => o.id));

  const printInvoice = (o) => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Invoice #${o.id}</title>
      <style>body{font-family:sans-serif;padding:32px;color:#222}h1{color:#e94560}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5}tfoot td{font-weight:bold}</style>
      </head><body>
      <h1>Samuel Store</h1><h2>Invoice #${o.id}</h2>
      <p>Customer: ${o.customer_name} (${o.customer_email})</p>
      <p>Date: ${new Date(o.created_at).toLocaleDateString()}</p>
      <p>Status: ${o.status}</p>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>${o.items?.map(i => `<tr><td>${i.name}${i.variant_name ? ` <em>(${i.variant_name})</em>` : ''}</td><td>${i.quantity}</td><td>${formatPrice(i.price)}</td><td>${formatPrice(i.price * i.quantity)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="3">Grand Total</td><td>${formatPrice(o.total)}</td></tr></tfoot>
      </table></body></html>`);
    win.document.close(); win.print();
  };

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Delete Confirm */}
      {confirmDeleteId && (
        <div style={s.overlay}><div style={s.dialog}>
          <h3 style={s.dlgTitle}>Delete Order #{confirmDeleteId}?</h3>
          <p style={s.dlgText}>This cannot be undone.</p>
          <div style={s.dlgBtns}>
            <button onClick={() => setConfirmDeleteId(null)} style={s.btnCancel}>Cancel</button>
            <button onClick={() => deleteOrder(confirmDeleteId)} style={s.btnDanger}>Delete</button>
          </div>
        </div></div>
      )}

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
              {(selected.shipping_address || selected.shipping_city) && (
                <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem' }}>
                  <span style={s.detailLabel}>Shipping Address</span>
                  <span style={s.detailVal}>{[selected.shipping_address, selected.shipping_city, selected.shipping_country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              <div style={s.detailItems}>
                {selected.items?.map(i => (
                  <div key={i.id} style={s.detailItem}>
                    <img src={i.display_image || i.image_url} alt={i.name} style={s.detailImg} onError={e => { e.target.src = 'https://placehold.co/44x44?text=?'; }} />
                    <div style={{ flex: 1 }}>
                      <div style={s.detailItemName}>{i.name}</div>
                      {i.variant_name && <div style={{ fontSize: '0.75rem', color: '#e94560', fontWeight: 600, marginTop: 2 }}>{i.variant_name}</div>}
                      <div style={s.detailItemQty}>Qty: {i.quantity} &nbsp;·&nbsp; Unit: {formatPrice(i.price)}</div>
                    </div>
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
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => printInvoice(selected)} style={s.btnPrint}>🖨️ Print Invoice</button>
                <button onClick={() => setConfirmDeleteId(selected.id)} style={s.btnDanger}>🗑 Delete Order</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={s.pageHeader}>
        <div><h2 style={s.pageTitle}>Orders</h2><p style={s.pageSub}>{orders.length} total orders</p></div>
        <button onClick={exportCSV} style={{ ...s.btnPrint, padding: '9px 18px' }}>📥 Export CSV</button>
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

      {checked.length > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, padding: '10px 14px', background: '#eff6ff', borderRadius: 8 }}>
          <span style={{ fontSize: '0.85rem', color: '#1d4ed8' }}>{checked.length} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
            <option value="">Set status…</option>
            {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <button onClick={applyBulkStatus} disabled={!bulkStatus} style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}>Apply</button>
          <button onClick={() => setChecked([])} style={{ padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}>Clear</button>
        </div>
      )}

      <div style={s.tableCard}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              <th style={s.th}><input type="checkbox" checked={checked.length === paginated.length && paginated.length > 0} onChange={toggleAll} /></th>
              {['#', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={s.noData}>Loading...</td></tr>
                : paginated.length === 0 ? <tr><td colSpan={8} style={s.noData}>No orders found</td></tr>
                : paginated.map(o => (
                  <tr key={o.id} style={s.tr}>
                    <td style={s.td}><input type="checkbox" checked={checked.includes(o.id)} onChange={() => toggleCheck(o.id)} /></td>
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
                        <button onClick={() => setConfirmDeleteId(o.id)} style={s.btnDel}>🗑</button>
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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' },
  modal: { background: '#fff', borderRadius: '16px', width: '600px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' },
  modalTitle: { fontSize: '1rem', fontWeight: '700', margin: 0, color: '#1a1a2e' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' },
  modalBody: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '12px', background: '#f8f9fb', borderRadius: '10px', padding: '14px' },
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
  btnDanger: { padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' },
  btnCancel: { padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.88rem' },
  dialog: { background: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '340px', width: '90%' },
  dlgTitle: { margin: '0 0 8px', fontWeight: '700', color: '#1a1a2e' },
  dlgText: { color: '#888', fontSize: '0.9rem', marginBottom: '20px' },
  dlgBtns: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  toolbar: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  search: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', flex: '1 1 180px', minWidth: 0, outline: 'none' },
  filters: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#555' },
  filterActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  tableCard: { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
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
  btnDel: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444' },
  noData: { padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '0.88rem' },
  pagination: { display: 'flex', gap: '6px', padding: '16px', justifyContent: 'center', borderTop: '1px solid #f5f5f5' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' },
  pageActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
};
