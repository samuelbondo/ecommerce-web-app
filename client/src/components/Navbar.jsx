import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import API from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const accent = settings.accent_color || '#e94560';
  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const close = () => setMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  // Load all products once for instant client-side suggestions
  useEffect(() => {
    API.get('/products').then(r => setAllProducts(r.data)).catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setShowDrop(false); setQuery(''); }, [location.pathname]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setSuggestions([]); setShowDrop(false); return; }
    const q = val.toLowerCase();
    const matches = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    ).slice(0, 6);
    setSuggestions(matches);
    setShowDrop(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDrop(false);
    navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (product) => {
    setShowDrop(false);
    setQuery('');
    navigate(`/products/${product.id}`);
  };

  const { formatPrice } = useSettings();

  return (
    <>
      <style>{`
        .ss-nav { position: sticky; top: 0; z-index: 1000; background: #1a1a2e; box-shadow: 0 2px 12px rgba(0,0,0,0.18); }
        .ss-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .ss-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .ss-logo { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
        .ss-logo-placeholder { width: 36px; height: 36px; border-radius: 8px; background: ${accent}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 1.1rem; }
        .ss-site-name { color: ${accent}; font-weight: 800; font-size: 1.25rem; letter-spacing: -0.3px; }

        /* Search */
        .ss-search-wrap { flex: 1; max-width: 480px; position: relative; }
        .ss-search-form { display: flex; align-items: center; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; overflow: visible; transition: all 0.2s; }
        .ss-search-form:focus-within { background: #fff; border-color: #fff; box-shadow: 0 0 0 3px rgba(233,69,96,0.2); }
        .ss-search-input { flex: 1; background: transparent; border: none; outline: none; padding: 9px 12px; font-size: 0.9rem; color: #fff; min-width: 0; }
        .ss-search-form:focus-within .ss-search-input { color: #1a1a2e; }
        .ss-search-input::placeholder { color: rgba(255,255,255,0.45); }
        .ss-search-form:focus-within .ss-search-input::placeholder { color: #94a3b8; }
        .ss-search-btn { background: ${accent}; border: none; padding: 7px 14px; cursor: pointer; color: #fff; display: flex; align-items: center; border-radius: 0 8px 8px 0; transition: opacity 0.15s; flex-shrink: 0; }
        .ss-search-btn:hover { opacity: 0.85; }

        /* Dropdown */
        .ss-drop { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); overflow: hidden; z-index: 2000; border: 1px solid #e5e7eb; }
        .ss-drop-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; transition: background 0.12s; text-decoration: none; color: inherit; }
        .ss-drop-item:hover { background: #f8f9fb; }
        .ss-drop-img { width: 40px; height: 40px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #f1f5f9; }
        .ss-drop-name { font-size: 0.88rem; font-weight: 600; color: #1a1a2e; line-height: 1.3; }
        .ss-drop-cat { font-size: 0.72rem; color: #94a3b8; margin-top: 1px; }
        .ss-drop-price { font-size: 0.85rem; font-weight: 800; color: ${accent}; margin-left: auto; white-space: nowrap; flex-shrink: 0; }
        .ss-drop-footer { padding: 10px 14px; background: #f8f9fb; border-top: 1px solid #f1f5f9; font-size: 0.82rem; color: ${accent}; font-weight: 600; cursor: pointer; text-align: center; }
        .ss-drop-footer:hover { background: #f1f5f9; }
        .ss-drop-empty { padding: 20px 14px; text-align: center; color: #94a3b8; font-size: 0.85rem; }

        /* Nav links */
        .ss-links { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-shrink: 0; }
        .ss-link { color: #cbd5e1; text-decoration: none; font-size: 0.9rem; padding: 6px 12px; border-radius: 6px; transition: all 0.15s; white-space: nowrap; }
        .ss-link:hover, .ss-link.active { color: #fff; background: rgba(255,255,255,0.08); }
        .ss-cart-btn { position: relative; color: #cbd5e1; text-decoration: none; font-size: 1.3rem; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; transition: all 0.15s; }
        .ss-cart-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .ss-badge { position: absolute; top: 0; right: 0; background: ${accent}; color: #fff; border-radius: 50%; font-size: 0.6rem; font-weight: 800; min-width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; }
        .ss-btn-login { color: #fff; text-decoration: none; font-size: 0.88rem; padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25); transition: all 0.15s; white-space: nowrap; }
        .ss-btn-login:hover { background: rgba(255,255,255,0.1); }
        .ss-btn-register { color: #fff; text-decoration: none; font-size: 0.88rem; padding: 7px 16px; border-radius: 6px; background: ${accent}; transition: all 0.15s; white-space: nowrap; }
        .ss-btn-register:hover { opacity: 0.88; }
        .ss-btn-logout { background: transparent; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.88rem; transition: all 0.15s; white-space: nowrap; }
        .ss-btn-logout:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .ss-admin-btn { background: ${accent}; color: #fff; text-decoration: none; font-size: 0.8rem; font-weight: 700; padding: 5px 12px; border-radius: 6px; white-space: nowrap; }
        .ss-user-chip { color: #94a3b8; font-size: 0.82rem; padding: 0 4px; white-space: nowrap; }
        .ss-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; color: #fff; flex-shrink: 0; }
        .ss-mobile-menu { display: none; }

        @media (max-width: 900px) {
          .ss-links { display: none; }
          .ss-hamburger { display: flex; flex-direction: column; gap: 5px; }
          .ss-hamburger span { display: block; width: 24px; height: 2px; background: #fff; border-radius: 2px; }
          .ss-mobile-menu { display: block; background: #1a1a2e; border-top: 1px solid rgba(255,255,255,0.08); padding: 12px 20px 20px; }
          .ss-mobile-menu a, .ss-mobile-menu button { display: block; width: 100%; text-align: left; color: #cbd5e1; text-decoration: none; font-size: 0.95rem; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); background: none; border-left: none; border-right: none; border-top: none; cursor: pointer; }
          .ss-mobile-menu a:last-child, .ss-mobile-menu button:last-child { border-bottom: none; }
          .ss-mobile-menu a:hover, .ss-mobile-menu button:hover { color: #fff; }
          .ss-search-wrap { max-width: none; }
        }
        @media (max-width: 500px) {
          .ss-site-name { display: none; }
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

          {/* Search bar */}
          <div className="ss-search-wrap" ref={searchRef}>
            <form className="ss-search-form" onSubmit={handleSearch}>
              <input
                ref={inputRef}
                className="ss-search-input"
                placeholder="Search products, categories..."
                value={query}
                onChange={handleQueryChange}
                onFocus={() => query.trim() && setShowDrop(true)}
                autoComplete="off"
              />
              <button type="submit" className="ss-search-btn" aria-label="Search">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </form>

            {/* Suggestions dropdown */}
            {showDrop && (
              <div className="ss-drop">
                {suggestions.length === 0 ? (
                  <div className="ss-drop-empty">No products found for "{query}"</div>
                ) : (
                  <>
                    {suggestions.map(p => (
                      <div key={p.id} className="ss-drop-item" onClick={() => handleSuggestionClick(p)}>
                        <img className="ss-drop-img" src={p.image_url} alt={p.name}
                          onError={e => { e.target.src = 'https://placehold.co/40x40?text=?'; }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ss-drop-name">{highlight(p.name, query)}</div>
                          {p.category && <div className="ss-drop-cat">{p.category}</div>}
                        </div>
                        <div className="ss-drop-price">{formatPrice(p.price)}</div>
                      </div>
                    ))}
                    <div className="ss-drop-footer" onClick={handleSearch}>
                      See all results for "{query}" →
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

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
            <Link to="/cart" onClick={close}>🛒 Cart {cart.length > 0 && `(${cart.length})`}</Link>
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

// Highlight matching text in suggestion
function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: '#e94560' }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}
