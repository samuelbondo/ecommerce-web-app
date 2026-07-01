import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Toast from '../../components/Toast';
import ImageUpload from '../../components/ImageUpload';
import API from '../../api';

const EMPTY = { name: '', description: '', price: '', stock: '', image_url: '', category_id: '', featured: false };

export default function AdminProducts() {
  const { formatPrice } = useSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const PER = 10;

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const generateAiDescription = async () => {
    if (!form.name) return notify('Enter a product name first', 'error');
    setAiGenerating(true);
    try {
      const cat = categories.find(c => c.id === Number(form.category_id))?.name || '';
      const res = await API.post('/ai/describe', { name: form.name, category: cat, price: form.price });
      setForm(f => ({ ...f, description: res.data.description }));
      notify('Description generated!');
    } catch { notify('AI generation failed', 'error'); }
    setAiGenerating(false);
  };

  const load = () => {
    Promise.all([API.get('/admin/products'), API.get('/admin/categories')])
      .then(([p, c]) => { setProducts(p.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };
  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅';

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter ? p.category_id === Number(catFilter) : true;
    return matchSearch && matchCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    const v = sortDir === 'asc' ? 1 : -1;
    return (a[sortCol] ?? '') > (b[sortCol] ?? '') ? v : -v;
  });

  const pages = Math.ceil(sorted.length / PER);
  const paginated = sorted.slice((page - 1) * PER, page * PER);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, image_url: p.image_url || '', category_id: p.category_id, featured: !!p.featured }); setEditing(p.id); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) return notify('Name, price and stock are required', 'error');
    setSaving(true);
    try {
      if (editing) { await API.put(`/admin/products/${editing}`, form); notify('Product updated!'); }
      else { await API.post('/admin/products', form); notify('Product created!'); }
      setShowModal(false); load();
    } catch { notify('Failed to save', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await API.delete(`/admin/products/${deleteId}`); notify('Product deleted', 'info'); setDeleteId(null); load(); }
    catch { notify('Delete failed', 'error'); }
  };

  const toggleFeatured = async (p) => {
    const next = !p.featured;
    try {
      await API.put(`/admin/products/${p.id}/featured`, { featured: next });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, featured: next } : x));
      notify(next ? 'Marked as featured' : 'Removed from featured');
    } catch { notify('Failed to update featured', 'error'); }
  };

  const duplicateProduct = async (id) => {
    try { await API.post(`/admin/products/${id}/duplicate`); notify('Product duplicated'); load(); }
    catch { notify('Duplicate failed', 'error'); }
  };

  const bulkDelete = async () => {
    if (!checked.length) return;
    try {
      await API.put('/admin/products/bulk-delete', { ids: checked });
      notify(`${checked.length} products deleted`);
      setChecked([]); load();
    } catch { notify('Bulk delete failed', 'error'); }
  };

  const toggleCheck = (id) => setChecked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setChecked(checked.length === paginated.length ? [] : paginated.map(p => p.id));

  const stockColor = (s) => s === 0 ? '#ef4444' : s <= 5 ? '#f59e0b' : '#10b981';

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {deleteId && (
        <div style={s.overlay}><div style={s.dialog}>
          <h3 style={s.dlgTitle}>Delete Product?</h3>
          <p style={s.dlgText}>This cannot be undone.</p>
          <div style={s.dlgBtns}>
            <button onClick={() => setDeleteId(null)} style={s.btnCancel}>Cancel</button>
            <button onClick={handleDelete} style={s.btnDanger}>Delete</button>
          </div>
        </div></div>
      )}

      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} style={s.modalClose}>×</button>
            </div>
            <form onSubmit={handleSave} style={s.modalBody}>
              <div style={s.grid2}>
                {[['name', 'Product Name', 'text'], ['price', 'Price', 'number'], ['stock', 'Stock', 'number']].map(([k, ph, t]) => (
                  <div key={k} style={s.field}>
                    <label style={s.label}>{ph}</label>
                    <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={s.input} type={t} placeholder={ph} required step={k === 'price' ? '0.01' : undefined} />
                  </div>
                ))}
                <div style={s.field}>
                  <label style={s.label}>Category</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={s.input}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Image</label>
                <ImageUpload currentUrl={form.image_url} onUpload={url => setForm({ ...form, image_url: url })} size="md" />
                <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} style={{ ...s.input, marginTop: 6 }} placeholder="Or paste image URL…" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Description</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={s.label}>Description</label>
                  <button type="button" onClick={generateAiDescription} disabled={aiGenerating}
                    style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600 }}>
                    {aiGenerating ? '⏳ Generating...' : '🤖 Generate with AI'}
                  </button>
                </div>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={s.textarea} rows={3} placeholder="Product description..." />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                Mark as Featured
              </label>
              <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Saving...' : editing ? '💾 Update' : '➕ Create Product'}</button>
            </form>
          </div>
        </div>
      )}

      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Products</h2>
          <p style={s.pageSub}>{products.length} total products</p>
        </div>
        <button onClick={openAdd} style={s.btnPrimary}>➕ Add Product</button>
      </div>

      <div style={s.toolbar}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={s.search} placeholder="🔍 Search products..." />
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} style={s.select}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={s.resultCount}>{sorted.length} results</span>
      </div>

      {checked.length > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, padding: '10px 14px', background: '#fef2f2', borderRadius: 8 }}>
          <span style={{ fontSize: '0.85rem', color: '#dc2626' }}>{checked.length} selected</span>
          <button onClick={bulkDelete} style={{ padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}>🗑 Delete Selected</button>
          <button onClick={() => setChecked([])} style={{ padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}>Clear</button>
        </div>
      )}

      <div style={s.tableCard}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              <th style={s.th}><input type="checkbox" checked={checked.length === paginated.length && paginated.length > 0} onChange={toggleAll} /></th>
              <th style={s.th}>Image</th>
              {[['name', 'Name'], ['category', 'Category'], ['price', 'Price'], ['stock', 'Stock']].map(([col, label]) => (
                <th key={col} onClick={() => toggleSort(col)} style={{ ...s.th, cursor: 'pointer' }}>{label}{sortIcon(col)}</th>
              ))}
              <th style={s.th}>Featured</th>
              <th style={s.th}>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={s.noData}>Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} style={s.noData}>No products found</td></tr>
              ) : paginated.map(p => (
                <tr key={p.id} style={s.tr}>
                  <td style={s.td}><input type="checkbox" checked={checked.includes(p.id)} onChange={() => toggleCheck(p.id)} /></td>
                  <td style={s.td}><img src={p.image_url} alt={p.name} style={s.thumb} onError={e => { e.target.src = 'https://placehold.co/40x40?text=?'; }} /></td>
                  <td style={s.td}><div style={s.prodName}>{p.name}</div><div style={s.prodId}>ID: {p.id}</div></td>
                  <td style={s.td}><span style={s.catBadge}>{p.category || '—'}</span></td>
                  <td style={s.td}><b>{formatPrice(p.price)}</b></td>
                  <td style={s.td}><span style={{ ...s.stockBadge, color: stockColor(p.stock), background: stockColor(p.stock) + '18' }}>{p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? `Low (${p.stock})` : p.stock}</span></td>
                  <td style={s.td}>
                    <button onClick={() => toggleFeatured(p)} title="Toggle featured" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                      {p.featured ? '⭐' : '☆'}
                    </button>
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      <button onClick={() => openEdit(p)} style={s.btnEdit}>✏️ Edit</button>
                      <button onClick={() => duplicateProduct(p.id)} style={s.btnEdit} title="Duplicate">⧉</button>
                      <button onClick={() => setDeleteId(p.id)} style={s.btnDel}>🗑</button>
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
  modal: { background: '#fff', borderRadius: '16px', width: '560px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '700', margin: 0, color: '#1a1a2e' },
  modalClose: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888', lineHeight: 1 },
  modalBody: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#555' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' },
  textarea: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', resize: 'vertical' },
  dialog: { background: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '340px', width: '90%' },
  dlgTitle: { margin: '0 0 8px', fontWeight: '700', color: '#1a1a2e' },
  dlgText: { color: '#888', fontSize: '0.9rem', marginBottom: '20px' },
  dlgBtns: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  toolbar: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  search: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', flex: '1 1 160px', minWidth: 0, outline: 'none' },
  select: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.88rem', outline: 'none' },
  resultCount: { color: '#888', fontSize: '0.82rem', marginLeft: 'auto' },
  tableCard: { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9fb' },
  th: { padding: '11px 16px', textAlign: 'left', fontSize: '0.73rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 16px', fontSize: '0.85rem', verticalAlign: 'middle' },
  thumb: { width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' },
  prodName: { fontWeight: '600', color: '#1a1a2e', fontSize: '0.88rem' },
  prodId: { color: '#aaa', fontSize: '0.72rem' },
  catBadge: { background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
  stockBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  actions: { display: 'flex', gap: '6px' },
  btnEdit: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#555' },
  btnDel: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444' },
  btnPrimary: { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' },
  btnCancel: { padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.88rem' },
  btnDanger: { padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' },
  noData: { padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '0.88rem' },
  pagination: { display: 'flex', gap: '6px', padding: '16px', justifyContent: 'center', borderTop: '1px solid #f5f5f5' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' },
  pageActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
};
