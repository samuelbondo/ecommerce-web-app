import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error || !token || !userRaw) {
      navigate('/login?error=oauth_failed');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      login(user, token);
      setTimeout(() => {
        navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      }, 100);
    } catch {
      navigate('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #e94560', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
