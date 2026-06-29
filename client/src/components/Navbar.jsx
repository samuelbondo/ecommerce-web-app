import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import API from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { settings, formatPrice } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const accent = settings.accent_color || '#e94560';
  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const close = () => setMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    API.get('/products').then(r => setAllProducts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setShowDrop(false); setQuery(''); setMenuOpen(false); }, [location.pathname]);

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
  };

  const handleSuggestionClick = (product) => {
    setShowDrop(false);
    setQuery('');
    navigate(`/products/${product.id}`);
  };

  const SearchBar = ({ refProp }) => (
    <div ref={refProp} style={{ position: 'relative' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'visible', transition: 'all 0.2s' }} className="ss-search-form">
        <input
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
      {showDrop && (
        <div className="ss-drop">
          {suggestions.length === 0 ? (
            <div className="ss-drop-empty">No results for "{query}"</div>
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
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .ss-nav { position: sticky; top: 0; z-index: 1000; background: #1a1a2e; box-shadow: 0 2px 12px rgba(0,0,0,0.18); }

        /* ── Top bar ── */
        .ss-top { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .ss-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .ss-logo { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
        .ss-logo-box { width: 36px; height: 36px; border-radius: 8px; background: ${accent}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 1.1rem; flex-shrink: 0; }
        .ss-site-name { color: ${accent}; font-weight: 800; font-size: 1.2rem; letter-spacing: -0.3px; white-space: nowrap; }

        /* ── Desktop search (middle) ── */
        .ss-search-desktop { flex: 1; max-width: 500px; }
        .ss-search-form { display: flex; align-items: center; border-radius: 10px; overflow: visible; transition: all 0.2s; }
        .ss-search-form:focus-within { background: #fff !important; border-color: #fff !important; box-shadow: 0 0 0 3px rgba(233,69,96,0.2); }
        .ss-search-input { flex: 1; background: transparent; border: none; outline: none; padding: 9px 14px; font-size: 0.9rem; color: #fff; min-width: 0; width: 0; }
        .ss-search-form:focus-within .ss-search-input { color: #1a1a2e; }
        .ss-search-input::placeholder { color: rgba(255,255,255,0.45); }
        .ss-search-form:focus-within .ss-search-input::placeholder { color: #94a3b8; }
        .ss-search-btn { background: ${accent}; border: none; padding: 8px 16px; cursor: pointer; color: #fff; display: flex; align-items: center; border-radius: 0 8px 8px 0; transition: opacity 0.15s; flex-shrink: 0; height: 100%; }
        .ss-search-btn:hover { opacity: 0.85; }

        /* ── Dropdown ── */
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

        /* ── Desktop nav links ── */
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

        /* ── Hamburger ── */
        .ss-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 8px; flex-shrink: 0; }
        .ss-hamburger span { display: block; width: 23px; height: 2px; background: #fff; border-radius: 2px; }
        .ss-hamburger span + span { margin-top: 5px; }

        /* ── Mobile search bar (always visible below nav on mobile) ── */
        .ss-mobile-search-bar { display: none; background: #162032; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.07); }

        /* ── Mobile drawer ── */
        .ss-drawer { display: none; }

        /* ── MOBILE ── */
        @media (max-width: 900px) {
          .ss-search-desktop { display: none; }
          .ss-links { display: none; }
          .ss-hamburger { display: block; margin-left: auto; }
          .ss-mobile-search-bar { display: block; }
          .ss-drawer { display: block; background: #1a1a2e; border-top: 1px solid rgba(255,255,255,0.06); }
          .ss-drawer a, .ss-drawer button {
            display: flex; align-items: center; gap: 12px;
            width: 100%; padding: 14px 20px;
            color: #cbd5e1; text-decoration: none; font-size: 0.95rem;
            border: none; border-bottom: 1px solid rgba(255,255,255,0.05);
            background: none; cursor: pointer; text-align: left;
          }
          .ss-drawer a:last-child, .ss-drawer button:last-child { border-bottom: none; }
          .ss-drawer a:hover, .ss-drawer button:hover { background: rgba(255,255,255,0.04); color: #fff; }
          .ss-drawer .cart-count { background: ${accent}; color: #fff; border-radius: 10px; padding: 1px 8px; font-size: 0.7rem; font-weight: 700; margin-left: 4px; }
          .ss-top { padding: 0 14px; gap: 10px; }
        }
      `}</style>

      <nav className="ss-nav">
        {/* ── Top bar ── */}
        <div className="ss-top">
          <Link to="/" className="ss-brand" onClick={close}>
            {settings.site_logo
              ? <img src={settings.site_logo} alt="logo" className="ss-logo" />
              : <div className="ss-logo-box">{(settings.site_name || 'S')[0]}</div>
            }
            <span className="ss-site-name">{settings.site_name || 'Samuel Store'}</span>
          </Link>

          {/* Desktop search */}
          <div className="ss-search-desktop">
            <SearchBar refProp={searchRef} />
          </div>

          {/* Desktop links */}
          <div className="ss-links">
            <Link to="/" className={`ss-link${isActive('/') ? ' active' : ''}`}>Home</Link>
            <Link to="/products" className={`ss-link${isActive('/products') ? ' active' : ''}`}>Products</Link>
            {user && <Link to="/orders" className={`ss-link${isActive('/orders') ? ' active' : ''}`}>Orders</Link>}
            <Link to="/cart" className="ss-cart-btn">
              🛒{cart.length > 0 && <span className="ss-badge">{cart.length}</span>}
            </Link>
            {user ? (
              <>
                <span className="ss-user-chip">Hi, {user.name.split(' ')[0]}</span>
                <Link to="/dashboard" className="ss-link">Dashboard</Link>
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

          {/* Mobile: cart + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }} className="ss-mobile-right">
            <Link to="/cart" className="ss-cart-btn" style={{ display: 'none' }} id="mob-cart">
              🛒{cart.length > 0 && <span className="ss-badge">{cart.length}</span>}
            </Link>
            <button className="ss-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* ── Mobile search bar (always shown on mobile, below top bar) ── */}
        <div className="ss-mobile-search-bar">
          <SearchBar refProp={mobileSearchRef} />
        </div>

        {/* ── Mobile drawer ── */}
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
                <Link to="/dashboard" onClick={close}>👤 <span>Dashboard</span></Link>
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

      {/* Fix: show cart icon only on mobile via CSS */}
      <style>{`
        @media (max-width: 900px) { #mob-cart { display: flex !important; } .ss-mobile-right { display: flex !important; } }
        @media (min-width: 901px) { .ss-mobile-right { display: none !important; } .ss-mobile-search-bar { display: none !important; } }
      `}</style>
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
