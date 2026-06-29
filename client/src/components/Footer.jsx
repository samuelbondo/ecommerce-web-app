import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  const accent = settings.accent_color || '#e94560';
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        .ss-footer-grid { max-width: 1200px; margin: 0 auto; padding: 56px 24px 32px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; }
        .ss-footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; text-decoration: none; }
        .ss-footer-logo-box { width: 36px; height: 36px; border-radius: 8px; background: ${accent}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 1.1rem; flex-shrink: 0; }
        .ss-footer-site-name { color: #fff; font-weight: 800; font-size: 1.1rem; }
        .ss-footer-about { font-size: 0.88rem; line-height: 1.7; color: #64748b; margin-bottom: 20px; }
        .ss-footer-social { display: flex; gap: 10px; }
        .ss-footer-social a { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; color: #94a3b8; text-decoration: none; transition: all 0.2s; }
        .ss-footer-social a:hover { background: ${accent}; color: #fff; }
        .ss-footer-social svg { width: 17px; height: 17px; fill: currentColor; }
        .ss-footer-col h4 { color: #fff; font-size: 0.9rem; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.06em; }
        .ss-footer-col a { display: block; color: #64748b; text-decoration: none; font-size: 0.88rem; padding: 4px 0; transition: color 0.15s; }
        .ss-footer-col a:hover { color: ${accent}; }
        .ss-footer-contact-item { display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: #64748b; margin-bottom: 10px; }
        .ss-footer-contact-icon { flex-shrink: 0; margin-top: 1px; }
        .ss-footer-bottom { border-top: 1px solid rgba(255,255,255,0.07); }
        .ss-footer-bottom-inner { max-width: 1200px; margin: 0 auto; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; font-size: 0.82rem; color: #475569; }
        .ss-footer-bottom a { color: #475569; text-decoration: none; }
        .ss-footer-bottom a:hover { color: ${accent}; }
        .ss-footer-bottom-links { display: flex; gap: 20px; }
        @media (max-width: 768px) { .ss-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; } }
        @media (max-width: 480px) {
          .ss-footer-grid { grid-template-columns: 1fr; gap: 28px; padding: 40px 20px 24px; }
          .ss-footer-bottom-inner { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="ss-footer-grid">
        {/* Brand */}
        <div>
          <Link to="/" className="ss-footer-brand">
            {settings.site_logo
              ? <img src={settings.site_logo} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
              : <div className="ss-footer-logo-box">{(settings.site_name || 'S')[0]}</div>
            }
            <span className="ss-footer-site-name">{settings.site_name || 'Samuel Store'}</span>
          </Link>
          <p className="ss-footer-about">
            {settings.footer_about || 'Your one-stop shop for quality products delivered to your door.'}
          </p>
          <div className="ss-footer-social">
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            )}
            {settings.twitter && (
              <a href={settings.twitter} target="_blank" rel="noopener noreferrer" title="Twitter / X">
                <svg viewBox="0 0 24 24"><path d="M4 4l16 16M4 20L20 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* Shop */}
        <div className="ss-footer-col">
          <h4>Shop</h4>
          <Link to="/products">All Products</Link>
          <Link to="/cart">Shopping Cart</Link>
        </div>

        {/* Account */}
        <div className="ss-footer-col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>

        {/* Contact */}
        <div className="ss-footer-col">
          <h4>Contact</h4>
          {settings.footer_email && (
            <div className="ss-footer-contact-item">
              <span className="ss-footer-contact-icon">✉️</span>
              <span>{settings.footer_email}</span>
            </div>
          )}
          {settings.footer_phone && (
            <div className="ss-footer-contact-item">
              <span className="ss-footer-contact-icon">📞</span>
              <span>{settings.footer_phone}</span>
            </div>
          )}
          {settings.footer_address && (
            <div className="ss-footer-contact-item">
              <span className="ss-footer-contact-icon">📍</span>
              <span>{settings.footer_address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="ss-footer-bottom">
        <div className="ss-footer-bottom-inner">
          <span>© {year} {settings.site_name || 'Samuel Store'}. All rights reserved.</span>
          <div className="ss-footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
