import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function HeroCarousel() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    API.get('/banners').then(r => {
      setBanners(r.data);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [banners.length, paused, next]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  if (!loaded) return <div style={s.skeleton} />;
  if (!banners.length) return <FallbackHero />;

  const banner = banners[current];

  return (
    <section
      style={s.hero}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .hero-text-anim { animation: fadeIn 0.6s ease forwards; }
        .hero-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 3; }
        .hero-arrow:hover { background: rgba(255,255,255,0.25); transform: translateY(-50%) scale(1.08); }
        .hero-arrow-left { left: 20px; }
        .hero-arrow-right { right: 20px; }
        .hero-dot { width: 8px; height: 8px; border-radius: 50%; border: none; cursor: pointer; transition: all 0.3s; background: rgba(255,255,255,0.4); }
        .hero-dot.active { background: #fff; width: 24px; border-radius: 4px; }
        @media (max-width: 640px) {
          .hero-arrow { display: none; }
        }
      `}</style>

      {/* Background image with smooth crossfade */}
      {banners.map((b, i) => (
        <div key={b.id} style={{
          ...s.slide,
          opacity: i === current ? 1 : 0,
          transition: 'opacity 0.8s cubic-bezier(0.4,0,0.2,1)',
          backgroundImage: `url(${b.image_url})`,
        }} />
      ))}

      {/* Overlay */}
      <div style={{
        ...s.overlay,
        background: `linear-gradient(to right, rgba(0,0,0,${banner.overlay_opacity}) 0%, rgba(0,0,0,${banner.overlay_opacity * 0.5}) 60%, rgba(0,0,0,0.1) 100%)`,
      }} />

      {/* Content */}
      <div style={s.content} key={current} className="hero-text-anim">
        <div style={s.badge}>New Collection</div>
        <h1 style={s.title}>{banner.title || 'New Season. New Deals.'}</h1>
        <p style={s.subtitle}>{banner.subtitle || 'Shop the latest products at unbeatable prices.'}</p>
        <div style={s.ctaRow}>
          <Link to={banner.cta_link || '/products'} style={s.btnPrimary}>
            {banner.cta_text || 'Shop Now'}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link to="/register" style={s.btnSecondary}>Create Account</Link>
        </div>
      </div>

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button className="hero-arrow hero-arrow-left" onClick={prev} aria-label="Previous">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button className="hero-arrow hero-arrow-right" onClick={next} aria-label="Next">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div style={s.dots}>
          {banners.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {banners.length > 1 && !paused && (
        <div style={s.progressBar}>
          <div key={current} style={s.progressFill} />
        </div>
      )}
    </section>
  );
}

function FallbackHero() {
  return (
    <section style={{ ...s.hero, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <div style={s.overlay} />
      <div style={s.content}>
        <div style={s.badge}>Welcome</div>
        <h1 style={s.title}>Quality Products.<br />Unbeatable Prices.</h1>
        <p style={s.subtitle}>Discover thousands of products delivered to your door.</p>
        <div style={s.ctaRow}>
          <Link to="/products" style={s.btnPrimary}>
            Shop Now
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

const s = {
  hero: {
    position: 'relative',
    height: 'clamp(420px, 60vh, 640px)',
    overflow: 'hidden',
    background: '#0f172a',
  },
  skeleton: {
    height: 'clamp(420px, 60vh, 640px)',
    background: 'linear-gradient(90deg, #1e293b 25%, #0f172a 50%, #1e293b 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.6s infinite',
  },
  slide: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
  },
  content: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 'clamp(24px, 6vw, 80px)',
    maxWidth: '680px',
  },
  badge: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    background: 'rgba(233,69,96,0.85)',
    color: '#fff',
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '16px',
  },
  title: {
    fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)',
    fontWeight: '800',
    color: '#fff',
    lineHeight: 1.15,
    marginBottom: '16px',
    textShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.7,
    marginBottom: '32px',
    maxWidth: '480px',
  },
  ctaRow: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#e94560',
    color: '#fff',
    padding: '13px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    boxShadow: '0 4px 20px rgba(233,69,96,0.4)',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    padding: '13px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    border: '1px solid rgba(255,255,255,0.25)',
    transition: 'all 0.2s',
  },
  dots: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    zIndex: 3,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'rgba(255,255,255,0.15)',
    zIndex: 3,
  },
  progressFill: {
    height: '100%',
    background: '#e94560',
    animation: 'progress 5s linear forwards',
    width: '0%',
  },
};
