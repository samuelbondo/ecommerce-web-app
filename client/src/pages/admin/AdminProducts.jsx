import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Toast from '../../components/Toast';
import ImageUpload from '../../components/ImageUpload';
import API from '../../api';

const EMPTY = { name: '', description: '', price: '', stock: '', image_url: '', category_id: '', featured: false, visible: true };

function QuickCategoryModal({ onCreated, onClose }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { const { data } = await API.post('/admin/categories', { name: name.trim() }); onCreated(data); }
    catch { alert('Failed to create category'); }
    setSaving(false);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <h4 style={{ margin: '0 0 14px', fontWeight: 700, color: '#1a1a2e' }}>New Category</h4>
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Category name" autoFocus
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: '#e94560', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>{saving ? 'Creating...' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}

function GalleryManager({ productId, hideClose, onClose }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const load = () => API.get(`/admin/products/${productId}/images`).then(r => setImages(r.data)).catch(() => {});
  useEffect(() => { load(); }, [productId]);

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await API.post(`/admin/products/${productId}/images`, { url: data.url, is_primary: images.length === 0 });
      load();
    } catch { alert('Upload failed'); }
    setUploading(false);
  };

  const uploadMultiple = async (files) => {
    for (const file of Array.from(files)) await uploadFile(file);
  };

  const remove = async (imgId) => {
    if (!window.confirm('Remove this image?')) return;
    await API.delete(`/admin/products/${productId}/images/${imgId}`);
    load();
  };

  const setPrimary = async (img) => {
    await API.post(`/admin/products/${productId}/images`, { url: img.url, is_primary: true });
    load();
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    uploadMultiple(e.dataTransfer.files);
  };

  return (
    <div>
      {/* Drop zone */}
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '24px 16px',
          border: `2px dashed ${dragOver ? '#e94560' : '#e5e7eb'}`,
          borderRadius: 12, cursor: 'pointer', marginBottom: 16,
          background: dragOver ? '#fff1f3' : '#fafafa',
          transition: 'all 0.15s',
        }}>
        <span style={{ fontSize: '1.8rem' }}>{uploading ? '⏳' : '🖼️'}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
          {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG, WEBP — multiple files supported</span>
        <input type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => uploadMultiple(e.target.files)} disabled={uploading} />
      </label>

      {/* Image grid */}
      {images.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', padding: '8px 0 16px' }}>
          No images yet. Upload above to build the gallery.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10, marginBottom: 12 }}>
          {images.map((img, i) => (
            <div key={img.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden',
              border: `2px solid ${img.is_primary ? '#e94560' : '#e5e7eb'}`,
              boxShadow: img.is_primary ? '0 0 0 3px #e9456022' : 'none',
              transition: 'border-color 0.15s' }}>
              <img src={img.url} alt={`product ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.src = 'https://placehold.co/90x90?text=?'; }} />

              {/* Primary badge */}
              {img.is_primary && (
                <span style={{ position: 'absolute', top: 4, left: 4, background: '#e94560', color: '#fff',
                  fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                  textTransform: 'uppercase', letterSpacing: '0.05em' }}>Main</span>
              )}

              {/* Hover actions */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 6, opacity: 0, transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                {!img.is_primary && (
                  <button onClick={() => setPrimary(img)}
                    style={{ padding: '4px 10px', background: '#fff', border: 'none', borderRadius: 6,
                      cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, color: '#e94560' }}
                    title="Set as main image">★ Main</button>
                )}
                <button onClick={() => remove(img.id)}
                  style={{ padding: '4px 10px', background: '#ef4444', border: 'none', borderRadius: 6,
                    cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}
                  title="Remove image">✕ Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
        💡 <strong>Main</strong> image is shown as the product thumbnail everywhere.
        Hover any image to set it as main or remove it.
        Variant images are managed separately in the Variants section below.
      </div>
    </div>
  );
}

const VEMPTY = { combination: '', price: '', stock: '', sku: '', image_url: '' };

function VariantsManager({ productId, basePrice, hideClose, onClose }) {
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newOpt, setNewOpt] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [uploading, setUploading] = useState(null); // variantId or 'new'
  const [addForm, setAddForm] = useState(VEMPTY);
  const [addUploading, setAddUploading] = useState(false);

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

  const uploadImg = async (file, onDone, setLoading) => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onDone(data.url);
    } catch { alert('Upload failed'); }
    setLoading(false);
  };

  const saveNew = async () => {
    if (!addForm.combination.trim()) return alert('Enter a combination, e.g. Black / M');
    await API.post(`/admin/products/${productId}/variants`, addForm);
    setAddForm(VEMPTY); load();
  };

  const startEdit = (v) => { setEditingId(v.id); setEditRow({ combination: v.combination, price: v.price ?? '', stock: v.stock ?? '', sku: v.sku ?? '', image_url: v.image_url ?? '' }); };
  const cancelEdit = () => { setEditingId(null); setEditRow({}); };
  const saveEdit = async (id) => {
    await API.put(`/admin/products/${productId}/variants/${id}`, editRow);
    cancelEdit(); load();
  };
  const delVariant = async (id) => { if (!window.confirm('Delete this variant?')) return; await API.delete(`/admin/products/${productId}/variants/${id}`); load(); };

  const inp = { padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff' };
  const th = { padding: '8px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#f8f9fb', whiteSpace: 'nowrap' };
  const td = { padding: '8px 10px', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' };

  return (
    <div>
      {/* ── Option Types ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Option Types
          <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#94a3b8' }}>e.g. Color, Size, Material</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input value={newOpt} onChange={e => setNewOpt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addOption()}
            placeholder="Type option name and press Enter or Add"
            style={{ ...inp, flex: 1, padding: '8px 12px' }} />
          <button onClick={addOption}
            style={{ padding: '8px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            + Add
          </button>
        </div>
        {options.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {options.map(o => (
              <span key={o.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>
                {o.name}
                <button onClick={() => delOption(o.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', fontSize: '0.85rem', padding: 0, lineHeight: 1, opacity: 0.7 }}
                  title={`Remove ${o.name}`}>✕</button>
              </span>
            ))}
          </div>
        )}
        {options.length === 0 && (
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
            No options yet. Add "Color" or "Size" above, then add variants below.
          </div>
        )}
      </div>

      {/* ── Variants Table ── */}
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
        Variants
        <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#94a3b8' }}>
          {variants.length > 0 ? `${variants.length} variant${variants.length > 1 ? 's' : ''}` : 'none yet'}
        </span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 52 }}>Image</th>
              <th style={th}>Combination</th>
              <th style={th}>Price</th>
              <th style={th}>Stock</th>
              <th style={th}>SKU</th>
              <th style={{ ...th, width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {variants.map(v => (
              <tr key={v.id} style={{ background: editingId === v.id ? '#fffbeb' : '#fff' }}>
                {editingId === v.id ? (
                  <>
                    <td style={td}>
                      <div style={{ position: 'relative', width: 44, height: 44 }}>
                        {editRow.image_url
                          ? <img src={editRow.image_url} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                          : <div style={{ width: 44, height: 44, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📷</div>
                        }
                        <label style={{ position: 'absolute', inset: 0, cursor: 'pointer', borderRadius: 6, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                          <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>{uploading === v.id ? '...' : '✎'}</span>
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => uploadImg(e.target.files[0], url => setEditRow(r => ({ ...r, image_url: url })), val => setUploading(val ? v.id : null))} />
                        </label>
                      </div>
                    </td>
                    <td style={td}><input value={editRow.combination} onChange={e => setEditRow(r => ({ ...r, combination: e.target.value }))} style={inp} placeholder="e.g. Black / M" /></td>
                    <td style={td}><input type="number" value={editRow.price} onChange={e => setEditRow(r => ({ ...r, price: e.target.value }))} style={{ ...inp, width: 80 }} placeholder={`${basePrice}`} step="0.01" /></td>
                    <td style={td}><input type="number" value={editRow.stock} onChange={e => setEditRow(r => ({ ...r, stock: e.target.value }))} style={{ ...inp, width: 70 }} placeholder="0" /></td>
                    <td style={td}><input value={editRow.sku} onChange={e => setEditRow(r => ({ ...r, sku: e.target.value }))} style={inp} placeholder="SKU-001" /></td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <button onClick={() => saveEdit(v.id)} style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, marginRight: 4 }}>Save</button>
                      <button onClick={cancelEdit} style={{ padding: '4px 8px', background: '#f1f5f9', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={td}>
                      {v.image_url
                        ? <img src={v.image_url} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, display: 'block', border: '1px solid #e5e7eb' }} />
                        : <div style={{ width: 44, height: 44, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#cbd5e1' }}>—</div>
                      }
                    </td>
                    <td style={td}><span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e' }}>{v.combination}</span></td>
                    <td style={td}>
                      <span style={{ fontSize: '0.85rem', color: v.price ? '#1a1a2e' : '#94a3b8' }}>
                        {v.price ? `$${Number(v.price).toFixed(2)}` : <span style={{ fontStyle: 'italic' }}>base ${basePrice}</span>}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600,
                        color: v.stock === 0 ? '#ef4444' : v.stock <= 5 ? '#f59e0b' : '#10b981' }}>
                        {v.stock === 0 ? '✕ Out' : v.stock <= 5 ? `⚡ ${v.stock}` : v.stock ?? '—'}
                      </span>
                    </td>
                    <td style={td}><span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>{v.sku || '—'}</span></td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <button onClick={() => startEdit(v)} style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: '0.75rem', marginRight: 4 }}>✏️</button>
                      <button onClick={() => delVariant(v.id)} style={{ padding: '4px 8px', border: 'none', borderRadius: 5, background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>✕</button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* ── Add new variant row ── */}
            <tr style={{ background: '#f0fdf4' }}>
              <td style={td}>
                <div style={{ position: 'relative', width: 44, height: 44 }}>
                  {addForm.image_url
                    ? <img src={addForm.image_url} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                    : <div style={{ width: 44, height: 44, borderRadius: 6, border: '2px dashed #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#86efac' }}>+</div>
                  }
                  <label style={{ position: 'absolute', inset: 0, cursor: 'pointer', borderRadius: 6 }} title="Upload variant image">
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => uploadImg(e.target.files[0], url => setAddForm(f => ({ ...f, image_url: url })), setAddUploading)} />
                  </label>
                </div>
              </td>
              <td style={td}><input value={addForm.combination} onChange={e => setAddForm(f => ({ ...f, combination: e.target.value }))} style={{ ...inp, borderColor: '#bbf7d0' }} placeholder="e.g. Black / M" /></td>
              <td style={td}><input type="number" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} style={{ ...inp, width: 80, borderColor: '#bbf7d0' }} placeholder={`${basePrice}`} step="0.01" /></td>
              <td style={td}><input type="number" value={addForm.stock} onChange={e => setAddForm(f => ({ ...f, stock: e.target.value }))} style={{ ...inp, width: 70, borderColor: '#bbf7d0' }} placeholder="0" /></td>
              <td style={td}><input value={addForm.sku} onChange={e => setAddForm(f => ({ ...f, sku: e.target.value }))} style={{ ...inp, borderColor: '#bbf7d0' }} placeholder="SKU-001" /></td>
              <td style={td}>
                <button onClick={saveNew}
                  style={{ padding: '5px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {addUploading ? '⏳' : '+ Add'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
        💡 <strong>Tip:</strong> Combination format must match your option types — e.g. if you have <em>Color</em> and <em>Size</em>, write <em>Black / M</em>.
        Leave price blank to use the base product price. Upload an image per variant to enable color swatches on the product page.
      </div>
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
  const [savedProductId, setSavedProductId] = useState(null);
  const [showQuickCat, setShowQuickCat] = useState(false);
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

  const openAdd = () => { setForm(EMPTY); setEditing(null); setSavedProductId(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, image_url: p.image_url || '', category_id: p.category_id, featured: !!p.featured, visible: p.visible !== 0 }); setEditing(p.id); setSavedProductId(p.id); setShowModal(true); };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.name || !form.price || !form.stock) return notify('Name, price and stock are required', 'error');
    setSaving(true);
    try {
      if (editing) { await API.put(`/admin/products/${editing}`, form); notify('Product updated!'); setSavedProductId(editing); }
      else { const { data } = await API.post('/admin/products', form); notify('Product created! Now add images and variants below.'); setSavedProductId(data.id); setEditing(data.id); load(); }
      load();
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

      {showQuickCat && (
        <QuickCategoryModal
          onCreated={(cat) => { setCategories(prev => [...prev, cat]); setForm(f => ({ ...f, category_id: cat.id })); setShowQuickCat(false); }}
          onClose={() => setShowQuickCat(false)}
        />
      )}

      {showModal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, width: 640 }}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} style={s.modalClose}>×</button>
            </div>
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 'calc(90vh - 70px)' }}>
              {/* ── Basic Details ── */}
              <div style={s.section}>
                <div style={s.sectionTitle}>Basic Details</div>
                <div style={s.grid2}>
                  {[['name', 'Product Name', 'text'], ['price', 'Price', 'number'], ['stock', 'Stock', 'number']].map(([k, ph, t]) => (
                    <div key={k} style={s.field}>
                      <label style={s.label}>{ph}</label>
                      <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={s.input} type={t} placeholder={ph} required step={k === 'price' ? '0.01' : undefined} />
                    </div>
                  ))}
                  <div style={s.field}>
                    <label style={s.label}>Category</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={{ ...s.input, flex: 1 }}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowQuickCat(true)} title="Create new category"
                        style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8f9fb', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap' }}>+ New</button>
                    </div>
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Main Image</label>
                  <ImageUpload currentUrl={form.image_url} onUpload={url => setForm({ ...form, image_url: url })} size="md" />
                  <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} style={{ ...s.input, marginTop: 6 }} placeholder="Or paste image URL…" />
                </div>
                <div style={s.field}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={s.label}>Description</label>
                    <button type="button" onClick={generateAiDescription} disabled={aiGenerating}
                      style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600 }}>
                      {aiGenerating ? '⏳ Generating...' : '🤖 Generate with AI'}
                    </button>
                  </div>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={s.textarea} rows={3} placeholder="Product description..." />
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                    Mark as Featured
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.visible !== false} onChange={e => setForm({ ...form, visible: e.target.checked })} />
                    Visible in store
                  </label>
                </div>
                <button onClick={handleSave} disabled={saving} style={s.btnPrimary}>{saving ? 'Saving...' : editing ? '💾 Update Product' : '➕ Create Product'}</button>
              </div>

              {/* ── Gallery & Variants — shown after product exists ── */}
              {savedProductId && (
                <>
                  <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: 20 }}>
                    <div style={s.sectionTitle}>🖼️ Image Gallery</div>
                    <GalleryManager productId={savedProductId} hideClose />
                  </div>
                  <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: 20 }}>
                    <div style={s.sectionTitle}>🎯 Variants & Options</div>
                    <VariantsManager productId={savedProductId} basePrice={form.price} hideClose />
                  </div>
                </>
              )}
              {!savedProductId && (
                <div style={{ padding: '12px 16px', background: '#f8f9fb', borderRadius: 10, fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                  💡 Create the product first — then image gallery and variants will appear here.
                </div>
              )}
            </div>
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
  section: { display: 'flex', flexDirection: 'column', gap: 14 },
  sectionTitle: { fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
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
