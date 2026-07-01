import { useEffect, useState } from 'react';
import API from '../../api';
import Toast from '../../components/Toast';

const EMPTY = { title: '', subtitle: '', cta_text: 'Shop Now', cta_link: '/products', image_url: '', overlay_opacity: '0.45', sort_order: '0', is_active: 1 };

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const load = () => {
    API.get('/banners/all').then(r => setBanners(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.image_url) return notify('Image URL is required', 'error');
    setSaving(true);
    try {
      if (editId) {
        await API.put(`/banners/${editId}`, form);
        notify('Banner updated');
      } else {
        await API.post('/banners', form);
        notify('Banner created');
      }
      setForm(EMPTY);
      setEditId(null);
      load();
    } catch { notify('Save failed', 'error'); }
    setSaving(false);
  };

  const handleEdit = (b) => {
    setEditId(b.id);
    setForm({ ...b });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return;
    await API.delete(`/banners/${id}`);
    notify('Banner deleted');
    load();
  };

  const toggleActive = async (b) => {
    await API.put(`/banners/${b.id}`, { ...b, is_active: b.is_active ? 0 : 1 });
    load();
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Preview modal */}
      {preview && (
        <div style={s.modalBg} onClick={() => setPreview(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ ...s.previewSlide, backgroundImage: `url(${preview})` }}>
              <div style={{ ...s.previewOverlay, background: `rgba(0,0,0,${form.overlay_opacity})` }} />
              <div style={s.previewContent}>
                <div style={s.previewBadge}>New Collection</div>
                <h2 style={s.previewTitle}>{form.title || 'Banner Title'}</h2>
                <p style={s.previewSub}>{form.subtitle || 'Banner subtitle goes here'}</p>
                <div style={s.previewBtn}>{form.cta_text || 'Shop Now'} →</div>
              </div>
            </div>
            <button onClick={() => setPreview(null)} style={s.closeBtn}>✕ Close Preview</button>
          </div>
        </div>
      )}

      <div style={s.pageHd}>
        <div>
          <h2 style={s.title}>Banner Management</h2>
          <p style={s.sub}>Control the homepage hero carousel. Changes appear immediately after saving.</p>
        </div>
      </div>

      {/* Form */}
      <div style={s.formCard}>
        <h3 style={s.formTitle}>{editId ? '✏️ Edit Banner' : '+ Add New Banner'}</h3>
        <div style={s.grid2}>
          <Field label="Slide Title" value={form.title} onChange={v => set('title', v)} placeholder="New Season. New Deals." />
          <Field label="CTA Button Text" value={form.cta_text} onChange={v => set('cta_text', v)} placeholder="Shop Now" />
        </div>
        <Field label="Subtitle / Description" value={form.subtitle} onChange={v => set('subtitle', v)} placeholder="Short compelling description..." />
        <div style={s.grid2}>
          <Field label="CTA Button Link" value={form.cta_link} onChange={v => set('cta_link', v)} placeholder="/products" />
          <Field label="Sort Order (0 = first)" value={form.sort_order} onChange={v => set('sort_order', v)} type="number" />
        </div>

        {/* Image URL + preview */}
        <div style={s.field}>
          <label style={s.label}>Banner Image URL <span style={s.hint}>(use a landscape image, min 1400×600px recommended)</span></label>
          <div style={s.imgRow}>
            <input
              value={form.image_url}
              onChange={e => set('image_url', e.target.value)}
              style={{ ...s.input, flex: 1 }}
              placeholder="https://images.unsplash.com/photo-..."
            />
            {form.image_url && (
              <button style={s.btnPreview} onClick={() => setPreview(form.image_url)}>
                Preview
              </button>
            )}
          </div>
          {form.image_url && (
            <img
              src={form.image_url}
              alt="preview"
              style={s.imgThumb}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <p style={s.hint2}>
            Tip: Use <a href="https://unsplash.com" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Unsplash.com</a> for free high-quality images. Right-click image → Copy image address.
          </p>
        </div>

        <div style={s.grid2}>
          <div style={s.field}>
            <label style={s.label}>Overlay Opacity <span style={s.hint}>(0 = transparent, 1 = black)</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="range" min="0" max="0.9" step="0.05" value={form.overlay_opacity}
                onChange={e => set('overlay_opacity', e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontWeight: 700, minWidth: 30 }}>{form.overlay_opacity}</span>
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Status</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ v: 1, l: 'Active' }, { v: 0, l: 'Inactive' }].map(o => (
                <button key={o.v} onClick={() => set('is_active', o.v)}
                  style={{ ...s.statusBtn, ...(Number(form.is_active) === o.v ? s.statusBtnActive : {}) }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={s.formActions}>
          <button onClick={handleSave} disabled={saving} style={s.btnSave}>
            {saving ? 'Saving...' : editId ? '✓ Update Banner' : '+ Add Banner'}
          </button>
          {editId && (
            <button onClick={() => { setForm(EMPTY); setEditId(null); }} style={s.btnCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Banner list */}
      <div style={s.listCard}>
        <h3 style={s.formTitle}>Live Banners ({banners.length})</h3>
        {loading ? <p style={{ color: '#888' }}>Loading...</p> : banners.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '32px 0' }}>No banners yet. Add one above.</p>
        ) : (
          <div style={s.bannerList}>
            {banners.map((b) => (
              <div key={b.id} style={{ ...s.bannerRow, opacity: b.is_active ? 1 : 0.5 }}>
                <img
                  src={b.image_url}
                  alt={b.title}
                  style={s.bannerThumb}
                  onError={(e) => { e.target.src = 'https://placehold.co/120x60?text=?'; }}
                />
                <div style={s.bannerInfo}>
                  <div style={s.bannerTitle}>{b.title || '(No title)'}</div>
                  <div style={s.bannerMeta}>{b.subtitle?.slice(0, 60)}{b.subtitle?.length > 60 ? '...' : ''}</div>
                  <div style={s.bannerMeta}>CTA: <strong>{b.cta_text}</strong> → {b.cta_link}</div>
                </div>
                <div style={s.bannerActions}>
                  <span style={{ ...s.activeBadge, background: b.is_active ? '#dcfce7' : '#f1f5f9', color: b.is_active ? '#16a34a' : '#64748b' }}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleActive(b)} style={s.btnToggle}>
                    {b.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleEdit(b)} style={s.btnEdit}>Edit</button>
                  <button onClick={() => handleDelete(b.id)} style={s.btnDelete}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} style={s.input} placeholder={placeholder} />
    </div>
  );
}

const s = {
  wrap: { padding: '16px', maxWidth: '1000px' },
  pageHd: { marginBottom: '24px' },
  title: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  sub: { color: '#888', fontSize: '0.85rem', marginTop: 4 },
  formCard: { background: '#fff', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  listCard: { background: '#fff', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  formTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#374151' },
  hint: { fontWeight: 400, color: '#94a3b8', fontSize: '0.75rem' },
  hint2: { fontSize: '0.76rem', color: '#94a3b8', marginTop: 4 },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.15s' },
  imgRow: { display: 'flex', gap: 10, alignItems: 'center' },
  imgThumb: { width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8, border: '1px solid #e5e7eb' },
  btnPreview: { padding: '9px 16px', background: '#f1f5f9', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' },
  statusBtn: { padding: '8px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' },
  statusBtnActive: { background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  formActions: { display: 'flex', gap: 12, paddingTop: 4 },
  btnSave: { padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' },
  btnCancel: { padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  bannerList: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 },
  bannerRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', borderRadius: 10, border: '1px solid #e5e7eb', flexWrap: 'wrap' },
  bannerThumb: { width: 100, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 },
  bannerInfo: { flex: 1, minWidth: 180 },
  bannerTitle: { fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: 2 },
  bannerMeta: { fontSize: '0.78rem', color: '#64748b' },
  bannerActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  activeBadge: { fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  btnToggle: { padding: '5px 12px', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 },
  btnEdit: { padding: '5px 12px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 },
  btnDelete: { padding: '5px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 900, background: '#fff', borderRadius: 16, overflow: 'hidden' },
  previewSlide: { position: 'relative', height: 400, backgroundSize: 'cover', backgroundPosition: 'center' },
  previewOverlay: { position: 'absolute', inset: 0 },
  previewContent: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 48px' },
  previewBadge: { display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(233,69,96,0.85)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 },
  previewTitle: { fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: 10 },
  previewSub: { fontSize: '1rem', color: 'rgba(255,255,255,0.85)', marginBottom: 20, maxWidth: 420 },
  previewBtn: { display: 'inline-flex', alignSelf: 'flex-start', background: '#e94560', color: '#fff', padding: '11px 24px', borderRadius: 8, fontWeight: 700 },
  closeBtn: { display: 'block', width: '100%', padding: '14px', background: '#f8f9fb', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
};
