import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Toast from '../../components/Toast';
import API from '../../api';

export default function AdminCustomers() {
  const { formatPrice } = useSettings();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ col: 'created_at', dir: 'desc' });
  const PER = 10;
  const [modal, setModal] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try { const r = await API.get('/admin/customers'); setUsers(r.data); }
    catch { setToast({ message: 'Failed to load customers', type: 'error' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  const openModal = async (u) => {
    setModal('view'); setModalUser(u); setNotes(u.admin_notes || '');
    setModalLoading(true);
    try { const r = await API.get(`/admin/customers/${u.id}/orders`); setModalUser(p => ({ ...p, orders: r.data })); }
    catch { setModalUser(p => ({ ...p, orders: [] })); }
    finally { setModalLoading(false); }
  };
  const saveNotes = async () => {
    setNotesSaving(true);
    try { await API.put(`/admin/customers/${modalUser.id}/notes`, { notes }); setUsers(p => p.map(u => u.id === modalUser.id ? { ...u, admin_notes: notes } : u)); setToast({ message: 'Notes saved', type: 'success' }); }
    catch { setToast({ message: 'Failed to save notes', type: 'error' }); }
    finally { setNotesSaving(false); }
  };

  const quickToggleStatus = async (u) => {
    const next = u.status === 'active' ? 'suspended' : 'active';
    try { await API.put(`/admin/customers/${u.id}/status`, { status: next }); setUsers(p => p.map(x => x.id === u.id ? { ...x, status: next } : x)); setToast({ message: `User ${next}`, type: 'success' }); }
    catch { setToast({ message: 'Failed to update status', type: 'error' }); }
  };

  const toggleSort = (col) => setSort(p => ({ col, dir: p.col === col && p.dir === 'asc' ? 'desc' : 'asc' }));
  const sortIcon = (col) => sort.col === col ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅';

  const deleteUser = async (id) => {
    try { await API.delete(`/admin/customers/${id}`); setUsers(p => p.filter(u => u.id !== id)); setModal(null); setToast({ message: 'Customer deleted', type: 'success' }); }
    catch { setToast({ message: 'Failed to delete customer', type: 'error' }); }
  };
  const exportCSV = () => { const rows = [['ID','Name','Email','Role','Status','Joined'], ...users.map(u => [u.id, u.name, u.email, u.role, u.status || 'active', u.created_at])]; const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'customers.csv'; a.click(); };

  const filtered = users.filter(u => (search === '' || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) && (roleFilter === 'all' || u.role === roleFilter) && (statusFilter === 'all' || (u.status || 'active') === statusFilter));
  const sorted = [...filtered].sort((a, b) => { const v = sort.dir === 'asc' ? 1 : -1; return (a[sort.col] ?? '') > (b[sort.col] ?? '') ? v : -v; });
  const totalPages = Math.ceil(sorted.length / PER);
  const paginated = sorted.slice((page - 1) * PER, page * PER);

  return (
    <div style={{ padding: '24px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Customers</h2>

        <button onClick={exportCSV} style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Export CSV</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email…" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, flex: 1, minWidth: 200 }} />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}><option value="all">All Roles</option><option value="customer">Customer</option><option value="admin">Admin</option></select>

        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}><option value="all">All Status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      {loading ? <p>Loading…</p> : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>

          <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            {[['id','ID'],['name','Name'],['email','Email'],['role','Role'],['status','Status'],['created_at','Joined']].map(([col, label]) => (
              <th key={col} onClick={() => toggleSort(col)} style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}{sortIcon(col)}</th>
            ))}
            <th style={{ padding: '10px 12px' }}>Actions</th>
          </tr></thead>

          <tbody>{paginated.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '10px 12px' }}>{u.id}</td>
              <td style={{ padding: '10px 12px' }}>{u.name}</td>
              <td style={{ padding: '10px 12px' }}>{u.email}</td>

              <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: u.role === 'admin' ? '#dbeafe' : '#f3f4f6', color: u.role === 'admin' ? '#1d4ed8' : '#374151' }}>{u.role}</span></td>
              <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: (u.status || 'active') === 'active' ? '#dcfce7' : '#fee2e2', color: (u.status || 'active') === 'active' ? '#16a34a' : '#dc2626' }}>{u.status || 'active'}</span></td>
              <td style={{ padding: '10px 12px' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
              <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                <button onClick={() => openModal(u)} style={{ padding: '4px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>View</button>
                <button onClick={() => quickToggleStatus(u)} style={{ padding: '4px 10px', background: (u.status || 'active') === 'active' ? '#f59e0b' : '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>{(u.status || 'active') === 'active' ? 'Suspend' : 'Activate'}</button>
              </td>
            </tr>
          ))}</tbody>

        </table>
      </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 12px', background: p === page ? '#2563eb' : '#f3f4f6', color: p === page ? '#fff' : '#374151', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      )}

      {modal === 'view' && modalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Customer #{modalUser.id}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <p><strong>Name:</strong> {modalUser.name}</p>
            <p><strong>Email:</strong> {modalUser.email}</p>
            <p><strong>Role:</strong> {modalUser.role}</p>
            <p><strong>Status:</strong> {modalUser.status || 'active'}</p>
            <p><strong>Joined:</strong> {modalUser.created_at ? new Date(modalUser.created_at).toLocaleDateString() : '—'}</p>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Admin Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, resize: 'vertical', boxSizing: 'border-box' }} />
              <button onClick={saveNotes} disabled={notesSaving} style={{ marginTop: 6, padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{notesSaving ? 'Saving…' : 'Save Notes'}</button>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Order History</h4>
              {modalLoading ? <p>Loading…</p> : modalUser.orders?.length ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#f9fafb' }}><th style={{ padding: '6px 8px', textAlign: 'left' }}>Order</th><th style={{ padding: '6px 8px', textAlign: 'left' }}>Date</th><th style={{ padding: '6px 8px', textAlign: 'left' }}>Total</th><th style={{ padding: '6px 8px', textAlign: 'left' }}>Status</th></tr></thead>
                  <tbody>{modalUser.orders.map(o => (<tr key={o.id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '6px 8px' }}>#{o.id}</td><td style={{ padding: '6px 8px' }}>{new Date(o.created_at).toLocaleDateString()}</td><td style={{ padding: '6px 8px' }}>{formatPrice(o.total_amount)}</td><td style={{ padding: '6px 8px' }}>{o.status}</td></tr>))}</tbody>
                </table>
              ) : <p style={{ color: '#6b7280' }}>No orders yet.</p>}
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => quickToggleStatus(modalUser)} style={{ padding: '8px 16px', background: (modalUser.status || 'active') === 'active' ? '#f59e0b' : '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{(modalUser.status || 'active') === 'active' ? 'Suspend User' : 'Activate User'}</button>
              {!confirmDelete ? <button onClick={() => setConfirmDelete(true)} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
              : <span><span style={{ marginRight: 8, fontSize: 13 }}>Sure?</span><button onClick={() => deleteUser(modalUser.id)} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 6 }}>Yes</button><button onClick={() => setConfirmDelete(false)} style={{ padding: '6px 12px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>No</button></span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
