import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import ImageUpload from '../../components/ImageUpload';
import API from '../../api';

const TABS = ['Profile', 'Security'];

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('Profile');
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  // Profile form
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', country: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [pw, setPw] = useState({ current: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '', city: user.city || '', country: user.country || '' });
  }, [user]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const r = await API.put('/auth/profile', form);
      setUser(r.data.user);
      notify('Profile updated');
    } catch { notify('Failed to update profile', 'error'); }
    finally { setProfileSaving(false); }
  };

  const saveAvatar = async (url) => {
    try {
      await API.post('/auth/avatar', { avatar: url });
      setUser(p => ({ ...p, avatar: url }));
      notify('Avatar updated');
    } catch { notify('Failed to update avatar', 'error'); }
  };

  const changePassword = async () => {
    if (!pw.current || !pw.newPassword) return notify('All fields required', 'error');
    if (pw.newPassword.length < 6) return notify('Min 6 characters', 'error');
    if (pw.newPassword !== pw.confirm) return notify('Passwords do not match', 'error');
    setPwSaving(true);
    try {
      await API.put('/auth/password', { current: pw.current, newPassword: pw.newPassword });
      notify('Password changed successfully');
      setPw({ current: '', newPassword: '', confirm: '' });
    } catch (e) { notify(e.response?.data?.error || 'Failed to change password', 'error'); }
    finally { setPwSaving(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={s.pageHd}>
        <div>
          <h2 style={s.title}>My Profile</h2>
          <p style={s.sub}>Manage your admin account information and security</p>
        </div>
      </div>

      {/* Profile card */}
      <div style={s.profileCard}>
        <div style={s.avatarSection}>
          {user?.avatar
            ? <img src={user.avatar} style={s.avatar} alt="avatar" />
            : <div style={s.avatarFallback}>{initials}</div>
          }
          <div>
            <div style={s.profileName}>{user?.name}</div>
            <div style={s.profileEmail}>{user?.email}</div>
            <span style={s.adminBadge}>🔐 Admin</span>
          </div>
        </div>
        <div style={s.metaRow}>
          {[
            ['Joined', user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
            ['Auth', user?.auth_provider || 'local'],
            ['Status', 'Active'],
          ].map(([k, v]) => (
            <div key={k} style={s.metaItem}>
              <div style={s.metaKey}>{k}</div>
              <div style={s.metaVal}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}>{t}</button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'Profile' && (
        <div style={s.card}>
          <div style={s.cardTitle}>Profile Information</div>

          <ImageUpload
            label="Profile Photo"
            currentUrl={user?.avatar || ''}
            onUpload={saveAvatar}
            size="sm"
          />

          <div style={s.grid2}>
            {[['Full Name','name','text'],['Email','email','email'],['Phone','phone','tel'],['City','city','text'],['Country','country','text']].map(([label, key, type]) => (
              <div key={key} style={s.field}>
                <label style={s.fieldLabel}>{label}</label>
                <input type={type} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={s.input} />
              </div>
            ))}
            <div style={s.field}>
              <label style={s.fieldLabel}>Address</label>
              <input value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={s.input} />
            </div>
          </div>

          <button onClick={saveProfile} disabled={profileSaving} style={s.btnSave}>
            {profileSaving ? 'Saving…' : '✓ Save Profile'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'Security' && (
        <div style={s.card}>
          <div style={s.cardTitle}>Change Password</div>
          {user?.auth_provider === 'google' ? (
            <div style={s.infoBox}>You signed in with Google. Use the <strong>Set Password</strong> option in your dashboard to add a password.</div>
          ) : (
            <>
              <div style={s.grid1}>
                {[['Current Password','current','password'],['New Password','newPassword','password'],['Confirm New Password','confirm','password']].map(([label, key, type]) => (
                  <div key={key} style={s.field}>
                    <label style={s.fieldLabel}>{label}</label>
                    <input type={type} value={pw[key]} onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))} style={s.input} placeholder={key === 'newPassword' ? 'Min 6 characters' : ''} />
                  </div>
                ))}
              </div>
              <button onClick={changePassword} disabled={pwSaving} style={s.btnSave}>
                {pwSaving ? 'Saving…' : '🔑 Change Password'}
              </button>
            </>
          )}

          <div style={{ ...s.cardTitle, marginTop: 24 }}>Login Method</div>
          <div style={s.infoBox}>
            Auth provider: <strong>{user?.auth_provider || 'local'}</strong>
            {user?.auth_provider === 'both' && ' — You can log in with email/password or Google.'}
            {user?.auth_provider === 'local' && ' — Email and password only.'}
            {user?.auth_provider === 'google' && ' — Google only. Set a password to enable both methods.'}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { padding: '16px', maxWidth: 700 },
  pageHd: { marginBottom: 20 },
  title: { fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  sub: { fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 },

  profileCard: { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  avatarSection: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  avatar: { width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  avatarFallback: { width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0 },
  profileName: { fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' },
  profileEmail: { fontSize: '0.85rem', color: '#64748b', marginTop: 2 },
  adminBadge: { display: 'inline-block', marginTop: 6, background: '#fef3c7', color: '#d97706', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 },
  metaRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  metaItem: { background: '#f8fafc', borderRadius: 8, padding: '10px 16px', minWidth: 100 },
  metaKey: { fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' },
  metaVal: { fontSize: '0.88rem', fontWeight: 600, color: '#1a1a2e', marginTop: 2 },

  tabs: { display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', width: 'fit-content' },
  tabBtn: { padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: 'none', color: '#64748b' },
  tabActive: { background: '#1a1a2e', color: '#fff' },

  card: { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 },
  cardTitle: { fontSize: '0.85rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' },

  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  grid1: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#374151' },
  input: { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box', width: '100%' },

  btnSave: { padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', alignSelf: 'flex-start' },
  infoBox: { background: '#eff6ff', borderRadius: 8, padding: '12px 14px', fontSize: '0.85rem', color: '#2563eb', borderLeft: '3px solid #3b82f6' },
};
