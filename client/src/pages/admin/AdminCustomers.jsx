import { useEffect, useState, useCallback } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Toast from '../../components/Toast';
import API from '../../api';

const PER = 10;

export default function AdminCustomers() {
  const { formatPrice } = useSettings();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ col: 'created_at', dir: 'desc' });

  // modal state
  const [modal, setModal] = useState(null); // 'view' | 'edit' | 'reset'
  const [modalUser, setModalUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // edit form
  const [editForm, setEditForm] = useState({});

  // notes
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // password reset
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const fetchUsers = async () => {
    setLoading(true);
    try { const r = await API.get('/admin/customers'); setUsers(r.data); }
    catch { notify('Failed to load customers', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  const openView = async (u) => {
    setModal('view'); setModalUser(u); setNotes(u.admin_notes || '');
    setConfirmDelete(false); setNewPassword('');
    setModalLoading(true);
    try { const r = await API.get(`/admin/customers/${u.id}/orders`); setModalUser(p => ({ ...p, orders: r.data })); }
    catch { setModalUser(p => ({ ...p, orders: [] })); }
    finally { setModalLoading(false); }
  };

  const openEdit = (u) => {
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', address: u.address || '', city: u.city || '', country: u.country || '', role: u.role, status: u.status || 'active' });
    setModalUser(u); setModal('edit');
  };

  const saveEdit = async () => {
    try {
      await API.put(`/admin/customers/${modalUser.id}`, editForm);
      setUsers(p => p.map(u => u.id === modalUser.id ? { ...u, ...editForm } : u));
      notify('Customer updated'); setModal(null);
    } catch { notify('Update failed', 'error'); }
  };

  const saveNotes = async () => {
    setNotesSaving(true);
    try {
      await API.put(`/admin/customers/${modalUser.id}/notes`, { notes });
      setUsers(p => p.map(u => u.id === modalUser.id ? { ...u, admin_notes: notes } : u));
      notify('Notes saved');
    } catch { notify('Failed to save notes', 'error'); }
    finally { setNotesSaving(false); }
  };

  const quickToggleStatus = async (u) => {
    const next = (u.status || 'active') === 'active' ? 'suspended' : 'active';
    try {
      await API.put(`/admin/customers/${u.id}/status`, { status: next });
      setUsers(p => p.map(x => x.id === u.id ? { ...x, status: next } : x));
      if (modalUser?.id === u.id) setModalUser(p => ({ ...p, status: next }));
      notify(`User ${next}`);
    } catch { notify('Failed to update status', 'error'); }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return notify('Min 6 characters', 'error');
    setPwSaving(true);
    try {
      await API.put(`/admin/customers/${modalUser.id}/reset-password`, { password: newPassword });
      notify('Password reset successfully'); setNewPassword(''); setModal('view');
    } catch { notify('Failed to reset password', 'error'); }
    finally { setPwSaving(false); }
  };

  const deleteUser = async (id) => {
    try {
      await API.delete(`/admin/customers/${id}`);
      setUsers(p => p.filter(u => u.id !== id));
      setModal(null); notify('Customer deleted');
    } catch { notify('Failed to delete', 'error'); }
  };

  const exportCSV = () => {
    const rows = [['ID','Name','Email','Role','Status','Orders','Spent','Joined'],
      ...users.map(u => [u.id, u.name, u.email, u.role, u.status||'active', u.total_orders||0, u.total_spent||0, u.created_at])];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'customers.csv'; a.click();
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const toggleSort = (col) => setSort(p => ({ col, dir: p.col === col && p.dir === 'asc' ? 'desc' : 'asc' }));
  const sortIcon = (col) => sort.col === col ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅';

  const filtered = users.filter(u =>
    (search === '' || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === 'all' || u.role === roleFilter) &&
    (statusFilter === 'all' || (u.status || 'active') === statusFilter)
  );
  const sorted = [...filtered].sort((a, b) => {
    const v = sort.dir === 'asc' ? 1 : -1;
    return (a[sort.col] ?? '') > (b[sort.col] ?? '') ? v : -v;
  });
  const totalPages = Math.ceil(sorted.length / PER);
  const paginated = sorted.slice((page - 1) * PER, page * PER);

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div style={s.pageHd}>
        <div>
          <h2 style={s.title}>Customers</h2>
          <p style={s.sub}>{users.length} total users registered</p>
        </div>
        <button onClick={exportCSV} style={s.btnExport}>⬇ Export CSV</button>
      </div>

      {/* ── Stats row ── */}
      <div style={s.statsRow}>
        {[
          { label: 'Total', value: users.length, color: '#6366f1' },
          { label: 'Customers', value: users.filter(u => u.role === 'customer').length, color: '#0ea5e9' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#f59e0b' },
          { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, color: '#ef4444' },
        ].map(st => (
          <div key={st.label} style={s.statCard}>
            <div style={{ ...s.statNum, color: st.color }}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={s.filters}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…" style={s.searchInput} />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={s.select}>
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={s.select}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* ── Table / Cards ── */}
      {loading ? <p style={{ padding: 32, color: '#888' }}>Loading…</p> : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginated.map(u => (
            <div key={u.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {u.avatar
                    ? <img src={u.avatar} style={s.profileAvatar} alt="" onError={e => e.target.style.display='none'} />
                    : <div style={{ ...s.avatarFallback, width: 40, height: 40, fontSize: '1rem', background: u.role === 'admin' ? '#f59e0b' : '#6366f1' }}>{(u.name||'?')[0]}</div>
                  }
                  <div>
                    <div style={s.nameCell}>{u.name}</div>
                    <div style={s.emailCell}>{u.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ ...s.badge, background: u.role === 'admin' ? '#dbeafe' : '#f3f4f6', color: u.role === 'admin' ? '#1d4ed8' : '#374151' }}>{u.role}</span>
                  <span style={{ ...s.badge, background: (u.status||'active') === 'active' ? '#dcfce7' : '#fee2e2', color: (u.status||'active') === 'active' ? '#16a34a' : '#dc2626' }}>{u.status||'active'}</span>
                </div>
              </div>
              <div style={s.cardMeta}>
                <span>📦 {u.total_orders||0} orders</span>
                <span>💰 {formatPrice(u.total_spent||0)}</span>
                <span>📅 {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
              </div>
              <div style={s.actions}>
                <button onClick={() => openView(u)} style={s.btnView}>View</button>
                <button onClick={() => openEdit(u)} style={s.btnEdit}>Edit</button>
                <button onClick={() => quickToggleStatus(u)} style={{ ...s.btnToggle, background: (u.status||'active') === 'active' ? '#fef3c7' : '#dcfce7', color: (u.status||'active') === 'active' ? '#b45309' : '#15803d' }}>
                  {(u.status||'active') === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {[['id','ID'],['name','Name'],['email','Email'],['role','Role'],['status','Status'],['total_orders','Orders'],['total_spent','Spent'],['created_at','Joined']].map(([col, label]) => (
                  <th key={col} onClick={() => toggleSort(col)} style={s.th}>{label}{sortIcon(col)}</th>
                ))}
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {u.avatar
                        ? <img src={u.avatar} style={s.avatar} alt="" onError={e => e.target.style.display='none'} />
                        : <div style={{ ...s.avatarFallback, background: u.role === 'admin' ? '#f59e0b' : '#6366f1' }}>{(u.name||'?')[0]}</div>
                      }
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>#{u.id}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.nameCell}>{u.name}</span></td>
                  <td style={s.td}><span style={s.emailCell}>{u.email}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: u.role === 'admin' ? '#dbeafe' : '#f3f4f6', color: u.role === 'admin' ? '#1d4ed8' : '#374151' }}>{u.role}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: (u.status||'active') === 'active' ? '#dcfce7' : '#fee2e2', color: (u.status||'active') === 'active' ? '#16a34a' : '#dc2626' }}>{u.status||'active'}</span>
                  </td>
                  <td style={s.td}>{u.total_orders || 0}</td>
                  <td style={s.td}>{formatPrice(u.total_spent || 0)}</td>
                  <td style={s.td}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      <button onClick={() => openView(u)} style={s.btnView}>View</button>
                      <button onClick={() => openEdit(u)} style={s.btnEdit}>Edit</button>
                      <button onClick={() => quickToggleStatus(u)} style={{ ...s.btnToggle, background: (u.status||'active') === 'active' ? '#fef3c7' : '#dcfce7', color: (u.status||'active') === 'active' ? '#b45309' : '#15803d' }}>
                        {(u.status||'active') === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={s.pgBtn}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ ...s.pgBtn, ...(p === page ? s.pgActive : {}) }}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={s.pgBtn}>›</button>
        </div>
      )}

      {/* ── View Modal ── */}
      {modal === 'view' && modalUser && (
        <div style={s.modalBg} onClick={() => setModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHd}>
              <h3 style={s.modalTitle}>Customer Profile</h3>
              <button onClick={() => setModal(null)} style={s.closeBtn}>✕</button>
            </div>

            {/* Profile header */}
            <div style={s.profileHd}>
              {modalUser.avatar
                ? <img src={modalUser.avatar} style={s.profileAvatar} alt="" />
                : <div style={{ ...s.profileAvatarFallback, background: modalUser.role === 'admin' ? '#f59e0b' : '#6366f1' }}>{(modalUser.name||'?')[0]}</div>
              }
              <div>
                <div style={s.profileName}>{modalUser.name}</div>
                <div style={s.profileEmail}>{modalUser.email}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span style={{ ...s.badge, background: modalUser.role === 'admin' ? '#dbeafe' : '#f3f4f6', color: modalUser.role === 'admin' ? '#1d4ed8' : '#374151' }}>{modalUser.role}</span>
                  <span style={{ ...s.badge, background: (modalUser.status||'active') === 'active' ? '#dcfce7' : '#fee2e2', color: (modalUser.status||'active') === 'active' ? '#16a34a' : '#dc2626' }}>{modalUser.status||'active'}</span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div style={s.infoGrid}>
              {[
                ['Phone', modalUser.phone || '—'],
                ['Address', modalUser.address || '—'],
                ['City', modalUser.city || '—'],
                ['Country', modalUser.country || '—'],
                ['Joined', modalUser.created_at ? new Date(modalUser.created_at).toLocaleDateString() : '—'],
                ['Last Login', modalUser.last_login ? new Date(modalUser.last_login).toLocaleDateString() : '—'],
                ['Total Orders', modalUser.total_orders || 0],
                ['Total Spent', formatPrice(modalUser.total_spent || 0)],
              ].map(([k, v]) => (
                <div key={k} style={s.infoItem}>
                  <div style={s.infoKey}>{k}</div>
                  <div style={s.infoVal}>{v}</div>
                </div>
              ))}
            </div>

            {/* Order history */}
            <div style={s.section}>
              <div style={s.sectionTitle}>Order History</div>
              {modalLoading ? <p style={{ color: '#888', fontSize: '0.85rem' }}>Loading…</p>
                : modalUser.orders?.length ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead><tr style={{ background: '#f9fafb' }}>
                      {['Order','Date','Total','Status'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{modalUser.orders.map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '6px 8px' }}>#{o.id}</td>
                        <td style={{ padding: '6px 8px' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '6px 8px' }}>{formatPrice(o.total_amount || o.total)}</td>
                        <td style={{ padding: '6px 8px' }}><span style={{ ...s.badge, background: '#f3f4f6', color: '#374151' }}>{o.status}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                ) : <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No orders yet.</p>
              }
            </div>

            {/* Admin notes */}
            <div style={s.section}>
              <div style={s.sectionTitle}>Admin Notes</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                style={s.textarea} placeholder="Internal notes about this customer…" />
              <button onClick={saveNotes} disabled={notesSaving} style={{ ...s.btnSave, marginTop: 8, alignSelf: 'flex-start' }}>
                {notesSaving ? 'Saving…' : 'Save Notes'}
              </button>
            </div>

            {/* Footer actions */}
            <div style={s.modalFooter}>
              <button onClick={() => openEdit(modalUser)} style={s.btnEdit}>✏️ Edit Profile</button>
              <button onClick={() => { setModal('reset'); }} style={s.btnReset}>🔑 Reset Password</button>
              <button onClick={() => quickToggleStatus(modalUser)} style={{ ...s.btnToggle, background: (modalUser.status||'active') === 'active' ? '#fef3c7' : '#dcfce7', color: (modalUser.status||'active') === 'active' ? '#b45309' : '#15803d' }}>
                {(modalUser.status||'active') === 'active' ? '🚫 Suspend' : '✅ Activate'}
              </button>
              {!confirmDelete
                ? <button onClick={() => setConfirmDelete(true)} style={s.btnDelete}>🗑 Delete</button>
                : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.82rem', color: '#dc2626' }}>Sure?</span>
                    <button onClick={() => deleteUser(modalUser.id)} style={s.btnDelete}>Yes</button>
                    <button onClick={() => setConfirmDelete(false)} style={s.btnCancel}>No</button>
                  </span>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {modal === 'edit' && modalUser && (
        <div style={s.modalBg} onClick={() => setModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHd}>
              <h3 style={s.modalTitle}>Edit Customer #{modalUser.id}</h3>
              <button onClick={() => setModal(null)} style={s.closeBtn}>✕</button>
            </div>
            <div style={s.editGrid}>
              {[['Name','name'],['Email','email'],['Phone','phone'],['Address','address'],['City','city'],['Country','country']].map(([label, key]) => (
                <div key={key} style={s.field}>
                  <label style={s.fieldLabel}>{label}</label>
                  <input value={editForm[key] || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} style={s.input} />
                </div>
              ))}
              <div style={s.field}>
                <label style={s.fieldLabel}>Role</label>
                <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} style={s.input}>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} style={s.input}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button onClick={saveEdit} style={s.btnSave}>✓ Save Changes</button>
              <button onClick={() => setModal(null)} style={s.btnCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {modal === 'reset' && modalUser && (
        <div style={s.modalBg} onClick={() => setModal('view')}>
          <div style={{ ...s.modalBox, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHd}>
              <h3 style={s.modalTitle}>Reset Password</h3>
              <button onClick={() => setModal('view')} style={s.closeBtn}>✕</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>
              Set a new password for <strong>{modalUser.name}</strong>
            </p>
            <div style={s.field}>
              <label style={s.fieldLabel}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={s.input} placeholder="Min 6 characters" />
            </div>
            <div style={s.modalFooter}>
              <button onClick={resetPassword} disabled={pwSaving} style={s.btnSave}>
                {pwSaving ? 'Saving…' : '🔑 Reset Password'}
              </button>
              <button onClick={() => setModal('view')} style={s.btnCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  wrap: { padding: '16px' },
  pageHd: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  sub: { fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 },
  btnExport: { padding: '9px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 },
  statCard: { background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' },
  statNum: { fontSize: '1.6rem', fontWeight: 800 },
  statLabel: { fontSize: '0.75rem', color: '#94a3b8', marginTop: 2, fontWeight: 600, textTransform: 'uppercase' },

  filters: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  searchInput: { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, flex: 1, minWidth: 200, fontSize: '0.9rem', outline: 'none' },
  select: { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', outline: 'none', background: '#fff' },

  tableWrap: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  thead: { background: '#f8fafc', borderBottom: '2px solid #e5e7eb' },
  th: { padding: '12px 14px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
  td: { padding: '12px 14px', verticalAlign: 'middle' },

  avatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  avatarFallback: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 },
  nameCell: { fontWeight: 600, color: '#1a1a2e' },
  emailCell: { color: '#64748b', fontSize: '0.82rem' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 },

  actions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  btnView: { padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  btnEdit: { padding: '4px 10px', background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  btnToggle: { padding: '4px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  btnDelete: { padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  btnReset: { padding: '4px 10px', background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  btnSave: { padding: '9px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' },
  btnCancel: { padding: '9px 16px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },

  pagination: { display: 'flex', gap: 6, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' },
  pgBtn: { padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  pgActive: { background: '#1a1a2e', color: '#fff' },

  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '20px 16px', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 10 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 },
  cardMeta: { display: 'flex', gap: 12, fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' },
  modalHd: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' },
  modalFooter: { display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid #f1f5f9' },

  profileHd: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: '#f8fafc', borderRadius: 12 },
  profileAvatar: { width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  profileAvatarFallback: { width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0 },
  profileName: { fontWeight: 800, fontSize: '1rem', color: '#1a1a2e' },
  profileEmail: { fontSize: '0.82rem', color: '#64748b', marginTop: 2 },

  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 },
  infoItem: { background: '#f8fafc', borderRadius: 8, padding: '10px 12px' },
  infoKey: { fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 },
  infoVal: { fontSize: '0.88rem', fontWeight: 600, color: '#1a1a2e' },

  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionTitle: { fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' },
  textarea: { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' },

  editGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#374151' },
  input: { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none', color: '#1a1a2e' },
};
