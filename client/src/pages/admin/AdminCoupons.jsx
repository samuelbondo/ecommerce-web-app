import { useState } from 'react';
import Toast from '../../components/Toast';
import { useSettings } from '../../context/SettingsContext';

const EMPTY = { code: '', type: 'percentage', value: '', minOrder: '', expiry: '', usageLimit: '', description: '' };

export default function AdminCoupons() {
  const { currency, formatPrice } = useSettings();
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'SAVE10', type: 'percentage', value: 10, minOrder: 1000, expiry: '2026-12-31', usageLimit: 100, used: 12, active: true, description: '10% off all orders' },
    { id: 2, code: 'FLAT500', type: 'fixed', value: 500, minOrder: 2000, expiry: '2026-09-30', usageLimit: 50, used: 5, active: true, description: '500 off orders above 2000' },
    { id: 3, code: 'FREESHIP', type: 'freeshipping', value: 0, minOrder: 3000, expiry: '2026-08-31', usageLimit: 200, used: 44, active: false, description: 'Free shipping on orders above 3000' },
  ]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.code || !form.value) return notify('Code and value are required', 'error');
    if (editing) {
      setCoupons(prev => prev.map(c => c.id === editing ? { ...c, ...form, value: Number(form.value), minOrder: Number(form.minOrder), usageLimit: Number(form.usageLimit) } : c));
      notify('Coupon updated!');
    } else {
      setCoupons(prev => [...prev, { ...form, id: Date.now(), value: Number(form.value), minOrder: Number(form.minOrder), usageLimit: Number(form.usageLimit), used: 0, active: true }]);
      notify('Coupon created!');
    }
    setShowModal(false); setEditing(null); setForm(EMPTY);
  };

  const toggleActive = (id) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    notify('Coupon status updated');
  };

  const openEdit = (c) => {
    setForm({ code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, expiry: c.expiry, usageLimit: c.usageLimit, description: c.description });
    setEditing(c.id); setShowModal(true);
  };

  const typeLabel = (t) => ({ percentage: '% Off', fixed: 'Fixed', freeshipping: 'Free Ship' }[t]);
  const typeColor = (t) => ({ percentage: '#8b5cf6', fixed: '#3b82f6', freeshipping: '#10b981' }[t]);

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {deleteId && (
        <div style={s.overlay}><div style={s.dialog}>
          <h3 style={s.dlgTitle}>Delete Coupon?</h3>
          <p style={s.dlgText}>This cannot be undone.</p>
          <div style={s.dlgBtns}>
            <button onClick={() => setDeleteId(null)} style={s.btnCancel}>Cancel</button>
            <button onClick={() => { setCoupons(p => p.filter(c => c.id !== deleteId)); setDeleteId(null); notify('Deleted', 'info'); }} style={s.btnDanger}>Delete</button>
          </div>
        </div></div>
      )}

      {showModal && (
        <div style={s.overlay}><div style={s.modal}>
          <div style={s.modalHeader}>
            <h3 style={s.modalTitle}>{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
            <button onClick={() => setShowModal(false)} style={s.closeBtn}>×</button>
          </div>
          <form onSubmit={handleSave} style={s.modalBody}>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Coupon Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} style={s.input} placeholder="e.g. SAVE10" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={s.input}>
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="freeshipping">Free Shipping</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>{form.type === 'percentage' ? 'Discount %' : `Discount Amount (${currency})`}</label>
                <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} style={s.input} type="number" min="0" placeholder="e.g. 10" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Min Order ({currency})</label>
                <input value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} style={s.input} type="number" min="0" placeholder="0" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Expiry Date</label>
                <input value={form.expiry} onChange={e => setForm({ ...form, expiry: e.target.value })} style={s.input} type="date" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Usage Limit</label>
                <input value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} style={s.input} type="number" min="1" placeholder="e.g. 100" />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={s.input} placeholder="Short description..." />
            </div>
            <button type="submit" style={s.btnPrimary}>{editing ? '💾 Update' : '➕ Create Coupon'}</button>
          </form>
        </div></div>
      )}

      <div style={s.pageHeader}>
        <div><h2 style={s.pageTitle}>Coupons & Promotions</h2><p style={s.pageSub}>{coupons.length} coupons</p></div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowModal(true); }} style={s.btnPrimary}>➕ New Coupon</button>
      </div>

      <div style={s.grid}>
        {coupons.map(c => (
          <div key={c.id} style={{ ...s.card, opacity: c.active ? 1 : 0.6 }}>
            <div style={s.cardTop}>
              <span style={s.couponCode}>{c.code}</span>
              <span style={{ ...s.typeBadge, background: typeColor(c.type) + '20', color: typeColor(c.type) }}>{typeLabel(c.type)}</span>
            </div>
            <div style={s.couponValue}>
              {c.type === 'percentage' ? `${c.value}% OFF` : c.type === 'fixed' ? `${formatPrice(c.value)} OFF` : 'FREE SHIPPING'}
            </div>
            <p style={s.couponDesc}>{c.description}</p>
            <div style={s.couponMeta}>
              <span>Min: {formatPrice(c.minOrder)}</span>
              <span>Limit: {c.used}/{c.usageLimit}</span>
              <span>Exp: {c.expiry}</span>
            </div>
            <div style={s.cardActions}>
              <button onClick={() => toggleActive(c.id)} style={{ ...s.btnToggle, background: c.active ? '#10b981' : '#e5e7eb', color: c.active ? '#fff' : '#555' }}>
                {c.active ? '✓ Active' : '○ Inactive'}
              </button>
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
  modal: { background: '#fff', borderRadius: '16px', width: '540px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' },
  modalTitle: { fontSize: '1rem', fontWeight: '700', margin: 0, color: '#1a1a2e' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' },
  modalBody: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#555' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' },
  dialog: { background: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '340px', width: '90%' },
  dlgTitle: { margin: '0 0 8px', fontWeight: '700', color: '#1a1a2e' },
  dlgText: { color: '#888', fontSize: '0.88rem', marginBottom: '20px' },
  dlgBtns: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  btnCancel: { padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' },
  btnDanger: { padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '600' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  btnPrimary: { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' },
  card: { background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  couponCode: { fontFamily: 'monospace', fontWeight: '800', fontSize: '1rem', color: '#1a1a2e', background: '#f5f5f5', padding: '3px 10px', borderRadius: '6px', letterSpacing: '1px' },
  typeBadge: { padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' },
  couponValue: { fontSize: '1.3rem', fontWeight: '800', color: '#e94560', margin: '4px 0 6px' },
  couponDesc: { color: '#888', fontSize: '0.82rem', margin: '0 0 10px' },
  couponMeta: { display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#aaa', marginBottom: '14px', flexWrap: 'wrap' },
  cardActions: { display: 'flex', gap: '8px' },
  btnToggle: { padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' },
  btnEdit: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem' },
  btnDel: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444' },
};
