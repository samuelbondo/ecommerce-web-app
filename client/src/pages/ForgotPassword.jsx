import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useSettings } from '../context/SettingsContext';

export default function ForgotPassword() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const accent = settings.accent_color || '#e94560';

  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email, code });
      setResetToken(res.data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { resetToken, password });
      setSuccess('Password reset! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
    } finally { setLoading(false); }
  };

  const stepLabel = ['Enter your email', 'Enter the OTP code', 'Set new password'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>{(settings.site_name || 'S')[0]}</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' }}>{settings.site_name || 'Samuel Store'}</span>
        </Link>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ flex: 1, height: 4, borderRadius: 4, background: n <= step ? accent : '#e5e7eb', transition: 'background 0.3s' }} />
          ))}
        </div>

        <h2 style={{ margin: '0 0 4px', fontWeight: 800, color: '#1a1a2e', fontSize: '1.5rem' }}>Forgot Password</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24 }}>Step {step} of 3 — {stepLabel[step - 1]}</p>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>⚠️ {error}</div>}
        {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>✅ {success}</div>}

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }} />
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 12, background: accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending…' : 'Send OTP Code →'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <p style={{ color: '#555', fontSize: '0.88rem', marginBottom: 16 }}>We sent a 6-digit code to <strong>{email}</strong>. Check your inbox (and spam folder).</p>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>6-digit code</label>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="123456" maxLength={6}
              style={{ width: '100%', padding: '14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '1.6rem', fontWeight: 800, letterSpacing: 12, textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }} />
            <button type="submit" disabled={loading || code.length !== 6}
              style={{ width: '100%', padding: 12, background: accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: (loading || code.length !== 6) ? 0.7 : 1 }}>
              {loading ? 'Verifying…' : 'Verify Code →'}
            </button>
            <button type="button" onClick={() => { setStep(1); setCode(''); setError(''); }}
              style={{ width: '100%', marginTop: 10, padding: 10, background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', color: '#64748b', fontSize: '0.88rem' }}>
              ← Change email
            </button>
          </form>
        )}

        {/* Step 3 — New password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }} />
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 12, background: accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Resetting…' : 'Reset Password ✓'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem', color: '#64748b' }}>
          Remember it? <Link to="/login" style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
