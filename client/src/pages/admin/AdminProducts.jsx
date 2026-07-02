import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Toast from '../../components/Toast';
import ImageUpload from '../../components/ImageUpload';
import API from '../../api';

const EMPTY = { name: '', description: '', price: '', stock: '', image_url: '', category_id: '', featured: false, visible: true };

function GalleryManager({ productId, onClose, hideClose }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = () => API.get(`/admin/products/${productId}/images`).then(r => setImages(r.data)).catch(() => {});
  useEffect(() => { load(); }, [productId]);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await API.post(`/admin/products/${productId}/images`, { url: data.url, is_primary: images.length === 0 });
      load();
    } catch { alert('Upload failed'); }
    setUploading(false);
  };

  const remove = async (imgId) => { await API.delete(`/admin/products/${productId}/images/${imgId}`); load(); };
  const setPrimary = async (imgId) => { await API.post(`/admin/products/${productId}/images`, { url: images.find(i => i.id === imgId)?.url, is_primary: true }); load(); };

  return (
    <div style={{ padding: '20px 24px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>Image Gallery</h3>
        {!hideClose && <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' }}>×</button>}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', border: '2px dashed #e5e7eb', borderRadius: 10, cursor: 'pointer', marginBottom: 16, color: '#64748b', fontSize: '0.88rem' }}>
        {uploading ? '⏳ Uploading...' : '📷 Click to add image'}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => upload(e.target.files[0])} disabled={uploading} />
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {images.map(img => (
          <div key={img.id} style={{ position: 'relative', width: 90, height: 90 }}>
            <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: img.is_primary ? '2px solid #e94560' : '2px solid #e5e7eb' }} />
            {img.is_primary && <span style={{ position: 'absolute', top: 2, left: 2, background: '#e94560', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>PRIMARY</span>}
            <div style={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 3 }}>
              {!img.is_primary && <button onClick={() => setPrimary(img.id)} title="Set primary" style={{ background: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', padding: '2px 4px' }}>★</button>}
              <button onClick={() => remove(img.id)} style={{ background: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#fff', fontSize: '0.7rem', padding: '2px 4px' }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantsManager({ productId, basePrice, onClose, hideClose }) {
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newOpt, setNewOpt] = useState('');
  const [vForm, setVForm] = useState({ combination: '', price: '', stock: '', sku: '', image_url: '', description: '' });
  const [editingV, setEditingV] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => Promise.all([
    API.get(`/admin/products/${productId}/options`),
    API.get(`/admin/products/${productId}/variants`),
  ]).then(([o, v]) => { setOptions(o.data); setVariants(v.data); }).catch(() => {});

  useEffect(() => { load(); }, [productId]);

  const addOption = async () => {
    if (!newOpt.trim()) return;
    await API.post(`/admin/products/${productId}/options`, { name: newOpt.trim() });
    setNewOpt(''); load();
  };
  const delOption = async (id) => { await API.delete(`/admin/products/${productId}/options/${id}`); load(); };

  const uploadVariantImg = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setVForm(f => ({ ...f, image_url: data.url }));
    } catch { alert('Upload failed'); }
    setUploading(false);
  };

  const saveVariant = async () => {
    if (!vForm.combination.trim()) return alert('Combination required');
    if (editingV) {
      await API.put(`/admin/products/${productId}/variants/${editingV}`, vForm);
    } else {
      await API.post(`/admin/products/${productId}/variants`, vForm);
    }
    setVForm({ combination: '', price: '', stock: '', sku: '', image_url: '', description: '' });
    setEditingV(null); load();
  };

  const delVariant = async (id) => { await API.delete(`/admin/products/${productId}/variants/${id}`); load(); };
  const editVariant = (v) => { setVForm({ combination: v.combination, price: v.price || '', stock: v.stock ?? '', sku: v.sku || '', image_url: v.image_url || '', description: v.description || '' }); setEditingV(v.id); };

  const inp = { padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '20px 24px 24px', maxHeight: '80vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>Variants</h3>
        {!hideClose && <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' }}>×</button>}
      </div>

      {/* Options */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Option Types (e.g. Color, Size)</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={newOpt} onChange={e => setNewOpt(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()} placeholder="e.g. Color" style={{ ...inp, flex: 1 }} />
          <button onClick={addOption} style={{ padding: '7px 14px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>Add</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {options.map(o => (
            <span key={o.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f1f5f9', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
              {o.name}
              <button onClick={() => delOption(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', padding: 0, lineHeight: 1 }}>✕</button>
            </span>
          ))}
        </div>
      </div>

      {/* Variant form */}
      <div style={{ background: '#f8f9fb', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>{editingV ? 'Edit Variant' : 'Add Variant'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Combination *</label><input value={vForm.combination} onChange={e => setVForm(f => ({ ...f, combination: e.target.value }))} placeholder="e.g. Red / XL" style={inp} /></div>
          <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Price (leave blank = base {basePrice})</label><input type="number" value={vForm.price} onChange={e => setVForm(f => ({ ...f, price: e.target.value }))} placeholder="Optional" style={inp} step="0.01" /></div>
          <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Stock</label><input type="number" value={vForm.stock} onChange={e => setVForm(f => ({ ...f, stock: e.target.value }))} placeholder="Optional" style={inp} /></div>
          <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>SKU</label><input value={vForm.sku} onChange={e => setVForm(f => ({ ...f, sku: e.target.value }))} placeholder="Optional" style={inp} /></div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Variant Image</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            {vForm.image_url && <img src={vForm.image_url} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />}
            <label style={{ padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem' }}>
              {uploading ? '⏳' : '📷 Upload'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadVariantImg(e.target.files[0])} disabled={uploading} />
            </label>
            <input value={vForm.image_url} onChange={e => setVForm(f => ({ ...f, image_url: e.target.value }))} placeholder="Or paste URL" style={{ ...inp, flex: 1 }} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Variant Description</label>
          <textarea value={vForm.description} onChange={e => setVForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional — overrides product description for this variant" rows={2} style={{ ...inp, resize: 'vertical', marginTop: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveVariant} style={{ padding: '8px 18px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>{editingV ? '💾 Update' : '➕ Add Variant'}</button>
          {editingV && <button onClick={() => { setEditingV(null); setVForm({ combination: '', price: '', stock: '', sku: '', image_url: '', description: '' }); }} style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>}
        </div>
      </div>

      {/* Variants list */}
      {variants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {variants.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              {v.image_url && <img src={v.image_url} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e' }}>{v.combination}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {v.price ? `$${v.price}` : 'Base price'} · Stock: {v.stock ?? 'default'} {v.sku ? `· SKU: ${v.sku}` : ''}
                </div>
              </div>
              <button onClick={() => editVariant(v)} style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button>
              <button onClick={() => delVariant(v.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [modalTab, setModalTab] = useState('details');
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

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModalTab('details'); setShowModal(true); };
  const openEdit = (p) => { setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, image_url: p.image_url || '', category_id: p.category_id, featured: !!p.featured, visible: p.visible !== 0 }); setEditing(p.id); setModalTab('details'); setShowModal(true); };

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
    const id = deleteId;
    setDeleteId(null);
    setProducts(prev => prev.filter(p => p.id !== id));
    try { await API.delete(`/admin/products/${id}`); notify('Product deleted', 'info'); load(); }
    catch { notify('Delete failed', 'error'); load(); }
  };

  const toggleFeatured = async (p) => {
    const next = !p.featured;
    try {
      await API.put(`/admin/products/${p.id}/featured`, { featured: next });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, featured: next } : x));
      notify(next ? 'Marked as featured' : 'Removed from featured');
    } catch { notify('Failed to update featured', 'error'); }
  };

  const toggleVisible = async (p) => {
    const next = p.visible === 0;
    try {
      await API.put(`/admin/products/${p.id}/visible`, { visible: next });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, visible: next ? 1 : 0 } : x));
      notify(next ? 'Product is now visible' : 'Product hidden from store');
    } catch { notify('Failed to update visibility', 'error'); }
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
            {editing && (
              <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f1f5f9', padding: '0 24px' }}>
                {[['details', '📋 Details'], ['gallery', '🖼️ Gallery'], ['variants', '🎯 Variants']].map(([tab, label]) => (
                  <button key={tab} onClick={() => setModalTab(tab)} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: modalTab === tab ? '#e94560' : '#888', borderBottom: modalTab === tab ? '2px solid #e94560' : '2px solid transparent', marginBottom: '-2px' }}>{label}</button>
                ))}
              </div>
            )}
            {modalTab === 'details' && (
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.visible !== false} onChange={e => setForm({ ...form, visible: e.target.checked })} />
                Visible in store
              </label>
              <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Saving...' : editing ? '💾 Update' : '➕ Create Product'}</button>
            </form>
            )}
            {modalTab === 'gallery' && editing && <GalleryManager productId={editing} onClose={() => setShowModal(false)} hideClose />}
            {modalTab === 'variants' && editing && <VariantsManager productId={editing} basePrice={form.price} onClose={() => setShowModal(false)} hideClose />}
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
              <th style={s.th}>Visible</th>
              <th style={s.th}>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={s.noData}>Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} style={s.noData}>No products found</td></tr>
              ) : paginated.map(p => (
                <tr key={p.id} style={{ ...s.tr, opacity: p.visible === 0 ? 0.5 : 1 }}>
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
                    <button onClick={() => toggleVisible(p)} title={p.visible === 0 ? 'Hidden — click to show' : 'Visible — click to hide'}
                      style={{ background: p.visible === 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${p.visible === 0 ? '#fecaca' : '#bbf7d0'}`, borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: p.visible === 0 ? '#ef4444' : '#16a34a' }}>
                      {p.visible === 0 ? '🙈 Hidden' : '👁 Visible'}
                    </button>
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      <button onClick={() => openEdit(p)} style={s.btnEdit}>✏️ Edit</button>
                      <button onClick={() => duplicateProduct(p.id)} style={s.btnEdit} title="Duplicate">⧉</button>
                      <button onClick={() => setDeleteId(p.id)} style={s.btnDel}>🗑 Delete</button>
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
  btnDel: { padding: '5px 12px', borderRadius: '6px', border: 'none', background: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', color: '#fff', fontWeight: '700' },
  btnPrimary: { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' },
  btnCancel: { padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.88rem' },
  btnDanger: { padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' },
  noData: { padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '0.88rem' },
  pagination: { display: 'flex', gap: '6px', padding: '16px', justifyContent: 'center', borderTop: '1px solid #f5f5f5' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' },
  pageActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
};
