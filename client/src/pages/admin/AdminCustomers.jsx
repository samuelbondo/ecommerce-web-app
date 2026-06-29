import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Toast from '../../components/Toast';
import API from '../../api';

export default function AdminCustomers() {
  const { formatPrice } = useSettings();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const PER = 10;

  const notify = (msg, type = 'success') => setToast({ message: msg, type });
  const load = () => API.get('/admin/customers').then(r => setCustomers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );
  const pages = Math.ceil(filtered.length / PER);
  const paginated = filtered.slice((page - 1) * PER, page * PER);

  const toggleRole = async (c) => {
    const role = c.role === 'admin' ? 'customer' : 'admin';
    try {
      await API.put(`/admin/customers/${c.id}/role`, { role });
      notify(`${c.name} is now ${role}`);
      load();
    } catch { notify('Update failed', 'error'); }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return notify('Min 6 characters', 'error');
    try {
      await API.put(`/admin/customers/${selected.id}/reset-password`, { password: newPassword });
      notify('Password reset successfully!');
      setNewPassword(''); setSelected(null);
    } catch { notify('Reset failed', 'error'); }
  };

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {selected && (
        <div style={s.overlay}><div style={s.modal}>
          <div style={s.modalHeader}>
            <h3 style={s.modalTitle}>Customer — {selected.name}</h3>
            <button onClick={() => setSelected(null)} style={s.closeBtn}>×</button>
          </div>
          <div style={s.modalBody}>
            <div style={s.profileCard}>
              <div style={s.avatar}>{selected.name?.charAt(0).toUpperCase()}</div>
              <div>
                <div style={s.custName}>{selected.name}</div>
                <div style={s.custEmail}>{selected.email}</div>
                <span style={{ ...s.roleBadge, background: selected.role === 'admin' ? '#8b5cf6' : '#10b981' }}>{selected.role}</span>
              </div>
            </div>
            <div style={s.statsRow}>
              <div style={s.statBox}><div style={s.statNum}>{selected.total_orders}</div><div style={s.statLbl}>Orders</div></div>
              <div style={s.statBox}><div style={s.statNum}>{formatPrice(selected.total_spent)}</div><div style={s.statLbl}>Total Spent</div></div>
              <div style={s.statBox}><div style={s.statNum}>{new Date(selected.created_at).toLocaleDateString()}</div><div style={s.statLbl}>Joined</div></div>
            </div>
            <div style={s.section}>
              <label style={s.label}>Reset Password</label>
              <div style={s.pwRow}>
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)} style={s.input} type="password" placeholder="New password (min 6 chars)" />
                <button onClick={resetPassword} style={s.btnPrimary}>Reset</button>
              </div>
            </div>
            <button onClick={() => { toggleRole(selected); setSelected(null); }} style={{ ...s.btnRole, background: selected.role === 'admin' ? '#f59e0b' : '#8b5cf6' }}>
              {selected.role === 'admin' ? '⬇️ Demote to Customer' : '⬆️ Promote to Admin'}
            </button>
          </div>
        </div></div>
      )}

      <div style={s.pageHeader}>
        <div><h2 style={s.pageTitle}>Customers</h2><p style={s.pageSub}>{customers.length} registered customers</p></div>
      </div>

      <div style={s.toolbar}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={s.search} placeholder="🔍 Search by name or email..." />
      </div>

      <div style={s.tableCard}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {['Customer', 'Email', 'Role', 'Orders', 'Total Spent', 'Joined', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={s.noData}>Loading...</td></tr>
                : paginated.length === 0 ? <tr><td colSpan={7} style={s.noData}>No customers found</td></tr>
                : paginated.map(c => (
                  <tr key={c.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.custRow}>
                        <div style={s.avatarSm}>{c.name?.charAt(0).toUpperCase()}</div>
                        <span style={s.custNameTd}>{c.name}</span>
                      </div>
                    </td>
                    <td style={s.td}>{c.email}</td>
                    <td style={s.td}><span style={{ ...s.roleBadge, background: c.role === 'admin' ? '#8b5cf6' : '#10b981' }}>{c.role}</span></td>
                    <td style={s.td}>{c.total_orders}</td>
                    <td style={s.td}><b>{formatPrice(c.total_spent)}</b></td>
                    <td style={s.td}>{new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={s.td}><button onClick={() => setSelected(c)} style={s.btnView}>👁 View</button></td>
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
  modal: { background: '#fff', borderRadius: '16px', width: '500px', maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' },
  modalTitle: { fontSize: '1rem', fontWeight: '700', margin: 0, color: '#1a1a2e' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' },
  modalBody: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  profileCard: { display: 'flex', alignItems: 'center', gap: '16px', background: '#f8f9fb', borderRadius: '10px', padding: '16px' },
  avatar: { width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', flexShrink: 0 },
  custName: { fontWeight: '700', color: '#1a1a2e', fontSize: '1rem' },
  custEmail: { color: '#888', fontSize: '0.82rem', margin: '2px 0 6px' },
  roleBadge: { color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  statBox: { background: '#f8f9fb', borderRadius: '10px', padding: '12px', textAlign: 'center' },
  statNum: { fontWeight: '800', color: '#1a1a2e', fontSize: '0.9rem' },
  statLbl: { color: '#aaa', fontSize: '0.72rem', marginTop: '2px' },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#555' },
  pwRow: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' },
  btnPrimary: { padding: '9px 16px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  btnRole: { padding: '10px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  toolbar: { marginBottom: '16px' },
  search: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', width: '300px', outline: 'none' },
  tableCard: { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9fb' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 14px', fontSize: '0.85rem', verticalAlign: 'middle' },
  custRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarSm: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem', flexShrink: 0 },
  custNameTd: { fontWeight: '600', color: '#1a1a2e', fontSize: '0.85rem' },
  btnView: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#555' },
  noData: { padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '0.88rem' },
  pagination: { display: 'flex', gap: '6px', padding: '16px', justifyContent: 'center', borderTop: '1px solid #f5f5f5' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' },
  pageActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
};
