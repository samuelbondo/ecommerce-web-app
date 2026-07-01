import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Overview from './Overview';
import DashOrders from './DashOrders';
import DashProfile from './DashProfile';
import DashAddresses from './DashAddresses';
import { DashReviews, DashNotifications, DashSettings } from './DashExtras';

const NAV = [
  { to: '', icon: '🏠', label: 'Overview' },
  { to: 'orders', icon: '📦', label: 'My Orders' },
  { to: 'profile', icon: '👤', label: 'Profile' },
  { to: 'addresses', icon: '📍', label: 'Addresses' },
  { to: 'reviews', icon: '⭐', label: 'Reviews' },
  { to: 'notifications', icon: '🔔', label: 'Notifications' },
  { to: 'settings', icon: '⚙️', label: 'Settings' },
];

const BREADCRUMB_MAP = {
  '/dashboard': 'Overview',
  '/dashboard/orders': 'My Orders',
  '/dashboard/profile': 'Profile',
  '/dashboard/addresses': 'Addresses',
  '/dashboard/reviews': 'Reviews',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/settings': 'Settings',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const breadcrumb = BREADCRUMB_MAP[location.pathname] || 'Dashboard';

  return (
    <div style={s.root}>
      <style>{`
        .dash-sidebar {
          width: 240px;
          min-height: 100vh;
          background: #1a1a2e;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 99;
          transition: transform 0.25s ease;
        }
        .dash-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
        .dash-content { flex: 1; overflow-y: auto; overflow-x: hidden; }
        .dash-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 98; }
        /* Overview table responsive */
        .dash-order-table { display: flex; flex-direction: column; }
        .dash-order-head { display: grid; grid-template-columns: 70px 1fr 1fr 100px; padding: 8px 12px; font-size: 0.75rem; color: #999; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .dash-order-row  { display: grid; grid-template-columns: 70px 1fr 1fr 100px; padding: 12px; border-top: 1px solid #f5f5f5; align-items: center; }
        /* Profile grid */
        .dash-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        /* Address grid */
        .dash-addr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        /* Address form grid */
        .dash-addr-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 768px) {
          .dash-sidebar {
            position: fixed !important;
            top: 0; left: 0; height: 100vh;
            transform: translateX(-100%);
            z-index: 200;
          }
          .dash-sidebar.open { transform: translateX(0) !important; }
          .dash-overlay { display: block; }
          .dash-order-head { grid-template-columns: 60px 1fr 90px; }
          .dash-order-row  { grid-template-columns: 60px 1fr 90px; }
          .dash-order-head span:nth-child(2),
          .dash-order-row  span:nth-child(2) { display: none; }
          .dash-grid2 { grid-template-columns: 1fr; }
          .dash-addr-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .dash-order-head { grid-template-columns: 56px 1fr 80px; }
          .dash-order-row  { grid-template-columns: 56px 1fr 80px; }
        }
      `}</style>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div style={s.sidebarBrand}>
          <span style={s.brandIcon}>🛍</span>
          <span style={s.brandName}>Samuel Store</span>
        </div>

        <div style={s.sidebarUser}>
          <div style={s.userAvatar}>{initials}</div>
          <div>
            <div style={s.userName}>{user?.name}</div>
            <div style={s.userRole}>{user?.role || 'Customer'}</div>
          </div>
        </div>

        <nav style={s.nav}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to === '' ? '/dashboard' : `/dashboard/${item.to}`}
              end={item.to === ''}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <NavLink to="/products" style={s.footerLink}>🛍 Shop</NavLink>
          <NavLink to="/cart" style={s.footerLink}>🛒 Cart ({cart.length})</NavLink>
          <button onClick={handleLogout} style={s.logoutBtn}>↩ Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dash-main">
        {/* Topbar */}
        <header style={s.topbar}>
          <div style={s.topLeft}>
            <button onClick={() => setSidebarOpen(o => !o)} style={s.menuBtn} aria-label="Menu">☰</button>
            <div style={s.breadcrumb}>
              <span style={s.breadHome} onClick={() => navigate('/dashboard')}>Dashboard</span>
              {breadcrumb !== 'Overview' && <><span style={s.breadSep}>/</span><span style={s.breadCurrent}>{breadcrumb}</span></>}
            </div>
          </div>
          <div style={s.topRight}>
            <NavLink to="/dashboard/notifications" style={s.topIconBtn} title="Notifications">🔔</NavLink>
            <NavLink to="/cart" style={s.topIconBtn} title="Cart">
              🛒 {cart.length > 0 && <span style={s.cartBadge}>{cart.length}</span>}
            </NavLink>
            <div style={s.topAvatar} onClick={() => navigate('/dashboard/profile')} title="Profile">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dash-content">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="orders" element={<DashOrders />} />
            <Route path="profile" element={<DashProfile />} />
            <Route path="addresses" element={<DashAddresses />} />
            <Route path="reviews" element={<DashReviews />} />
            <Route path="notifications" element={<DashNotifications />} />
            <Route path="settings" element={<DashSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

const SIDEBAR_W = '240px';

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f8f9fb', fontFamily: 'system-ui, sans-serif' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 },
  sidebar: { width: '240px', minHeight: '100vh', background: '#1a1a2e', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0 },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  brandIcon: { fontSize: '1.4rem' },
  brandName: { color: '#e94560', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.3px' },
  sidebarUser: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  userAvatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 },
  userName: { color: '#fff', fontWeight: '600', fontSize: '0.88rem' },
  userRole: { color: '#a0aec0', fontSize: '0.75rem', textTransform: 'capitalize' },
  nav: { flex: 1, padding: '12px 0', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 20px', color: '#a0aec0', textDecoration: 'none', fontSize: '0.88rem', transition: 'all 0.15s', borderLeft: '3px solid transparent' },
  navActive: { color: '#fff', background: 'rgba(233,69,96,0.12)', borderLeft: '3px solid #e94560' },
  navIcon: { fontSize: '1rem', width: '20px', textAlign: 'center' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '4px' },
  footerLink: { color: '#a0aec0', textDecoration: 'none', fontSize: '0.82rem', padding: '6px 0' },
  logoutBtn: { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', marginTop: '4px', textAlign: 'left' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: { background: '#fff', padding: '0 12px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 },
  topLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  menuBtn: { background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#555', padding: '4px', lineHeight: 1 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' },
  breadHome: { color: '#888', cursor: 'pointer' },
  breadSep: { color: '#ccc' },
  breadCurrent: { color: '#1a1a2e', fontWeight: '600' },
  topRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  topIconBtn: { background: 'none', border: 'none', fontSize: '1.15rem', cursor: 'pointer', color: '#555', padding: '6px 8px', borderRadius: '8px', textDecoration: 'none', position: 'relative', display: 'inline-flex', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: '-2px', right: '0px', background: '#e94560', color: '#fff', borderRadius: '50%', fontSize: '0.6rem', fontWeight: '700', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  topAvatar: { width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' },
  content: { flex: 1, overflowY: 'auto' },
};
