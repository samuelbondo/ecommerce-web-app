import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState('default');
  const [priceMax, setPriceMax] = useState('');
  const selectedCat = searchParams.get('cat') || '';
  const { formatPrice, settings } = useSettings();
  const { addToCart } = useCart();
  const [added, setAdded] = useState({});
  const accent = settings.accent_color || '#e94560';

  useEffect(() => {
    Promise.all([API.get('/products'), API.get('/categories')]).then(([p, c]) => {
      setProducts(p.data);
      setCategories(c.data);
    }).finally(() => setLoading(false));
  }, []);

  // Sync search input when ?q= param changes (e.g. from navbar)
  useEffect(() => { setSearch(searchParams.get('q') || ''); }, [searchParams]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addToCart(product);
    setAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1500);
  };

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const matchCat = selectedCat ? p.category_id === Number(selectedCat) : true;
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      const matchPrice = priceMax ? p.price <= Number(priceMax) : true;
      return matchCat && matchSearch && matchPrice;
    });
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'newest') list = [...list].sort((a, b) => b.id - a.id);
    return list;
  }, [products, selectedCat, search, priceMax, sort]);

  const maxPrice = products.length ? Math.max(...products.map(p => p.price)) : 0;

  return (
    <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
      <style>{`
        .pd-card { background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #f1f5f9; transition: all 0.22s; text-decoration: none; color: inherit; display: flex; flex-direction: column; }
        .pd-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); border-color: #e5e7eb; }
        .pd-img-wrap { position: relative; overflow: hidden; background: #f8f9fb; }
        .pd-img-wrap img { width: 100%; height: 220px; object-fit: cover; transition: transform 0.4s; display: block; }
        .pd-card:hover .pd-img-wrap img { transform: scale(1.05); }
        .pd-badge { position: absolute; top: 10px; left: 10px; padding: 3px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
        .pd-atc { position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 14px; background: ${accent}; color: #fff; border: none; font-weight: 700; font-size: 0.85rem; cursor: pointer; transform: translateY(100%); transition: transform 0.22s; }
        .pd-card:hover .pd-atc { transform: translateY(0); }
        .pd-atc.added { background: #10b981; }
        .pd-body { padding: 14px 16px 18px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .pd-cat { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .pd-name { font-size: 0.92rem; font-weight: 700; color: #1a1a2e; line-height: 1.4; }
        .pd-price { font-size: 1.05rem; font-weight: 800; color: ${accent}; margin-top: auto; }
        .pd-stock-out { font-size: 0.72rem; color: #ef4444; font-weight: 600; }
        .pd-stock-low { font-size: 0.72rem; color: #f59e0b; font-weight: 600; }
        .cat-pill { padding: 7px 16px; border-radius: 20px; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; font-size: 0.82rem; font-weight: 600; color: #555; transition: all 0.15s; white-space: nowrap; }
        .cat-pill:hover { border-color: ${accent}; color: ${accent}; }
        .cat-pill.active { background: ${accent}; color: #fff; border-color: ${accent}; }
        .pd-search { padding: 10px 16px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 0.9rem; outline: none; transition: border-color 0.15s; background: #fff; }
        .pd-search:focus { border-color: ${accent}; }
        .pd-select { padding: 9px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; background: #fff; cursor: pointer; color: #374151; }
        @media(max-width:600px) { .pd-grid { grid-template-columns: 1fr 1fr !important; } .pd-img-wrap img { height: 160px !important; } }
        @media(max-width:400px) { .pd-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Page Header */}
      <div style={{ background: '#1a1a2e', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px' }}>
            {search ? `Search: "${search}"` : selectedCat ? categories.find(c => c.id === Number(selectedCat))?.name || 'Products' : 'All Products'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
            {loading ? '...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
          <button className={`cat-pill${!selectedCat ? ' active' : ''}`} onClick={() => setSearchParams({})}>All</button>
          {categories.map(c => (
            <button key={c.id} className={`cat-pill${selectedCat === String(c.id) ? ' active' : ''}`}
              onClick={() => setSearchParams({ cat: c.id })}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="15" height="15" fill="none" stroke="#1a1a2e" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="pd-search" style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
              placeholder="Search products..." value={search}
              onChange={e => {
                setSearch(e.target.value);
                setSearchParams(prev => {
                  const next = new URLSearchParams(prev);
                  if (e.target.value) next.set('q', e.target.value); else next.delete('q');
                  return next;
                }, { replace: true });
              }} />
          </div>
          <select className="pd-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="default">Sort: Default</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name A–Z</option>
          </select>
          {maxPrice > 0 && (
            <input className="pd-select" type="number" placeholder={`Max price (${formatPrice(maxPrice)})`}
              value={priceMax} onChange={e => setPriceMax(e.target.value)}
              style={{ width: 180 }} />
          )}
          {(search || selectedCat || priceMax || searchParams.get('q')) && (
            <button onClick={() => { setSearch(''); setPriceMax(''); setSearchParams(p => { const n = new URLSearchParams(p); n.delete('q'); n.delete('cat'); return n; }); }}
              style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
                <div style={{ height: 220, background: 'linear-gradient(90deg,#f1f5f9 25%,#e9eff5 50%,#f1f5f9 75%)', backgroundSize: '200% 100%' }} />
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, width: '60%' }} />
                  <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6 }} />
                  <div style={{ height: 18, background: '#f1f5f9', borderRadius: 6, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <h3 style={{ color: '#1a1a2e', marginBottom: 8 }}>No products found</h3>
            <p style={{ color: '#94a3b8' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="pd-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {filtered.map(p => (
              <Link to={`/products/${p.id}`} key={p.id} className="pd-card">
                <div className="pd-img-wrap">
                  <img src={p.image_url} alt={p.name}
                    onError={e => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }} />
                  {p.stock === 0 && <span className="pd-badge" style={{ background: '#fee2e2', color: '#ef4444' }}>Out of Stock</span>}
                  {p.stock > 0 && p.stock <= 5 && <span className="pd-badge" style={{ background: '#fef3c7', color: '#d97706' }}>Only {p.stock} left</span>}
                  <button className={`pd-atc${added[p.id] ? ' added' : ''}`}
                    onClick={e => p.stock > 0 && handleAddToCart(e, p)}
                    style={{ cursor: p.stock === 0 ? 'not-allowed' : 'pointer', opacity: p.stock === 0 ? 0.6 : 1 }}>
                    {added[p.id] ? '✓ Added!' : p.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
                  </button>
                </div>
                <div className="pd-body">
                  {p.category && <span className="pd-cat">{p.category}</span>}
                  <div className="pd-name">{p.name}</div>
                  <div className="pd-price">{formatPrice(p.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
