import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

export default function DashProfile() {
  const { user, login, token } = useAuth();
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('profile');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const notify = (message, type = 'success') => setToast({ message, type });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return notify('Image must be under 2MB', 'error');
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
    notify('Profile picture updated!');
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify('Name is required', 'error');
    setSaving(true);
    setTimeout(() => {
      login({ ...user, name: form.name, email: form.email }, token);
      setSaving(false);
      notify('Profile updated successfully!');
    }, 600);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (pwForm.newPw.length < 6) return notify('Password must be at least 6 characters', 'error');
    if (pwForm.newPw !== pwForm.confirm) return notify('Passwords do not match', 'error');
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
      notify('Password changed successfully!');
    }, 600);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={s.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 style={s.title}>My Profile</h2>

      {/* Avatar Section */}
      <div style={s.avatarSection}>
        <div style={s.avatarWrap}>
          {avatar
            ? <img src={avatar} alt="avatar" style={s.avatarImg} />
            : <div style={s.avatarInitials}>{initials}</div>}
          <button onClick={() => fileRef.current.click()} style={s.avatarEdit} title="Change photo">✏️</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
        <div>
          <div style={s.avatarName}>{user?.name}</div>
          <div style={s.avatarEmail}>{user?.email}</div>
          <span style={s.roleBadge}>{user?.role || 'customer'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {['profile', 'password'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
            {t === 'profile' ? '👤 Edit Profile' : '🔐 Change Password'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleProfileSave} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Full Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={s.input} placeholder="Full Name" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={s.input} type="email" placeholder="Email" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Account Role</label>
            <input value={user?.role || 'customer'} style={{ ...s.input, background: '#f5f5f5', color: '#888' }} disabled />
          </div>
          <button type="submit" disabled={saving} style={s.saveBtn}>{saving ? 'Saving...' : '💾 Save Changes'}</button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={handlePasswordSave} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Current Password</label>
            <input value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} style={s.input} type="password" placeholder="Current password" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>New Password</label>
            <input value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} style={s.input} type="password" placeholder="New password (min 6 chars)" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Confirm New Password</label>
            <input value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} style={s.input} type="password" placeholder="Confirm new password" required />
          </div>
          <button type="submit" disabled={saving} style={s.saveBtn}>{saving ? 'Saving...' : '🔐 Change Password'}</button>
        </form>
      )}
    </div>
  );
}

const s = {
  container: { padding: '24px', maxWidth: '600px' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '24px', color: '#1a1a2e' },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '20px', background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarImg: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e94560' },
  avatarInitials: { width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #e94560, #1a1a2e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700', border: '3px solid #e94560' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  avatarName: { fontWeight: '700', fontSize: '1.1rem', color: '#1a1a2e' },
  avatarEmail: { color: '#888', fontSize: '0.85rem', margin: '2px 0 8px' },
  roleBadge: { background: '#e94560', color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { padding: '9px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: '#555' },
  tabActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  form: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#555' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.95rem', outline: 'none' },
  saveBtn: { padding: '11px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', marginTop: '4px' },
};
