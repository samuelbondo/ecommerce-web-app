import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import HeroCarousel from '../components/HeroCarousel';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const { settings, formatPrice } = useSettings();
  const { addToCart } = useCart();
  const accent = settings.accent_color || '#e94560';

  useEffect(() => {
    Promise.all([
      API.get('/products'),
      API.get('/categories'),
      API.get('/ai/chat/ratings/public'),
    ]).then(([pRes, cRes, tRes]) => {
      setProducts(pRes.data.slice(0, 8));
      setCategories(cRes.data);
      setTestimonials(tRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes progress { from{width:0%} to{width:100%} }

        /* Trust bar */
        .ss-trust { background:#fff; border-bottom:1px solid #e5e7eb; }
        .ss-trust-inner { max-width:1200px; margin:0 auto; padding:14px 24px; display:flex; justify-content:center; gap:clamp(16px,4vw,48px); flex-wrap:wrap; }
        .ss-trust-item { display:flex; align-items:center; gap:9px; font-size:0.84rem; color:#374151; font-weight:500; }

        /* Sections */
        .ss-section { max-width:1200px; margin:0 auto; padding:52px 24px; }
        .ss-section-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; }
        .ss-section-title { font-size:1.45rem; font-weight:800; color:#1a1a2e; }
        .ss-section-title span { color:${accent}; }
        .ss-see-all { color:${accent}; text-decoration:none; font-size:0.85rem; font-weight:600; display:flex; align-items:center; gap:4px; transition:gap 0.15s; }
        .ss-see-all:hover { gap:8px; }

        /* Categories */
        .ss-cat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:14px; }
        .ss-cat-card { background:#fff; border:1.5px solid #e5e7eb; border-radius:14px; padding:22px 12px; text-align:center; text-decoration:none; color:#1a1a2e; transition:all 0.2s; }
        .ss-cat-card:hover { border-color:${accent}; box-shadow:0 6px 24px rgba(233,69,96,0.1); transform:translateY(-4px); }
        .ss-cat-img { width:48px; height:48px; border-radius:12px; object-fit:cover; margin:0 auto 10px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; }
        .ss-cat-name { font-size:0.84rem; font-weight:600; }
        .ss-cat-count { font-size:0.72rem; color:#94a3b8; margin-top:2px; }

        /* Products */
        .ss-prod-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:22px; }
        .ss-prod-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; display:flex; flex-direction:column; transition:all 0.22s; }
        .ss-prod-card:hover { box-shadow:0 10px 40px rgba(0,0,0,0.1); transform:translateY(-5px); border-color:#d1d5db; }
        .ss-prod-img-wrap { position:relative; overflow:hidden; }
        .ss-prod-img { width:100%; height:210px; object-fit:cover; display:block; transition:transform 0.4s ease; }
        .ss-prod-card:hover .ss-prod-img { transform:scale(1.06); }
        .ss-prod-badge { position:absolute; top:10px; left:10px; background:${accent}; color:#fff; font-size:0.68rem; font-weight:700; padding:3px 9px; border-radius:5px; letter-spacing:0.04em; text-transform:uppercase; }
        .ss-prod-wishlist { position:absolute; top:10px; right:10px; width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.9); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:0; transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.12); }
        .ss-prod-card:hover .ss-prod-wishlist { opacity:1; }
        .ss-prod-body { padding:14px 16px 16px; flex:1; display:flex; flex-direction:column; }
        .ss-prod-cat { font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px; }
        .ss-prod-name { font-size:0.93rem; font-weight:600; color:#1a1a2e; line-height:1.45; flex:1; text-decoration:none; display:block; }
        .ss-prod-name:hover { color:${accent}; }
        .ss-prod-footer { display:flex; justify-content:space-between; align-items:center; margin-top:12px; gap:8px; }
        .ss-prod-price { font-size:1rem; font-weight:800; color:${accent}; }
        .ss-add-btn { background:${accent}; color:#fff; border:none; width:34px; height:34px; border-radius:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; box-shadow:0 3px 10px rgba(233,69,96,0.3); }
        .ss-add-btn:hover { transform:scale(1.1); box-shadow:0 4px 16px rgba(233,69,96,0.45); }
        .ss-add-btn:active { transform:scale(0.96); }
        .ss-stock-low { font-size:0.7rem; color:#f59e0b; font-weight:600; }
        .ss-stock-out { font-size:0.7rem; color:#ef4444; font-weight:600; }

        /* Skeleton */
        .sk { background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }

        /* Promo */
        .ss-promo { background:linear-gradient(135deg,${accent} 0%,#c73652 100%); color:#fff; }
        .ss-promo-inner { max-width:1200px; margin:0 auto; padding:52px 24px; display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; }
        .ss-promo h2 { font-size:clamp(1.4rem,3vw,2rem); font-weight:800; margin-bottom:6px; }
        .ss-promo p { opacity:0.88; font-size:0.95rem; line-height:1.6; }
        .ss-promo-btn { background:#fff; color:${accent}; padding:13px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:0.95rem; transition:all 0.2s; white-space:nowrap; box-shadow:0 4px 16px rgba(0,0,0,0.15); }
        .ss-promo-btn:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,0.2); }

        /* Testimonials */
        .ss-testimonials { background: #fff; }
        .ss-testi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
        .ss-testi-card { background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .ss-testi-stars { color: #f59e0b; font-size: 1rem; letter-spacing: 2px; }
        .ss-testi-comment { font-size: 0.88rem; color: #374151; line-height: 1.6; font-style: italic; flex: 1; }
        .ss-testi-author { font-size: 0.78rem; color: #94a3b8; font-weight: 600; }

        @media (max-width:640px) {
          .ss-section { padding:32px 16px; }
          .ss-prod-grid { grid-template-columns:repeat(2,1fr); gap:12px; }
          .ss-prod-img { height:160px; }
          .ss-promo-inner { text-align:center; justify-content:center; }
          .ss-trust-item span:last-child { display:none; }
        }
      `}</style>

      {/* ── Hero Carousel ── */}
      <HeroCarousel />

      {/* ── Trust Bar ── */}
      <div className="ss-trust">
        <div className="ss-trust-inner">
          <TrustItem icon={<TruckIcon />} text={`Free Delivery over ${formatPrice(settings.free_shipping_threshold || 2000)}`} />
          <TrustItem icon={<LockIcon />} text="Secure Payments" />
          <TrustItem icon={<ReturnIcon />} text="Easy 30-Day Returns" />
          <TrustItem icon={<SupportIcon />} text="24/7 Customer Support" />
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="ss-section">
          <div className="ss-section-hd">
            <h2 className="ss-section-title">Shop by <span>Category</span></h2>
            <Link to="/products" className="ss-see-all">Browse all →</Link>
          </div>
          <div className="ss-cat-grid">
            {categories.map((c) => (
              <Link to={`/products?cat=${c.id}`} key={c.id} className="ss-cat-card">
                <div className="ss-cat-img">
                  <span style={{ fontSize: '1.6rem' }}>{getCatEmoji(c.name)}</span>
                </div>
                <div className="ss-cat-name">{c.name}</div>
                {c.product_count > 0 && <div className="ss-cat-count">{c.product_count} product{c.product_count !== 1 ? 's' : ''}</div>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className="ss-section" style={{ paddingTop: 0 }}>
        <div className="ss-section-hd">
          <h2 className="ss-section-title">Featured <span>Products</span></h2>
          <Link to="/products" className="ss-see-all">See all →</Link>
        </div>

        {loading ? (
          <div className="ss-prod-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ borderRadius: 14, overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb' }}>
                <div className="sk" style={{ height: 210 }} />
                <div style={{ padding: 14 }}>
                  <div className="sk" style={{ height: 10, marginBottom: 8, width: '40%' }} />
                  <div className="sk" style={{ height: 14, marginBottom: 12 }} />
                  <div className="sk" style={{ height: 14, width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ss-prod-grid">
            {products.map((p, i) => (
              <div key={p.id} className="ss-prod-card">
                <div className="ss-prod-img-wrap">
                  <Link to={`/products/${p.id}`}>
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="ss-prod-img"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
                    />
                  </Link>
                  {i < 3 && <span className="ss-prod-badge">New</span>}
                  <button className="ss-prod-wishlist" title="Save to wishlist" onClick={(e) => e.preventDefault()}>
                    <HeartIcon />
                  </button>
                </div>
                <div className="ss-prod-body">
                  <div className="ss-prod-cat">{p.category}</div>
                  <Link to={`/products/${p.id}`} className="ss-prod-name">{p.name}</Link>
                  {p.stock > 0 && p.stock <= 5 && <span className="ss-stock-low">Only {p.stock} left</span>}
                  {p.stock === 0 && <span className="ss-stock-out">Out of stock</span>}
                  <div className="ss-prod-footer">
                    <span className="ss-prod-price">{formatPrice(p.price)}</span>
                    <button
                      className="ss-add-btn"
                      onClick={() => addToCart(p)}
                      disabled={p.stock === 0}
                      title="Add to cart"
                    >
                      <CartPlusIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <div className="ss-testimonials">
          <section className="ss-section">
            <div className="ss-section-hd">
              <h2 className="ss-section-title">What Customers <span>Say</span></h2>
            </div>
            <div className="ss-testi-grid">
              {testimonials.map((t, i) => (
                <div key={i} className="ss-testi-card">
                  <div className="ss-testi-stars">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                  <div className="ss-testi-comment">"{t.comment}"</div>
                  <div className="ss-testi-author">— {t.display_name}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── Promo Banner ── */}
      <div className="ss-promo">
        <div className="ss-promo-inner">
          <div>
            <h2>Start shopping today</h2>
            <p>Create a free account and unlock exclusive member deals, fast checkout, and order tracking.</p>
          </div>
          <Link to="/register" className="ss-promo-btn">Get Started →</Link>
        </div>
      </div>
    </div>
  );
}

// ── SVG Icons (no emoji in critical UI) ──
function TrustItem({ icon, text }) {
  return (
    <div className="ss-trust-item">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function TruckIcon() {
  return <svg width="20" height="20" fill="none" stroke="#e94560" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
function LockIcon() {
  return <svg width="20" height="20" fill="none" stroke="#e94560" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
}
function ReturnIcon() {
  return <svg width="20" height="20" fill="none" stroke="#e94560" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>;
}
function SupportIcon() {
  return <svg width="20" height="20" fill="none" stroke="#e94560" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.06 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>;
}
function HeartIcon() {
  return <svg width="16" height="16" fill="none" stroke="#e94560" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>;
}
function CartPlusIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>;
}

function getCatEmoji(name = '') {
  const n = name.toLowerCase();
  if (n.includes('electron')) return '📱';
  if (n.includes('cloth') || n.includes('fashion')) return '👕';
  if (n.includes('book')) return '📚';
  if (n.includes('home') || n.includes('kitchen')) return '🏠';
  if (n.includes('shoe')) return '👟';
  if (n.includes('beauty')) return '💄';
  if (n.includes('sport')) return '⚽';
  if (n.includes('food')) return '🛒';
  return '🏷️';
}
