import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const accent = settings.accent_color || '#e94560';
  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const close = () => setMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        .ss-nav { position: sticky; top: 0; z-index: 1000; background: #1a1a2e; box-shadow: 0 2px 12px rgba(0,0,0,0.18); }
        .ss-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .ss-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .ss-logo { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
        .ss-logo-placeholder { width: 36px; height: 36px; border-radius: 8px; background: ${accent}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 1.1rem; }
        .ss-site-name { color: ${accent}; font-weight: 800; font-size: 1.25rem; letter-spacing: -0.3px; }
        .ss-links { display: flex; align-items: center; gap: 4px; }
        .ss-link { color: #cbd5e1; text-decoration: none; font-size: 0.9rem; padding: 6px 12px; border-radius: 6px; transition: all 0.15s; white-space: nowrap; }
        .ss-link:hover, .ss-link.active { color: #fff; background: rgba(255,255,255,0.08); }
        .ss-cart-btn { position: relative; color: #cbd5e1; text-decoration: none; font-size: 1.3rem; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; transition: all 0.15s; }
        .ss-cart-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .ss-badge { position: absolute; top: 0; right: 0; background: ${accent}; color: #fff; border-radius: 50%; font-size: 0.6rem; font-weight: 800; min-width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; }
        .ss-btn-login { color: #fff; text-decoration: none; font-size: 0.88rem; padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25); transition: all 0.15s; }
        .ss-btn-login:hover { background: rgba(255,255,255,0.1); }
        .ss-btn-register { color: #fff; text-decoration: none; font-size: 0.88rem; padding: 7px 16px; border-radius: 6px; background: ${accent}; transition: all 0.15s; }
        .ss-btn-register:hover { opacity: 0.88; }
        .ss-btn-logout { background: transparent; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.88rem; transition: all 0.15s; }
        .ss-btn-logout:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .ss-admin-btn { background: ${accent}; color: #fff; text-decoration: none; font-size: 0.8rem; font-weight: 700; padding: 5px 12px; border-radius: 6px; }
        .ss-user-chip { color: #94a3b8; font-size: 0.82rem; padding: 0 4px; }
        .ss-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; color: #fff; }
        .ss-mobile-menu { display: none; }
        @media (max-width: 768px) {
          .ss-links { display: none; }
          .ss-hamburger { display: flex; flex-direction: column; gap: 5px; }
          .ss-hamburger span { display: block; width: 24px; height: 2px; background: #fff; border-radius: 2px; transition: all 0.2s; }
          .ss-mobile-menu { display: block; background: #1a1a2e; border-top: 1px solid rgba(255,255,255,0.08); padding: 12px 20px 20px; }
          .ss-mobile-menu a, .ss-mobile-menu button { display: block; width: 100%; text-align: left; color: #cbd5e1; text-decoration: none; font-size: 0.95rem; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); background: none; border-left: none; border-right: none; border-top: none; cursor: pointer; }
          .ss-mobile-menu a:last-child, .ss-mobile-menu button:last-child { border-bottom: none; }
          .ss-mobile-menu a:hover, .ss-mobile-menu button:hover { color: #fff; }
          .ss-mobile-cart { display: flex; align-items: center; gap: 8px; }
        }
      `}</style>

      <nav className="ss-nav">
        <div className="ss-nav-inner">
          {/* Brand */}
          <Link to="/" className="ss-brand" onClick={close}>
            {settings.site_logo
              ? <img src={settings.site_logo} alt="logo" className="ss-logo" />
              : <div className="ss-logo-placeholder">{(settings.site_name || 'S')[0]}</div>
            }
            <span className="ss-site-name">{settings.site_name || 'Samuel Store'}</span>
          </Link>

          {/* Desktop links */}
          <div className="ss-links">
            <Link to="/" className={`ss-link${isActive('/') ? ' active' : ''}`}>Home</Link>
            <Link to="/products" className={`ss-link${isActive('/products') ? ' active' : ''}`}>Products</Link>
            {user && <Link to="/orders" className={`ss-link${isActive('/orders') ? ' active' : ''}`}>Orders</Link>}
            <Link to="/cart" className="ss-cart-btn">
              🛒 {cart.length > 0 && <span className="ss-badge">{cart.length}</span>}
            </Link>
            {user ? (
              <>
                <span className="ss-user-chip">Hi, {user.name.split(' ')[0]}</span>
                <Link to="/dashboard" className="ss-link">Dashboard</Link>
                {user.role === 'admin' && <Link to="/admin" className="ss-admin-btn">⚡ Admin</Link>}
                <button onClick={handleLogout} className="ss-btn-logout">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="ss-btn-login">Login</Link>
                <Link to="/register" className="ss-btn-register">Register</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button className="ss-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="ss-mobile-menu">
            <Link to="/" onClick={close}>🏠 Home</Link>
            <Link to="/products" onClick={close}>🛍 Products</Link>
            <Link to="/cart" onClick={close} className="ss-mobile-cart">
              🛒 Cart {cart.length > 0 && `(${cart.length})`}
            </Link>
            {user ? (
              <>
                <Link to="/orders" onClick={close}>📦 My Orders</Link>
                <Link to="/dashboard" onClick={close}>👤 Dashboard</Link>
                {user.role === 'admin' && <Link to="/admin" onClick={close}>⚡ Admin Panel</Link>}
                <button onClick={handleLogout}>↩ Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close}>🔑 Login</Link>
                <Link to="/register" onClick={close}>✨ Register</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
