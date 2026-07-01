import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Toast from '../../components/Toast';
import API from '../../api';

export default function AdminCustomers() {
  const { formatPrice } = useSettings();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER = 10;

  const [modal, setModal] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [edit, setEdit] = useState({ name: '', email: '', phone: '', address: '', city: '', country: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const notify = (message, type = 'success') => setToast({ message, type });

  const load = async () => {
    try {
      const r = await API.get('/admin/customers');
      setUsers(r.data);
    } catch { notify('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openModal = async (u) => {
    setModal(u);
    setModalLoading(true);
    setConfirmDelete(false);
    setNewPassword('');
    setEdit({ name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '', city: u.city || '', country: u.country || '' });
    try {
      const r = await API.get(`/admin/customers/${u.id}`);
      setModalUser(r.data);
    } catch { notify('Failed to load user details', 'error'); }
    finally { setModalLoading(false); }
  };

  const closeModal = () => { setModal(null); setModalUser(null); setConfirmDelete(false); setNewPassword(''); };

  const saveEdit = async () => {
    setEditSaving(true);
    try {
      await API.put(`/admin/customers/${modal.id}`, edit);
      notify('Profile updated successfully');
      load();
      setModal(prev => ({ ...prev, ...edit }));
      setModalUser(prev => ({ ...prev, ...edit }));
    } catch { notify('Failed to save changes', 'error'); }
    finally { setEditSaving(false); }
  };

  const toggleRole = async () => {
    const role = (modalUser || modal).role === 'admin' ? 'customer' : 'admin';
    try {
      await API.put(`/admin/customers/${modal.id}/role`, { role });
      notify(`Role changed to ${role}`);
      load();
      setModal(prev => ({ ...prev, role }));
      setModalUser(prev => ({ ...prev, role }));
    } catch { notify('Failed to update role', 'error'); }
  };

  const toggleStatus = async () => {
    const status = (modalUser || modal).status === 'active' ? 'suspended' : 'active';
    try {
      await API.put(`/admin/customers/${modal.id}/status`, { status });
      notify(`User ${status === 'suspended' ? 'suspended' : 'unsuspended'}`);
      load();
      setModal(prev => ({ ...prev, status }));
      setModalUser(prev => ({ ...prev, status }));
    } catch { notify('Failed to update status', 'error'); }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return notify('Minimum 6 characters required', 'error');
    setPwSaving(true);
    try {
      await API.put(`/admin/customers/${modal.id}/reset-password`, { password: newPassword });
      notify('Password reset successfully');
      setNewPassword('');
    } catch { notify('Failed to reset password', 'error'); }
    finally { setPwSaving(false); }
  };

  const deleteUser = async () => {
    try {
      await API.delete(`/admin/customers/${modal.id}`);
      notify('User deleted');
      closeModal();
      load();
    } catch { notify('Failed to delete user', 'error'); }
  };

  const exportCSV = () => {
    const rows = [['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Orders', 'Total Spent', 'City', 'Country', 'Joined', 'Last Login']];
    filtered.forEach(u => rows.push([u.id, u.name, u.email, u.phone || '', u.role, u.status || 'active', u.total_orders, u.total_spent, u.city || '', u.country || '', u.created_at, u.last_login || '']));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'customers.csv';
    a.click();
    notify('CSV exported');
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const pages = Math.ceil(filtered.length / PER);
  const paginated = filtered.slice((page - 1) * PER, page * PER);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  const statusColor = (st) => st === 'suspended' ? '#ef4444' : '#10b981';
  const roleColor = (r) => r === 'admin' ? '#8b5cf6' : '#3b82f6';
  const orderStatusColor = (st) => ({ pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' }[st] || '#aaa');

  const u = modalUser || modal;

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>User Management</h2>
          <p style={s.pageSub}>{users.length} total users &nbsp;·&nbsp; {users.filter(x => x.role === 'admin').length} admins &nbsp;·&nbsp; {users.filter(x => x.role === 'customer').length} customers</p>
        </div>
        <button onClick={exportCSV} style={s.btnExport}>⬇ Export CSV</button>
      </div>

      <div style={s.toolbar}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={s.search} placeholder="🔍 Search by name or email…" />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={s.select}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={s.select}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <span style={s.resultCount}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={s.tableCard}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['User', 'Email', 'Phone', 'Role', 'Status', 'Orders', 'Total Spent', 'Joined', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={s.noData}>Loading users…</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={10} style={s.noData}>No users match your filters</td></tr>
              ) : paginated.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.userCell}>
                      <div style={{ ...s.avatarSm, background: roleColor(u.role) }}>{initials(u.name)}</div>
                      <span style={s.userName}>{u.name}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.emailText}>{u.email}</span></td>
                  <td style={s.td}>{u.phone || <span style={s.muted}>—</span>}</td>
                  <td style={s.td}><span style={{ ...s.badge, background: roleColor(u.role) }}>{u.role}</span></td>
                  <td style={s.td}><span style={{ ...s.badge, background: statusColor(u.status || 'active') }}>{u.status || 'active'}</span></td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{u.total_orders}</td>
                  <td style={s.td}><b>{formatPrice(u.total_spent)}</b></td>
                  <td style={s.td}>{fmt(u.created_at)}</td>
                  <td style={s.td}>{u.last_login ? fmt(u.last_login) : <span style={s.muted}>Never</span>}</td>
                  <td style={s.td}>
                    <button onClick={() => openModal(u)} style={s.btnView}>👁 View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div style={s.pagination}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={s.pageBtn}>← Prev</button>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ ...s.pageBtn, ...(page === i + 1 ? s.pageActive : {}) }}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} style={s.pageBtn}>Next →</button>
          </div>
        )}
      </div>

      {modal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>User Profile</h3>
                <p style={s.modalSub}>ID #{modal.id}</p>
              </div>
              <button onClick={closeModal} style={s.closeBtn}>✕</button>
            </div>

            {modalLoading ? (
              <div style={s.modalLoading}>Loading user details…</div>
            ) : (
              <div style={s.modalScroll}>

                <div style={s.profileCard}>
                  <div style={{ ...s.avatarLg, background: roleColor(u?.role) }}>{initials(u?.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={s.profileName}>{u?.name}</div>
                    <div style={s.profileEmail}>{u?.email}</div>
                    <div style={s.profileMeta}>
                      {u?.phone && <span>📞 {u.phone}</span>}
                      {u?.city && <span>📍 {u.city}{u?.country ? `, ${u.country}` : ''}</span>}
                    </div>
                    <div style={s.profileMeta}>
                      <span>Joined: {fmt(u?.created_at)}</span>
                      <span>Last Login: {u?.last_login ? fmt(u.last_login) : 'Never'}</span>
                    </div>
                  </div>
                </div>

                <div style={s.statsRow}>
                  <div style={s.statBox}>
                    <div style={s.statNum}>{u?.total_orders ?? 0}</div>
                    <div style={s.statLbl}>Orders</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={s.statNum}>{formatPrice(u?.total_spent ?? 0)}</div>
                    <div style={s.statLbl}>Total Spent</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={{ ...s.statNum, color: roleColor(u?.role) }}>{u?.role}</div>
                    <div style={s.statLbl}>Role</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={{ ...s.statNum, color: statusColor(u?.status || 'active') }}>{u?.status || 'active'}</div>
                    <div style={s.statLbl}>Status</div>
                  </div>
                </div>

                <div style={s.section}>
                  <div style={s.sectionTitle}>Recent Orders</div>
                  {(modalUser?.orders?.length ?? 0) === 0 ? (
                    <div style={s.noOrders}>No orders yet</div>
                  ) : (
                    <table style={s.ordersTable}>
                      <thead>
                        <tr>
                          <th style={s.oth}>Order ID</th>
                          <th style={s.oth}>Total</th>
                          <th style={s.oth}>Status</th>
                          <th style={s.oth}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalUser.orders.map(o => (
                          <tr key={o.id} style={s.otr}>
                            <td style={s.otd}>#{o.id}</td>
                            <td style={s.otd}>{formatPrice(o.total)}</td>
                            <td style={s.otd}><span style={{ ...s.badge, background: orderStatusColor(o.status) }}>{o.status}</span></td>
                            <td style={s.otd}>{fmt(o.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={s.section}>
                  <div style={s.sectionTitle}>Edit Profile</div>
                  <div style={s.editGrid}>
                    <div style={s.formGroup}>
                      <label style={s.label}>Full Name</label>
                      <input value={edit.name} onChange={e => setEdit(p => ({ ...p, name: e.target.value }))} style={s.input} placeholder="Full name" />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Email</label>
                      <input value={edit.email} onChange={e => setEdit(p => ({ ...p, email: e.target.value }))} style={s.input} placeholder="Email address" />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Phone</label>
                      <input value={edit.phone} onChange={e => setEdit(p => ({ ...p, phone: e.target.value }))} style={s.input} placeholder="Phone number" />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>City</label>
                      <input value={edit.city} onChange={e => setEdit(p => ({ ...p, city: e.target.value }))} style={s.input} placeholder="City" />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Country</label>
                      <input value={edit.country} onChange={e => setEdit(p => ({ ...p, country: e.target.value }))} style={s.input} placeholder="Country" />
                    </div>
                    <div style={{ ...s.formGroup, gridColumn: '1 / -1' }}>
                      <label style={s.label}>Address</label>
                      <input value={edit.address} onChange={e => setEdit(p => ({ ...p, address: e.target.value }))} style={s.input} placeholder="Street address" />
                    </div>
                  </div>
                  <button onClick={saveEdit} disabled={editSaving} style={s.btnSave}>
                    {editSaving ? 'Saving…' : '💾 Save Changes'}
                  </button>
                </div>

                <div style={s.section}>
                  <div style={s.sectionTitle}>Access Control</div>
                  <div style={s.actionRow}>
                    <button onClick={toggleRole} style={{ ...s.btnControl, background: u?.role === 'admin' ? '#f59e0b' : '#8b5cf6' }}>
                      {u?.role === 'admin' ? '⬇ Demote to Customer' : '⬆ Promote to Admin'}
                    </button>
                    <button onClick={toggleStatus} style={{ ...s.btnControl, background: u?.status === 'suspended' ? '#10b981' : '#ef4444' }}>
                      {u?.status === 'suspended' ? '✅ Unsuspend User' : '🚫 Suspend User'}
                    </button>
                  </div>
                </div>

                <div style={s.section}>
                  <div style={s.sectionTitle}>Reset Password</div>
                  <div style={s.pwRow}>
                    <div style={s.pwWrap}>
                      <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type={showPw ? 'text' : 'password'} style={s.input} placeholder="New password (min 6 chars)" />
                      <button onClick={() => setShowPw(p => !p)} style={s.eyeBtn}>{showPw ? '🙈' : '👁'}</button>
                    </div>
                    <button onClick={resetPassword} disabled={pwSaving} style={s.btnSave}>
                      {pwSaving ? 'Resetting…' : '🔑 Reset Password'}
                    </button>
                  </div>
                </div>

                <div style={s.section}>
                  <div style={s.sectionTitle}>Danger Zone</div>
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)} style={s.btnDelete}>🗑 Delete User Account</button>
                  ) : (
                    <div style={s.confirmBox}>
                      <p style={s.confirmText}>⚠️ This will permanently delete <b>{u?.name}</b> and all their data. This cannot be undone.</p>
                      <div style={s.confirmBtns}>
                        <button onClick={deleteUser} style={s.btnDeleteConfirm}>Yes, Delete</button>
                        <button onClick={() => setConfirmDelete(false)} style={s.btnCancelDelete}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { padding: '24px', maxWidth: '1400px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  btnExport: { padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  toolbar: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  search: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', width: '260px', outline: 'none', flex: '0 0 auto' },
  select: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem', outline: 'none', background: '#fff', cursor: 'pointer' },
  resultCount: { fontSize: '0.82rem', color: '#888', marginLeft: 'auto' },

  tableCard: { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9fb' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s' },
  td: { padding: '12px 14px', fontSize: '0.85rem', verticalAlign: 'middle', color: '#333' },
  userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarSm: { width: '34px', height: '34px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.78rem', flexShrink: 0 },
  userName: { fontWeight: '600', color: '#1a1a2e', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  emailText: { color: '#555', fontSize: '0.83rem' },
  badge: { color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'capitalize', whiteSpace: 'nowrap' },
  muted: { color: '#bbb', fontSize: '0.82rem' },
  btnView: { padding: '5px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#444', fontWeight: '500', whiteSpace: 'nowrap' },
  noData: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '0.9rem' },
  pagination: { display: 'flex', gap: '6px', padding: '16px', justifyContent: 'center', borderTop: '1px solid #f5f5f5', flexWrap: 'wrap' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' },
  pageActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' },
  modal: { background: '#fff', borderRadius: '16px', width: '680px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 },
  modalTitle: { fontSize: '1.1rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  modalSub: { fontSize: '0.78rem', color: '#aaa', margin: '2px 0 0' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#888', lineHeight: 1, padding: '4px 8px', borderRadius: '6px' },
  modalLoading: { padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '0.9rem' },
  modalScroll: { overflowY: 'auto', padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' },

  profileCard: { display: 'flex', gap: '16px', background: '#f8f9fb', borderRadius: '12px', padding: '16px', alignItems: 'flex-start' },
  avatarLg: { width: '60px', height: '60px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.3rem', flexShrink: 0 },
  profileName: { fontWeight: '800', fontSize: '1.05rem', color: '#1a1a2e' },
  profileEmail: { color: '#666', fontSize: '0.85rem', margin: '3px 0 6px' },
  profileMeta: { display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#888', marginTop: '4px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  statBox: { background: '#f8f9fb', borderRadius: '10px', padding: '14px 10px', textAlign: 'center' },
  statNum: { fontWeight: '800', color: '#1a1a2e', fontSize: '0.92rem' },
  statLbl: { color: '#aaa', fontSize: '0.7rem', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' },
  section: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionTitle: { fontSize: '0.78rem', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' },

  noOrders: { color: '#bbb', fontSize: '0.85rem', padding: '12px 0', textAlign: 'center' },
  ordersTable: { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  oth: { padding: '8px 10px', textAlign: 'left', fontSize: '0.7rem', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', background: '#f8f9fb' },
  otr: { borderBottom: '1px solid #f5f5f5' },
  otd: { padding: '9px 10px', verticalAlign: 'middle' },
  editGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.75rem', fontWeight: '600', color: '#666' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', outline: 'none', color: '#1a1a2e' },
  btnSave: { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', alignSelf: 'flex-start' },
  actionRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  btnControl: { padding: '10px 16px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  pwRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' },
  pwWrap: { position: 'relative', flex: 1, minWidth: '200px' },
  eyeBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 },
  btnDelete: { padding: '10px 18px', background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', alignSelf: 'flex-start' },
  confirmBox: { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px' },
  confirmText: { color: '#333', fontSize: '0.88rem', margin: '0 0 12px' },
  confirmBtns: { display: 'flex', gap: '10px' },
  btnDeleteConfirm: { padding: '9px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' },
  btnCancelDelete: { padding: '9px 18px', background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
};
