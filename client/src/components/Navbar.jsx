import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import API from '../api';

// ── Defined OUTSIDE Navbar so it never gets recreated on parent re-render ──
function SearchBar({ refProp, query, onChange, onSubmit, onSuggestionClick, suggestions, showDrop, formatPrice, accent }) {
  return (
    <div ref={refProp} style={{ position: 'relative' }}>
      <form onSubmit={onSubmit} className="ss-search-form">
        <input
          className="ss-search-input"
          placeholder="Search products, categories..."
          value={query}
          onChange={onChange}
          onFocus={() => {}}
          autoComplete="off"
        />
        <button type="submit" className="ss-search-btn" aria-label="Search">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </form>
      {showDrop && suggestions !== null && (
        <div className="ss-drop">
          {suggestions.length === 0 ? (
            <div className="ss-drop-empty">No results for "{query}"</div>
          ) : (
            <>
              {suggestions.map(p => (
                <div key={p.id} className="ss-drop-item" onMouseDown={() => onSuggestionClick(p)}>
                  <img className="ss-drop-img" src={p.image_url} alt={p.name}
                    onError={e => { e.target.src = 'https://placehold.co/40x40?text=?'; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ss-drop-name">{highlight(p.name, query)}</div>
                    {p.category && <div className="ss-drop-cat">{p.category}</div>}
                  </div>
                  <div className="ss-drop-price">{formatPrice(p.price)}</div>
                </div>
              ))}
              <div className="ss-drop-footer" onMouseDown={onSubmit}>
                See all results for "{query}" →
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { settings, formatPrice } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [showDrop, setShowDrop] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const accent = settings.accent_color || '#e94560';
  const isActive = (path) => location.pathname === path;
  const close = () => setMenuOpen(false);
  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  useEffect(() => {
    API.get('/products').then(r => setAllProducts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const inDesktop = searchRef.current?.contains(e.target);
      const inMobile = mobileSearchRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setShowDrop(false);
    setQuery('');
    setMenuOpen(false);
  }, [location.pathname]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setSuggestions(null); setShowDrop(false); return; }
    const q = val.toLowerCase();
    const matches = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    ).slice(0, 6);
    setSuggestions(matches);
    setShowDrop(true);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setShowDrop(false);
    navigate(`/products?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (product) => {
    setShowDrop(false);
    setQuery('');
    navigate(`/products/${product.id}`);
  };

  const searchProps = { query, onChange: handleChange, onSubmit: handleSubmit, onSuggestionClick: handleSuggestionClick, suggestions, showDrop, formatPrice, accent };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ss-nav { position: sticky; top: 0; z-index: 1000; background: #1a1a2e; box-shadow: 0 2px 12px rgba(0,0,0,0.18); }
        .ss-top { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .ss-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .ss-logo { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
        .ss-logo-box { width: 36px; height: 36px; border-radius: 8px; background: ${accent}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 1.1rem; flex-shrink: 0; }
        .ss-site-name { color: ${accent}; font-weight: 800; font-size: 1.2rem; letter-spacing: -0.3px; white-space: nowrap; }
        .ss-search-desktop { flex: 1; max-width: 500px; }
        .ss-search-form { display: flex; align-items: center; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.15); border-radius: 10px; transition: all 0.2s; }
        .ss-search-form:focus-within { background: #fff !important; border-color: #fff !important; box-shadow: 0 0 0 3px rgba(233,69,96,0.2); }
        .ss-search-input { flex: 1; background: transparent; border: none; outline: none; padding: 9px 14px; font-size: 0.9rem; color: #fff; min-width: 0; width: 0; }
        .ss-search-form:focus-within .ss-search-input { color: #1a1a2e; }
        .ss-search-input::placeholder { color: rgba(255,255,255,0.45); }
        .ss-search-form:focus-within .ss-search-input::placeholder { color: #94a3b8; }
        .ss-search-btn { background: ${accent}; border: none; padding: 8px 16px; cursor: pointer; color: #fff; display: flex; align-items: center; border-radius: 0 8px 8px 0; transition: opacity 0.15s; flex-shrink: 0; }
        .ss-search-btn:hover { opacity: 0.85; }
        .ss-drop { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); overflow: hidden; z-index: 9999; border: 1px solid #e5e7eb; }
        .ss-drop-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; transition: background 0.12s; }
        .ss-drop-item:hover { background: #f8f9fb; }
        .ss-drop-img { width: 40px; height: 40px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #f1f5f9; }
        .ss-drop-name { font-size: 0.88rem; font-weight: 600; color: #1a1a2e; line-height: 1.3; }
        .ss-drop-cat { font-size: 0.72rem; color: #94a3b8; margin-top: 2px; }
        .ss-drop-price { font-size: 0.85rem; font-weight: 800; color: ${accent}; margin-left: auto; white-space: nowrap; padding-left: 8px; flex-shrink: 0; }
        .ss-drop-footer { padding: 10px 14px; background: #f8f9fb; border-top: 1px solid #f1f5f9; font-size: 0.82rem; color: ${accent}; font-weight: 600; cursor: pointer; text-align: center; }
        .ss-drop-footer:hover { background: #f1f5f9; }
        .ss-drop-empty { padding: 20px 14px; text-align: center; color: #94a3b8; font-size: 0.85rem; }
        .ss-links { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-shrink: 0; }
        .ss-link { color: #cbd5e1; text-decoration: none; font-size: 0.88rem; padding: 6px 11px; border-radius: 6px; transition: all 0.15s; white-space: nowrap; }
        .ss-link:hover, .ss-link.active { color: #fff; background: rgba(255,255,255,0.08); }
        .ss-cart-btn { position: relative; color: #cbd5e1; text-decoration: none; font-size: 1.3rem; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; transition: all 0.15s; }
        .ss-cart-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .ss-badge { position: absolute; top: 0; right: 0; background: ${accent}; color: #fff; border-radius: 50%; font-size: 0.58rem; font-weight: 800; min-width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; }
        .ss-btn-login { color: #fff; text-decoration: none; font-size: 0.85rem; padding: 7px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25); transition: all 0.15s; white-space: nowrap; }
        .ss-btn-login:hover { background: rgba(255,255,255,0.1); }
        .ss-btn-reg { color: #fff; text-decoration: none; font-size: 0.85rem; padding: 7px 14px; border-radius: 6px; background: ${accent}; white-space: nowrap; }
        .ss-btn-reg:hover { opacity: 0.88; }
        .ss-btn-out { background: transparent; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; white-space: nowrap; }
        .ss-btn-out:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .ss-admin-btn { background: ${accent}; color: #fff; text-decoration: none; font-size: 0.78rem; font-weight: 700; padding: 5px 11px; border-radius: 6px; white-space: nowrap; }
        .ss-user-chip { color: #94a3b8; font-size: 0.8rem; padding: 0 2px; white-space: nowrap; }
        .ss-avatar { width: 32px; height: 32px; border-radius: 50%; background: ${accent}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.78rem; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.2); cursor: pointer; text-decoration: none; transition: border-color 0.15s; }
        .ss-avatar:hover { border-color: rgba(255,255,255,0.5); }
        .ss-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 8px; flex-shrink: 0; }
        .ss-hamburger span { display: block; width: 23px; height: 2px; background: #fff; border-radius: 2px; }
        .ss-hamburger span + span { margin-top: 5px; }
        .ss-mobile-search-bar { display: none; background: #162032; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .ss-drawer { display: none; }
        .ss-mobile-right { display: none; }
        @media (max-width: 900px) {
          .ss-search-desktop { display: none; }
          .ss-links { display: none; }
          .ss-hamburger { display: block; }
          .ss-mobile-search-bar { display: block; }
          .ss-mobile-right { display: flex; align-items: center; gap: 4px; margin-left: auto; }
          .ss-drawer { display: block; background: #1a1a2e; border-top: 1px solid rgba(255,255,255,0.06); }
          .ss-drawer a, .ss-drawer button { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 20px; color: #cbd5e1; text-decoration: none; font-size: 0.95rem; border: none; border-bottom: 1px solid rgba(255,255,255,0.05); background: none; cursor: pointer; text-align: left; }
          .ss-drawer a:last-child, .ss-drawer button:last-child { border-bottom: none; }
          .ss-drawer a:hover, .ss-drawer button:hover { background: rgba(255,255,255,0.04); color: #fff; }
          .ss-drawer .cart-count { background: ${accent}; color: #fff; border-radius: 10px; padding: 1px 8px; font-size: 0.7rem; font-weight: 700; margin-left: 4px; }
          .ss-top { padding: 0 14px; gap: 10px; }
        }
      `}</style>

      <nav className="ss-nav">
        <div className="ss-top">
          <Link to="/" className="ss-brand" onClick={close}>
            {settings.site_logo
              ? <img src={settings.site_logo} alt="logo" className="ss-logo" />
              : <div className="ss-logo-box">{(settings.site_name || 'S')[0]}</div>
            }
            <span className="ss-site-name">{settings.site_name || 'Samuel Store'}</span>
          </Link>

          <div className="ss-search-desktop">
            <SearchBar refProp={searchRef} {...searchProps} />
          </div>

          <div className="ss-links">
            <Link to="/" className={`ss-link${isActive('/') ? ' active' : ''}`}>Home</Link>
            <Link to="/products" className={`ss-link${isActive('/products') ? ' active' : ''}`}>Products</Link>
            {user && <Link to="/orders" className={`ss-link${isActive('/orders') ? ' active' : ''}`}>Orders</Link>}
            <Link to="/cart" className="ss-cart-btn">
              🛒{cart.length > 0 && <span className="ss-badge">{cart.length}</span>}
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="ss-avatar" title={user.name}>
                  {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </Link>
                {user.role === 'admin' && <Link to="/admin" className="ss-admin-btn">⚡ Admin</Link>}
                <button onClick={handleLogout} className="ss-btn-out">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="ss-btn-login">Login</Link>
                <Link to="/register" className="ss-btn-reg">Register</Link>
              </>
            )}
          </div>

          <div className="ss-mobile-right">
            <Link to="/cart" className="ss-cart-btn">
              🛒{cart.length > 0 && <span className="ss-badge">{cart.length}</span>}
            </Link>
            <button className="ss-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>

        <div className="ss-mobile-search-bar">
          <SearchBar refProp={mobileSearchRef} {...searchProps} />
        </div>

        {menuOpen && (
          <div className="ss-drawer">
            <Link to="/" onClick={close}>🏠 <span>Home</span></Link>
            <Link to="/products" onClick={close}>🛍 <span>Products</span></Link>
            <Link to="/cart" onClick={close}>
              🛒 <span>Cart</span>
              {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
            </Link>
            {user ? (
              <>
                <Link to="/orders" onClick={close}>📦 <span>My Orders</span></Link>
                <Link to="/dashboard" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.72rem', flexShrink: 0 }}>
                    {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                  <span>{user.name.split(' ')[0]} — Dashboard</span>
                </Link>
                {user.role === 'admin' && <Link to="/admin" onClick={close}>⚡ <span>Admin Panel</span></Link>}
                <button onClick={handleLogout}>↩ <span>Logout</span></button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close}>🔑 <span>Login</span></Link>
                <Link to="/register" onClick={close}>✨ <span>Register</span></Link>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

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
