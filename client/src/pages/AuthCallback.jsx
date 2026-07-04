import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function AuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Already logged in
    const existingToken = localStorage.getItem('token');
    const existingUser = localStorage.getItem('user');
    if (existingToken && existingUser) {
      const u = JSON.parse(existingUser);
      window.location.replace(window.location.origin + (u.role === 'admin' ? '/admin' : '/dashboard'));
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = decodeURIComponent(params.get('token') || '');
    const error = params.get('error');

    // Duplicate callback hit — already logged in from first hit
    if (token === 'already') {
      const existingToken = localStorage.getItem('token');
      const existingUser = localStorage.getItem('user');
      if (existingToken && existingUser) {
        const u = JSON.parse(existingUser);
        window.location.replace(window.location.origin + (u.role === 'admin' ? '/admin' : '/dashboard'));
      } else {
        navigate('/login');
      }
      return;
    }

    if (error || !token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Store token first, then fetch user
    API.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        console.log('User fetched:', res.data);
        const user = res.data;
        login(user, token);
        window.location.replace(window.location.origin + (user.role === 'admin' ? '/admin' : '/dashboard'));
      })
      .catch((err) => {
        console.error('AUTH ERROR:', err?.response?.status, err?.response?.data, err?.message);
        localStorage.removeItem('token');
        navigate('/login?error=oauth_failed');
      });
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #e94560', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
