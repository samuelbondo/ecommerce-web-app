import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const accent = settings.accent_color || '#e94560';

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const e = p.get('error');
    if (e === 'facebook_failed' || e === 'oauth_failed') setError('Facebook login failed. Please try again.');
    else if (e === 'facebook_expired') setError('Facebook login expired. Please try again.');
    else if (e === 'google_failed') setError('Google login failed. Please try again.');
  }, []);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user]);

  // Listen for OAuth popup message
  useEffect(() => {
    const handler = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'oauth_success') {
        login(e.data.user, e.data.token);
        navigate(e.data.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleFacebookLogin = async (e) => {
    e.preventDefault();
    try { await fetch(`${import.meta.env.VITE_API_URL}/settings`); } catch {}
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        .ss-auth-left { flex: 1; background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%); display: flex; flex-direction: column; justify-content: center; padding: 60px 48px; color: #fff; position: relative; overflow: hidden; }
        .ss-auth-left::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 70%, rgba(233,69,96,0.2) 0%, transparent 60%); }
        .ss-auth-left-content { position: relative; }
        .ss-auth-left h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 12px; line-height: 1.2; }
        .ss-auth-left h2 span { color: ${accent}; }
        .ss-auth-left p { color: #94a3b8; font-size: 1rem; line-height: 1.7; margin-bottom: 32px; }
        .ss-auth-feature { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .ss-auth-feature-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(233,69,96,0.15); border: 1px solid rgba(233,69,96,0.3); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
        .ss-auth-feature-text { font-size: 0.9rem; color: #cbd5e1; }
        .ss-auth-right { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 48px; background: #fff; }
        .ss-auth-form-box { width: 100%; max-width: 400px; }
        .ss-auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; text-decoration: none; }
        .ss-auth-logo-box { width: 38px; height: 38px; border-radius: 10px; background: ${accent}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 1.1rem; }
        .ss-auth-logo-name { font-size: 1.2rem; font-weight: 800; color: #1a1a2e; }
        .ss-auth-form-box h1 { font-size: 1.7rem; font-weight: 800; color: #1a1a2e; margin-bottom: 6px; }
        .ss-auth-form-box .ss-sub { color: #64748b; font-size: 0.9rem; margin-bottom: 28px; }
        .ss-field { margin-bottom: 16px; }
        .ss-field label { display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .ss-field input { width: 100%; padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.15s; background: #fafafa; color: #1a1a2e; box-sizing: border-box; }
        .ss-field input:focus { border-color: ${accent}; background: #fff; box-shadow: 0 0 0 3px rgba(233,69,96,0.08); }
        .ss-pwd-wrap { position: relative; }
        .ss-pwd-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 0.85rem; padding: 4px; }
        .ss-auth-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 16px; }
        .ss-auth-submit { width: 100%; padding: 12px; background: ${accent}; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-bottom: 20px; }
        .ss-auth-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .ss-auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .ss-auth-divider { text-align: center; color: #94a3b8; font-size: 0.85rem; margin-bottom: 20px; position: relative; }
        .ss-auth-divider::before { content: ''; position: absolute; left: 0; top: 50%; width: 42%; height: 1px; background: #e5e7eb; }
        .ss-auth-divider::after { content: ''; position: absolute; right: 0; top: 50%; width: 42%; height: 1px; background: #e5e7eb; }
        .ss-auth-switch { text-align: center; font-size: 0.9rem; color: #64748b; }
        .ss-auth-switch a { color: ${accent}; font-weight: 600; text-decoration: none; }
        .ss-auth-switch a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .ss-auth-left { display: none; }
          .ss-auth-right { padding: 40px 24px; background: #f8f9fb; min-height: 100vh; }
          .ss-auth-form-box { background: #fff; padding: 32px 24px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        }
      `}</style>

      {/* Left panel */}
      <div className="ss-auth-left">
        <div className="ss-auth-left-content">
          <h2>Welcome back to<br /><span>{settings.site_name || 'Samuel Store'}</span></h2>
          <p>Sign in to access your orders, wishlist, and exclusive member deals.</p>
          {[
            ['🛍', 'Browse thousands of products'],
            ['📦', 'Track your orders in real-time'],
            ['💳', 'Secure and fast checkout'],
            ['🎁', 'Exclusive member discounts'],
          ].map(([icon, text]) => (
            <div className="ss-auth-feature" key={text}>
              <div className="ss-auth-feature-icon">{icon}</div>
              <div className="ss-auth-feature-text">{text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="ss-auth-right">
        <div className="ss-auth-form-box">
          <Link to="/" className="ss-auth-logo">
            <div className="ss-auth-logo-box">{(settings.site_name || 'S')[0]}</div>
            <span className="ss-auth-logo-name">{settings.site_name || 'Samuel Store'}</span>
          </Link>
          <h1>Sign in</h1>
          <p className="ss-sub">Enter your credentials to continue</p>

          {error && <div className="ss-auth-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="ss-field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div className="ss-field">
              <label>Password</label>
              <div className="ss-pwd-wrap">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="ss-pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="ss-auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="ss-auth-divider">or</div>
          <a href={`${import.meta.env.VITE_API_URL}/auth/google`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#374151', textDecoration: 'none', marginBottom: 12, boxSizing: 'border-box' }}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </a>
          <a href="#" onClick={handleFacebookLogin}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 14px', border: '1.5px solid #1877f2', borderRadius: 8, background: '#1877f2', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#fff', textDecoration: 'none', marginBottom: 20, boxSizing: 'border-box' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
            Continue with Facebook
          </a>
          <p className="ss-auth-switch">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 10, fontSize: '0.85rem' }}>
            <Link to="/forgot-password" style={{ color: accent, textDecoration: 'none', fontWeight: 500 }}>Forgot your password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh' },
};
