import { useState, useEffect } from 'react';
import Toast from '../../components/Toast';
import API from '../../api';

const MAX = 5;
const DEFAULT_FORM = { label: 'Home', name: '', phone: '', address: '', city: '', country: 'Kenya' };

export default function DashAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const load = () => {
    setLoading(true);
    API.get('/addresses')
      .then(r => setAddresses(r.data))
      .catch(() => notify('Failed to load addresses', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    if (addresses.length >= MAX) return notify(`Maximum ${MAX} addresses allowed`, 'error');
    setForm(DEFAULT_FORM); setEditing(null); setShowForm(true);
  };

  const openEdit = (a) => {
    setForm({ label: a.label, name: a.name, phone: a.phone, address: a.address, city: a.city, country: a.country });
    setEditing(a.id); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/addresses/${editing}`, form);
        notify('Address updated!');
      } else {
        await API.post('/addresses', form);
        notify('Address added!');
      }
      setShowForm(false); setEditing(null); setForm(DEFAULT_FORM);
      load();
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/addresses/${deleteId}`);
      notify('Address removed.', 'info');
      setDeleteId(null);
      load();
    } catch { notify('Failed to delete', 'error'); }
  };

  const setDefault = async (id) => {
    try {
      await API.put(`/addresses/${id}/default`);
      notify('Default address updated!');
      load();
    } catch { notify('Failed to update', 'error'); }
  };

  return (
    <div style={s.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {deleteId && (
        <div style={s.overlay}>
          <div style={s.dialog}>
            <h3 style={s.dialogTitle}>Delete Address?</h3>
            <p style={s.dialogText}>This action cannot be undone.</p>
            <div style={s.dialogActions}>
              <button onClick={() => setDeleteId(null)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleDelete} style={s.deleteBtn}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.header}>
        <div>
          <h2 style={s.title}>Saved Addresses</h2>
          <p style={s.subtitle}>{addresses.length} / {MAX} addresses used</p>
        </div>
        {!showForm && (
          <button onClick={openAdd} style={{ ...s.addBtn, opacity: addresses.length >= MAX ? 0.5 : 1 }}
            disabled={addresses.length >= MAX}>
            + Add Address
          </button>
        )}
        {showForm && (
          <button onClick={() => { setShowForm(false); setEditing(null); }} style={s.cancelAddBtn}>✕ Cancel</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={s.form}>
          <h3 style={s.formTitle}>{editing ? 'Edit Address' : 'New Address'}</h3>
          <div className="dash-addr-form-grid">
            {[['label','Label (Home / Work / Other)','text'],['name','Full Name','text'],['phone','Phone Number','tel'],['city','City','text'],['country','Country','text']].map(([key, ph, type]) => (
              <div key={key} style={s.field}>
                <label style={s.label}>{ph}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={s.input} type={type} placeholder={ph} required={key !== 'phone'} />
              </div>
            ))}
          </div>
          <div style={s.field}>
            <label style={s.label}>Street Address</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              style={s.input} placeholder="Street Address" required />
          </div>
          <button type="submit" style={s.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : editing ? '💾 Update Address' : '➕ Save Address'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={s.empty}>Loading...</div>
      ) : addresses.length === 0 ? (
        <div style={s.empty}>📍 No saved addresses yet.</div>
      ) : (
        <div className="dash-addr-grid">
          {addresses.map(a => (
            <div key={a.id} style={{ ...s.addressCard, border: a.is_default ? '2px solid #e94560' : '1px solid #e5e7eb' }}>
              <div style={s.addressTop}>
                <span style={s.addressLabel}>{a.label}</span>
                {a.is_default ? <span style={s.defaultBadge}>Default</span> : null}
              </div>
              <p style={s.addressText}>{a.name}</p>
              {a.phone && <p style={s.addressText}>{a.phone}</p>}
              <p style={s.addressText}>{a.address}</p>
              <p style={s.addressText}>{a.city}, {a.country}</p>
              <div style={s.addressActions}>
                <button onClick={() => openEdit(a)} style={s.editBtn}>✏️ Edit</button>
                {!a.is_default && <button onClick={() => setDefault(a.id)} style={s.editBtn}>📌 Set Default</button>}
                <button onClick={() => setDeleteId(a.id)} style={s.removeBtn}>🗑 Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { padding: '16px', boxSizing: 'border-box', width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  title: { fontSize: '1.3rem', fontWeight: '700', color: '#1a1a2e', margin: '0 0 2px' },
  subtitle: { fontSize: '0.78rem', color: '#888', margin: 0 },
  addBtn: { padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  cancelAddBtn: { padding: '9px 18px', background: '#f1f5f9', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  form: { background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '14px' },
  formTitle: { margin: '0 0 4px', fontSize: '1rem', fontWeight: '700', color: '#1a1a2e' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.82rem', fontWeight: '600', color: '#555' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  saveBtn: { padding: '10px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  empty: { textAlign: 'center', padding: '48px', color: '#888', background: '#fff', borderRadius: '16px' },
  addressCard: { background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  addressTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  addressLabel: { fontWeight: '700', color: '#1a1a2e', fontSize: '0.95rem' },
  defaultBadge: { background: '#e94560', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '600' },
  addressText: { margin: '2px 0', color: '#555', fontSize: '0.85rem' },
  addressActions: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' },
  editBtn: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#555' },
  removeBtn: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 },
  dialog: { background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
  dialogTitle: { margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '700', color: '#1a1a2e' },
  dialogText: { color: '#888', fontSize: '0.9rem', marginBottom: '20px' },
  dialogActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.9rem' },
  deleteBtn: { padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
};
