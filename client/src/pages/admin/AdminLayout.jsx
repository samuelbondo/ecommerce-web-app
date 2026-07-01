import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminOverview from './AdminOverview';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import AdminInventory from './AdminInventory';
import AdminCoupons from './AdminCoupons';
import AdminReviews from './AdminReviews';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import AdminBanners from './AdminBanners';

const NAV_GROUPS = [
  { label: 'Main', items: [
    { to: '', icon: '📊', label: 'Overview' },
    { to: 'orders', icon: '📦', label: 'Orders' },
    { to: 'customers', icon: '👥', label: 'Customers' },
  ]},
  { label: 'Catalog', items: [
    { to: 'products', icon: '🏷️', label: 'Products' },
    { to: 'categories', icon: '📂', label: 'Categories' },
    { to: 'inventory', icon: '📋', label: 'Inventory' },
  ]},
  { label: 'Marketing', items: [
    { to: 'coupons', icon: '🎟️', label: 'Coupons' },
    { to: 'reviews', icon: '⭐', label: 'Reviews' },
    { to: 'banners', icon: '🖼️', label: 'Banners' },
  ]},
  { label: 'Analytics', items: [
    { to: 'reports', icon: '📈', label: 'Reports' },
  ]},
  { label: 'System', items: [
    { to: 'settings', icon: '⚙️', label: 'Settings' },
  ]},
];

const BREADCRUMB = { '/admin': 'Overview', '/admin/orders': 'Orders', '/admin/customers': 'Customers', '/admin/products': 'Products', '/admin/categories': 'Categories', '/admin/inventory': 'Inventory', '/admin/coupons': 'Coupons', '/admin/reviews': 'Reviews', '/admin/reports': 'Reports', '/admin/settings': 'Settings' };

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatar = user?.avatar || null;
  const breadcrumb = BREADCRUMB[location.pathname] || 'Admin';

  return (
    <div style={s.root}>
      <style>{`
        /* ── Admin global responsive overrides ── */
        .adm-sidebar {
          background: #0f172a;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: width 0.22s ease, transform 0.25s ease;
          overflow: hidden;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 99;
        }
        .adm-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
        .adm-content { flex: 1; overflow-y: auto; overflow-x: hidden; }
        /* page padding responsive */
        .adm-content > div { box-sizing: border-box; }

        /* wrap padding shrinks on mobile */
        @media (max-width: 768px) {
          .adm-sidebar {
            position: fixed !important;
            top: 0; left: 0; height: 100vh;
            width: 220px !important;
            transform: translateX(-100%);
            z-index: 200;
          }
          .adm-sidebar.open { transform: translateX(0); }
          /* inner page padding */
          .adm-content > div > div[style] { padding: 14px !important; }
        }

        /* Stats grid */
        .adm-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (max-width: 480px) {
          .adm-stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
        }

        /* Overview row2: chart + top products */
        .adm-row2 {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 18px;
          margin-bottom: 20px;
        }
        @media (max-width: 900px) {
          .adm-row2 { grid-template-columns: 1fr; }
        }

        /* Settings layout */
        .adm-settings-layout {
          display: flex;
          gap: 18px;
          align-items: flex-start;
        }
        @media (max-width: 640px) {
          .adm-settings-layout { flex-direction: column; }
          .adm-settings-layout > div:first-child { width: 100% !important; flex-direction: row !important; flex-wrap: wrap; }
        }

        /* Settings grid2 */
        .adm-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 520px) {
          .adm-grid2 { grid-template-columns: 1fr; }
        }

        /* Toolbar: search + filters wrap */
        .adm-toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
          align-items: center;
        }
        .adm-toolbar input,
        .adm-toolbar select {
          flex: 1 1 160px;
          min-width: 0;
          max-width: 280px;
          box-sizing: border-box;
        }
        @media (max-width: 480px) {
          .adm-toolbar input,
          .adm-toolbar select { max-width: 100%; }
        }

        /* Tables scroll on all sizes */
        .adm-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .adm-table-wrap table { min-width: 500px; }

        /* Topbar right: hide badge + logout text on very small screens */
        @media (max-width: 400px) {
          .adm-top-badge { display: none; }
          .adm-top-logout span { display: none; }
        }

        /* Modal full-screen on mobile */
        @media (max-width: 600px) {
          .adm-modal {
            width: 100% !important;
            max-width: 100% !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          .adm-overlay { align-items: flex-end !important; padding: 0 !important; }
        }

        /* Pagination wraps */
        .adm-pagination { display: flex; gap: 6px; padding: 14px; justify-content: center; border-top: 1px solid #f5f5f5; flex-wrap: wrap; }

        /* Order status buttons wrap */
        .adm-status-btns { display: flex; gap: 8px; flex-wrap: wrap; }

        /* Inventory adjust row */
        .adm-adjust-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .adm-adjust-row input { width: 70px; min-width: 60px; }
      `}</style>

      {mobileOpen && <div style={s.mobileOverlay} onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`adm-sidebar${mobileOpen ? ' open' : ''}`} style={{ width: collapsed ? '64px' : '220px' }}>
        {/* Brand */}
        <div style={s.brand}>
          {!collapsed && <span style={s.brandName}>⚡ Admin Panel</span>}
          <button onClick={() => setCollapsed(!collapsed)} style={s.collapseBtn} title="Toggle sidebar">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={s.navGroup}>
              {!collapsed && <div style={s.groupLabel}>{group.label}</div>}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to === '' ? '/admin' : `/admin/${item.to}`}
                  end={item.to === ''}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : ''}
                  style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}), justifyContent: collapsed ? 'center' : 'flex-start' })}
                >
                  <span style={s.navIcon}>{item.icon}</span>
                  {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div style={s.sidebarFooter}>
            <NavLink to="/" style={s.footerLink}>🛍 View Store</NavLink>
            <NavLink to="/dashboard" style={s.footerLink}>👤 My Account</NavLink>
            <button onClick={handleLogout} style={s.logoutBtn}>↩ Logout</button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="adm-main">
        {/* Topbar */}
        <header style={s.topbar}>
          <div style={s.topLeft}>
            <button onClick={() => setMobileOpen(o => !o)} style={s.menuBtn} aria-label="Menu">☰</button>
            <div style={s.breadcrumb}>
              <span style={s.breadHome} onClick={() => navigate('/admin')}>Admin</span>
              {breadcrumb !== 'Overview' && <><span style={s.sep}>/</span><span style={s.breadCurrent}>{breadcrumb}</span></>}
            </div>
          </div>
          <div style={s.topRight}>
            <div className="adm-top-badge" style={s.adminBadge}>🔐 Admin</div>
            <div style={s.topAvatar} title={user?.name}>
              {avatar ? <img src={avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
            </div>
            <button onClick={handleLogout} className="adm-top-logout" style={s.topLogout}>↩ <span>Logout</span></button>
          </div>
        </header>

        {/* Content */}
        <main className="adm-content">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' },
  mobileOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 },
  brand: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: '60px' },
  brandName: { color: '#e94560', fontWeight: '800', fontSize: '0.95rem', whiteSpace: 'nowrap' },
  collapseBtn: { background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nav: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  navGroup: { marginBottom: '4px' },
  groupLabel: { fontSize: '0.65rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 14px 4px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', color: '#94a3b8', textDecoration: 'none', fontSize: '0.83rem', transition: 'all 0.15s', borderLeft: '3px solid transparent', whiteSpace: 'nowrap' },
  navActive: { color: '#fff', background: 'rgba(233,69,96,0.15)', borderLeft: '3px solid #e94560' },
  navIcon: { fontSize: '0.95rem', flexShrink: 0, width: '18px', textAlign: 'center' },
  navLabel: { overflow: 'hidden' },
  sidebarFooter: { padding: '14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '2px' },
  footerLink: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.78rem', padding: '6px 4px', display: 'block' },
  logoutBtn: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '7px', padding: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', textAlign: 'left', marginTop: '4px' },
  topbar: { background: '#fff', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 },
  topLeft: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
  menuBtn: { background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b', padding: '4px', flexShrink: 0 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', overflow: 'hidden' },
  breadHome: { color: '#94a3b8', cursor: 'pointer', whiteSpace: 'nowrap' },
  sep: { color: '#cbd5e1' },
  breadCurrent: { color: '#1e293b', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  topRight: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  adminBadge: { background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' },
  topAvatar: { width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 },
  topLogout: { padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '7px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' },
};
