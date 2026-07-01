import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import API from '../../api';

const COUNTRIES = ['Rwanda','Uganda','Kenya','Tanzania','Burundi','Ethiopia','Nigeria','Ghana','South Africa','United Kingdom','United States','Canada','Germany','France','Australia','India','China','Japan','Other'];

export default function DashProfile() {
  const { user, login, token } = useAuth();
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [newPwForm, setNewPwForm] = useState({ password: '', confirm: '' });
  const [setPwSaving, setSetPwSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', address: user?.address || '',
    city: user?.city || '', country: user?.country || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [activity, setActivity] = useState([]);
  const fileRef = useRef();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const notify = (message, type = 'success') => setToast({ message, type });
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    API.get(`/orders/${user?.id}`).then(r => setActivity(r.data.slice(0, 5))).catch(() => {});
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify('Name is required', 'error');
    if (!form.email.trim()) return notify('Email is required', 'error');
    setSaving(true);
    try {
      const res = await API.put('/auth/profile', form);
      login({ ...user, ...res.data.user }, token);
      notify('Profile updated successfully!');
    } catch (err) {
      notify(err.response?.data?.error || 'Update failed', 'error');
    } finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!pwForm.current) return notify('Current password is required', 'error');
    if (pwForm.newPw.length < 8) return notify('New password must be at least 8 characters', 'error');
    if (pwForm.newPw !== pwForm.confirm) return notify('Passwords do not match', 'error');
    setSaving(true);
    try {
      await API.put('/auth/password', { current: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current: '', newPw: '', confirm: '' });
      notify('Password changed successfully!');
    } catch (err) {
      notify(err.response?.data?.error || 'Password change failed', 'error');
    } finally { setSaving(false); }
  };

  const pwStrength = (pw) => {
    if (!pw) return null;
    if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) return { label: 'Strong', color: '#10b981', width: '100%' };
    if (pw.length >= 8) return { label: 'Good', color: '#f59e0b', width: '66%' };
    return { label: 'Weak', color: '#ef4444', width: '33%' };
  };

  const strength = pwStrength(pwForm.newPw);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPwForm.password !== newPwForm.confirm) return notify('Passwords do not match', 'error');
    if (newPwForm.password.length < 6) return notify('Password must be at least 6 characters', 'error');
    setSetPwSaving(true);
    try {
      await API.post('/auth/set-password', { password: newPwForm.password });
      login({ ...user, auth_provider: 'both' }, token);
      setNewPwForm({ password: '', confirm: '' });
      notify('Password set! You can now log in with email or Google.');
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to set password', 'error');
    } finally { setSetPwSaving(false); }
  };

  const TABS = [
    { id: 'profile', label: '👤 Personal Info' },
    { id: 'password', label: '🔐 Security' },
    { id: 'activity', label: '📋 Activity' },
  ];

  return (
    <div style={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Profile Header Card */}
      <div style={s.headerCard}>
        <div style={s.avatarWrap}>
          <div style={s.avatarBg}>
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={s.avatarImg} />
              : <div style={s.avatarInitials}>{initials}</div>}
          </div>
          <button onClick={() => fileRef.current.click()} style={s.avatarEditBtn} title="Change photo" disabled={avatarUploading}>
            <span style={{ fontSize: '0.75rem' }}>{avatarUploading ? '⏳' : '📷'}</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 1.5 * 1024 * 1024) return notify('Image must be under 1.5MB', 'error');
            setAvatarUploading(true);
            const reader = new FileReader();
            reader.onload = async (ev) => {
              try {
                const res = await API.post('/auth/avatar', { avatar: ev.target.result });
                login({ ...user, avatar: res.data.avatar }, token);
                notify('Profile photo updated!');
              } catch (err) { notify(err.response?.data?.error || 'Upload failed', 'error'); }
              finally { setAvatarUploading(false); }
            };
            reader.readAsDataURL(file);
          }} />
        </div>
        <div style={s.headerInfo}>
          <div style={s.headerName}>{user?.name}</div>
          <div style={s.headerEmail}>{user?.email}</div>
          <div style={s.headerMeta}>
            {user?.phone && <span style={s.metaChip}>📞 {user.phone}</span>}
            {user?.city && <span style={s.metaChip}>📍 {user.city}{user?.country ? `, ${user.country}` : ''}</span>}
            <span style={{ ...s.roleBadge, background: user?.role === 'admin' ? '#8b5cf6' : '#10b981' }}>{user?.role}</span>
          </div>
        </div>
        <div style={s.headerStats}>
          <div style={s.hStat}><div style={s.hStatNum}>{activity.length}</div><div style={s.hStatLbl}>Orders</div></div>
          <div style={s.hStatDiv} />
          <div style={s.hStat}><div style={s.hStatNum}>{user?.country || '—'}</div><div style={s.hStatLbl}>Country</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {tab === 'profile' && (
        <form onSubmit={handleProfileSave} style={s.card}>
          <div style={s.sectionTitle}>Personal Information</div>
          <div className="dash-grid2">
            <div style={s.field}>
              <label style={s.label}>Full Name <span style={s.req}>*</span></label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={s.input} placeholder="John Doe" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email Address <span style={s.req}>*</span></label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={s.input} type="email" placeholder="you@example.com" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone Number</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={s.input} type="tel" placeholder="+250 7XX XXX XXX" />
            </div>
            <div style={s.field}>
              <label style={s.label}>City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={s.input} placeholder="Kigali" />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Street Address</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={s.input} placeholder="KK 508 St, Kimihurura" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Country</label>
            <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={s.input}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>Account Role</label>
            <input value={user?.role} style={{ ...s.input, background: '#f8f9fb', color: '#888', cursor: 'not-allowed' }} disabled />
          </div>
          <button type="submit" disabled={saving} style={s.saveBtn}>
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </form>
      )}

      {/* Security Tab */}
      {tab === 'password' && (
        <div style={s.card}>
          {/* Linked Accounts */}
          <div style={s.sectionTitle}>Linked Accounts</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8f9fb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a1a2e' }}>Google</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>{user?.auth_provider === 'google' || user?.auth_provider === 'both' ? '✅ Connected' : 'Not connected'}</div>
            </div>
            {(user?.auth_provider === 'local' || !user?.auth_provider) && (
              <a href={`${import.meta.env.VITE_API_URL}/auth/google`} style={{ padding: '6px 14px', background: '#1a1a2e', color: '#fff', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>Link Google</a>
            )}
          </div>

          {/* Set password for Google-only users */}
          {(user?.auth_provider === 'google') && (
            <>
              <div style={{ ...s.sectionTitle, marginTop: 8 }}>Set a Password</div>
              <div style={s.securityNote}>You signed up with Google. Set a password to also log in with email + password.</div>
              <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={s.field}>
                  <label style={s.label}>New Password</label>
                  <input type="password" value={newPwForm.password} onChange={e => setNewPwForm({ ...newPwForm, password: e.target.value })} style={s.input} placeholder="Min. 6 characters" required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Confirm Password</label>
                  <input type="password" value={newPwForm.confirm} onChange={e => setNewPwForm({ ...newPwForm, confirm: e.target.value })} style={s.input} placeholder="Repeat password" required />
                </div>
                <button type="submit" disabled={setPwSaving} style={s.saveBtn}>{setPwSaving ? 'Saving…' : '🔐 Set Password'}</button>
              </form>
            </>
          )}

          {/* Change password for local or both users */}
          {(user?.auth_provider === 'local' || user?.auth_provider === 'both' || !user?.auth_provider) && (
            <>
              <div style={{ ...s.sectionTitle, marginTop: 8 }}>Change Password</div>
              <div style={s.securityNote}>🔒 Use a strong password with uppercase, numbers and special characters. Minimum 8 characters.</div>
              <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'current', label: 'Current Password', placeholder: 'Enter your current password' },
                  { key: 'newPw', label: 'New Password', placeholder: 'Min. 8 characters' },
                  { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={s.field}>
                    <label style={s.label}>{label} <span style={s.req}>*</span></label>
                    <div style={s.pwWrap}>
                      <input value={pwForm[key]} onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} style={{ ...s.input, paddingRight: 42 }} type={showPw[key] ? 'text' : 'password'} placeholder={placeholder} required />
                      <button type="button" style={s.pwToggle} onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}>{showPw[key] ? '🙈' : '👁'}</button>
                    </div>
                    {key === 'newPw' && strength && (<div style={s.strengthWrap}><div style={{ ...s.strengthBar, width: strength.width, background: strength.color }} /><span style={{ ...s.strengthLabel, color: strength.color }}>{strength.label}</span></div>)}
                    {key === 'confirm' && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (<span style={s.mismatch}>Passwords do not match</span>)}
                  </div>
                ))}
                <button type="submit" disabled={saving} style={s.saveBtn}>{saving ? '⏳ Updating...' : '🔐 Update Password'}</button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <div style={s.card}>
          <div style={s.sectionTitle}>Recent Orders</div>
          {activity.length === 0
            ? <div style={s.empty}>No orders yet. Start shopping!</div>
            : activity.map(o => (
              <div key={o.id} style={s.actRow}>
                <div style={s.actLeft}>
                  <div style={s.actId}>Order #{o.id}</div>
                  <div style={s.actDate}>{new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ ...s.statusBadge, background: STATUS_COLOR[o.status] + '18', color: STATUS_COLOR[o.status] }}>{o.status}</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

const s = {
  page: { padding: '24px', maxWidth: '720px' },
  headerCard: { background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarBg: { width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #e94560' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarInitials: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#e94560,#1a1a2e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: '800' },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: 0, background: '#fff', border: '2px solid #e5e7eb', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: '1.2rem', fontWeight: '800', color: '#1a1a2e', marginBottom: '2px' },
  headerEmail: { fontSize: '0.85rem', color: '#888', marginBottom: '8px' },
  headerMeta: { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' },
  metaChip: { background: '#f1f5f9', color: '#555', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '500' },
  roleBadge: { color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'capitalize' },
  headerStats: { display: 'flex', alignItems: 'center', gap: '16px', background: '#f8f9fb', borderRadius: '12px', padding: '14px 20px' },
  hStat: { textAlign: 'center' },
  hStatNum: { fontWeight: '800', fontSize: '1.1rem', color: '#1a1a2e' },
  hStatLbl: { fontSize: '0.7rem', color: '#aaa', marginTop: '2px' },
  hStatDiv: { width: '1px', height: '32px', background: '#e5e7eb' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { padding: '9px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: '#555', fontWeight: '500' },
  tabActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e', fontWeight: '700' },
  card: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  grid2: {},
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', fontWeight: '600', color: '#555' },
  req: { color: '#e94560' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.92rem', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border 0.2s' },
  saveBtn: { padding: '12px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700', marginTop: '4px' },
  securityNote: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', fontSize: '0.82rem', color: '#166534' },
  pwWrap: { position: 'relative' },
  pwToggle: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' },
  strengthWrap: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
  strengthBar: { height: '4px', borderRadius: '4px', transition: 'width 0.3s, background 0.3s', background: '#e5e7eb', flexShrink: 0 },
  strengthLabel: { fontSize: '0.75rem', fontWeight: '600' },
  mismatch: { fontSize: '0.75rem', color: '#ef4444', marginTop: '2px' },
  actRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' },
  actLeft: {},
  actId: { fontWeight: '700', color: '#1a1a2e', fontSize: '0.88rem' },
  actDate: { fontSize: '0.75rem', color: '#aaa', marginTop: '2px' },
  statusBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#aaa', padding: '24px', fontSize: '0.88rem' },
};
