import { useState } from 'react';
import Toast from '../../components/Toast';

const DEFAULT = { label: 'Home', name: '', phone: '', address: '', city: '', country: 'Kenya' };

export default function DashAddresses() {
  const [addresses, setAddresses] = useState([
    { id: 1, label: 'Home', name: 'Samuel Bondo', phone: '+254 700 000 000', address: '123 Main St', city: 'Nairobi', country: 'Kenya', isDefault: true },
  ]);
  const [form, setForm] = useState(DEFAULT);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  const handleSave = (e) => {
    e.preventDefault();
    if (editing) {
      setAddresses(prev => prev.map(a => a.id === editing ? { ...a, ...form } : a));
      notify('Address updated!');
    } else {
      setAddresses(prev => [...prev, { ...form, id: Date.now(), isDefault: prev.length === 0 }]);
      notify('Address added!');
    }
    setForm(DEFAULT); setEditing(null); setShowForm(false);
  };

  const handleEdit = (a) => {
    setForm({ label: a.label, name: a.name, phone: a.phone, address: a.address, city: a.city, country: a.country });
    setEditing(a.id); setShowForm(true);
  };

  const handleDelete = () => {
    setAddresses(prev => prev.filter(a => a.id !== deleteId));
    setDeleteId(null); notify('Address removed.', 'info');
  };

  const setDefault = (id) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    notify('Default address updated!');
  };

  return (
    <div style={s.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Delete Dialog */}
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
        <h2 style={s.title}>Saved Addresses</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(DEFAULT); }} style={s.addBtn}>
          {showForm ? '✕ Cancel' : '+ Add Address'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={s.form}>
          <h3 style={s.formTitle}>{editing ? 'Edit Address' : 'New Address'}</h3>
          <div className="dash-addr-form-grid">
            {[['label', 'Label (Home/Work)', 'text'], ['name', 'Full Name', 'text'], ['phone', 'Phone Number', 'tel'], ['city', 'City', 'text'], ['country', 'Country', 'text']].map(([key, ph, type]) => (
              <div key={key} style={s.field}>
                <label style={s.label}>{ph}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={s.input} type={type} placeholder={ph} required />
              </div>
            ))}
          </div>
          <div style={s.field}>
            <label style={s.label}>Street Address</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={s.input} placeholder="Street Address" required />
          </div>
          <button type="submit" style={s.saveBtn}>{editing ? '💾 Update Address' : '➕ Save Address'}</button>
        </form>
      )}

      {addresses.length === 0 ? (
        <div style={s.empty}>📍 No saved addresses yet.</div>
      ) : (
        <div className="dash-addr-grid">
          {addresses.map(a => (
            <div key={a.id} style={{ ...s.addressCard, border: a.isDefault ? '2px solid #e94560' : '1px solid #e5e7eb' }}>
              <div style={s.addressTop}>
                <span style={s.addressLabel}>{a.label}</span>
                {a.isDefault && <span style={s.defaultBadge}>Default</span>}
              </div>
              <p style={s.addressText}>{a.name}</p>
              <p style={s.addressText}>{a.phone}</p>
              <p style={s.addressText}>{a.address}</p>
              <p style={s.addressText}>{a.city}, {a.country}</p>
              <div style={s.addressActions}>
                <button onClick={() => handleEdit(a)} style={s.editBtn}>✏️ Edit</button>
                {!a.isDefault && <button onClick={() => setDefault(a.id)} style={s.editBtn}>📌 Set Default</button>}
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
  container: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  addBtn: { padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  form: { background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '14px' },
  formTitle: { margin: '0 0 4px', fontSize: '1rem', fontWeight: '700', color: '#1a1a2e' },
  grid2: {},
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.82rem', fontWeight: '600', color: '#555' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' },
  saveBtn: { padding: '10px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  empty: { textAlign: 'center', padding: '48px', color: '#888', background: '#fff', borderRadius: '16px' },
  addressGrid: {},
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
