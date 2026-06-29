import { useEffect, useState } from 'react';
import Toast from '../../components/Toast';
import API from '../../api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '' });
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const load = () => API.get('/admin/categories').then(r => setCategories(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: '' }); setEditing(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ name: c.name }); setEditing(c.id); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify('Category name is required', 'error');
    setSaving(true);
    try {
      if (editing) { await API.put(`/admin/categories/${editing}`, form); notify('Category updated!'); }
      else { await API.post('/admin/categories', form); notify('Category created!'); }
      setShowModal(false); load();
    } catch { notify('Save failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/admin/categories/${deleteId}`);
      notify('Category deleted', 'info'); setDeleteId(null); load();
    } catch { notify('Delete failed', 'error'); }
  };

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {deleteId && (
        <div style={s.overlay}><div style={s.dialog}>
          <h3 style={s.dlgTitle}>Delete Category?</h3>
          <p style={s.dlgText}>Products in this category will become uncategorized.</p>
          <div style={s.dlgBtns}>
            <button onClick={() => setDeleteId(null)} style={s.btnCancel}>Cancel</button>
            <button onClick={handleDelete} style={s.btnDanger}>Delete</button>
          </div>
        </div></div>
      )}

      {showModal && (
        <div style={s.overlay}><div style={s.modal}>
          <div style={s.modalHeader}>
            <h3 style={s.modalTitle}>{editing ? 'Edit Category' : 'New Category'}</h3>
            <button onClick={() => setShowModal(false)} style={s.closeBtn}>×</button>
          </div>
          <form onSubmit={handleSave} style={s.modalBody}>
            <div style={s.field}>
              <label style={s.label}>Category Name</label>
              <input value={form.name} onChange={e => setForm({ name: e.target.value })} style={s.input} placeholder="e.g. Electronics" required />
            </div>
            <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Saving...' : editing ? '💾 Update' : '➕ Create'}</button>
          </form>
        </div></div>
      )}

      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Categories</h2>
          <p style={s.pageSub}>{categories.length} categories</p>
        </div>
        <button onClick={openAdd} style={s.btnPrimary}>➕ Add Category</button>
      </div>

      <div style={s.toolbar}>
        <input value={search} onChange={e => setSearch(e.target.value)} style={s.search} placeholder="🔍 Search categories..." />
      </div>

      <div style={s.grid}>
        {loading ? <p style={s.noData}>Loading...</p> : filtered.length === 0 ? <p style={s.noData}>No categories found</p>
          : filtered.map(c => (
            <div key={c.id} style={s.card}>
              <div style={s.cardIcon}>🏷️</div>
              <div style={s.cardInfo}>
                <div style={s.catName}>{c.name}</div>
                <div style={s.catCount}>{c.product_count} products</div>
              </div>
              <div style={s.cardActions}>
                <button onClick={() => openEdit(c)} style={s.btnEdit}>✏️</button>
                <button onClick={() => setDeleteId(c.id)} style={s.btnDel}>🗑</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

const s = {
  wrap: { padding: '24px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#fff', borderRadius: '14px', width: '400px', maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px 0' },
  modalTitle: { fontSize: '1rem', fontWeight: '700', margin: 0, color: '#1a1a2e' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' },
  modalBody: { padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#555' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' },
  dialog: { background: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '340px', width: '90%' },
  dlgTitle: { margin: '0 0 8px', fontWeight: '700', color: '#1a1a2e' },
  dlgText: { color: '#888', fontSize: '0.88rem', marginBottom: '20px' },
  dlgBtns: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  toolbar: { marginBottom: '16px' },
  search: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', width: '280px', outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '14px' },
  card: { background: '#fff', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' },
  cardIcon: { fontSize: '1.5rem', flexShrink: 0 },
  cardInfo: { flex: 1 },
  catName: { fontWeight: '700', color: '#1a1a2e', fontSize: '0.95rem' },
  catCount: { color: '#888', fontSize: '0.78rem', marginTop: '2px' },
  cardActions: { display: 'flex', gap: '6px' },
  btnEdit: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.8rem' },
  btnDel: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444' },
  btnPrimary: { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' },
  btnCancel: { padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' },
  btnDanger: { padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '600' },
  noData: { color: '#aaa', textAlign: 'center', padding: '40px', gridColumn: '1/-1' },
};
