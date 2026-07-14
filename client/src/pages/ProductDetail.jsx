import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const Stars = ({ rating, interactive = false, onSet }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={interactive ? 24 : 14} height={interactive ? 24 : 14}
        viewBox="0 0 24 24"
        fill={i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}
        style={{ cursor: interactive ? 'pointer' : 'default', transition: 'fill 0.1s' }}
        onClick={() => interactive && onSet(i)}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ))}
  </span>
);

const avgRating = (reviews) => reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { formatPrice, settings } = useSettings();
  const accent = settings.accent_color || '#e94560';

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [added, setAdded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeVariant, setActiveVariant] = useState(null);

  useEffect(() => {
    setProduct(null); setReviews([]); setRelated([]); setQty(1); setAdded(false); setTab('description');
    setActiveImg(null); setSelectedOptions({}); setActiveVariant(null);
    Promise.all([
      API.get(`/products/${id}`),
      API.get(`/products/${id}/reviews`).catch(() => ({ data: [] })),
    ]).then(([p, r]) => {
      setProduct(p.data);
      setReviews(r.data);
      // Fetch AI review summary if there are reviews
      if (r.data.length >= 2) {
        setSummaryLoading(true);
        API.post('/ai/review-summary', { product_id: id })
          .then(s => setAiSummary(s.data.summary || ''))
          .catch(() => {})
          .finally(() => setSummaryLoading(false));
      }
      API.get('/products').then(all => {
        setRelated(all.data.filter(x => x.category_id === p.data.category_id && x.id !== p.data.id).slice(0, 4));
      }).catch(() => {});
    }).catch(() => setProduct({}));
  }, [id]);

  // Resolve matching variant from selected options
  const resolveVariant = (opts, variants) => {
    if (!variants?.length || !Object.keys(opts).length) return null;
    const combo = Object.values(opts).join(' / ');
    return variants.find(v => v.combination === combo) || null;
  };

  const handleOptionSelect = (optionName, value) => {
    const newOpts = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOpts);
    const v = resolveVariant(newOpts, product?.variants);
    setActiveVariant(v);
    if (v?.image_url) setActiveImg(v.image_url);
    else if (!v) setActiveImg(product?.image_url || null);
  };

  const handleThumbnailClick = (imgUrl) => {
    setActiveImg(imgUrl);
    // find a variant whose image matches and auto-select it
    const matched = product?.variants?.find(v => v.image_url === imgUrl);
    if (matched) {
      const parts = matched.combination.split(' / ');
      const newOpts = {};
      product.options?.forEach((opt, i) => { if (parts[i]) newOpts[opt.name] = parts[i]; });
      setSelectedOptions(newOpts);
      setActiveVariant(matched);
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product, activeVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addToCart(product, activeVariant);
    if (!user) { navigate('/login?redirect=/checkout'); return; }
    navigate('/checkout');
  };

  const handleReview = async () => {
    if (!rating) return setReviewMsg({ type: 'error', text: 'Please select a rating' });
    if (!comment.trim()) return setReviewMsg({ type: 'error', text: 'Please write a comment' });
    setSubmitting(true);
    try {
      await API.post(`/products/${id}/reviews`, { rating, comment });
      setReviewMsg({ type: 'success', text: 'Review submitted! It will appear after admin approval.' });
      setRating(0); setComment('');
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.error || 'Failed to submit review' });
    }
    setSubmitting(false);
  };

  if (!product) return (
    <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ width: 440, height: 440, borderRadius: 16, background: '#f1f5f9', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[80, 40, 60, 100, 200].map((w, i) => (
              <div key={i} style={{ height: i === 4 ? 80 : 20, width: `${w}%`, background: '#f1f5f9', borderRadius: 8 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!product.id) return (
    <div style={{ background: '#f8f9fb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
        <h2 style={{ color: '#1a1a2e', marginBottom: 8 }}>Product not found</h2>
        <Link to="/products" style={{ color: accent, fontWeight: 700 }}>← Back to Products</Link>
      </div>
    </div>
  );

  const avg = avgRating(reviews);
  const activeStock = activeVariant?.stock ?? product.stock;
  const inStock = activeStock > 0;

  // Price range across all variants (shown before selection)
  const variantPrices = product.variants?.map(v => Number(v.price)).filter(p => p > 0) || [];
  const minPrice = variantPrices.length ? Math.min(...variantPrices) : Number(product.price);
  const maxPrice = variantPrices.length ? Math.max(...variantPrices) : Number(product.price);
  const showRange = !activeVariant && variantPrices.length > 0 && minPrice !== maxPrice;
  const displayPrice = activeVariant?.price ? Number(activeVariant.price) : Number(product.price);

  // All gallery thumbnails: product images + variant images (deduped)
  const variantImages = product.variants?.filter(v => v.image_url).map(v => ({ url: v.image_url, variantId: v.id, combination: v.combination })) || [];
  const galleryImages = [
    { url: product.image_url, isPrimary: true },
    ...(product.images || []).map(i => ({ url: i.url })),
    ...variantImages,
  ].filter((img, i, arr) => img.url && arr.findIndex(x => x.url === img.url) === i);

  // Check if a specific option value is available (has stock)
  const isValueAvailable = (optName, val) => {
    if (!product.variants?.length) return true;
    return product.variants.some(v => {
      const parts = v.combination.split(' / ');
      const optIdx = product.options?.findIndex(o => o.name === optName) ?? -1;
      if (parts[optIdx] !== val) return false;
      // check other already-selected options match
      const otherMatch = product.options?.every((o, i) => {
        if (o.name === optName) return true;
        return !selectedOptions[o.name] || parts[i] === selectedOptions[o.name];
      });
      return otherMatch && (v.stock === null || v.stock === undefined || v.stock > 0);
    });
  };

  return (
    <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
      <style>{`
        .pd-tab { padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #94a3b8; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .pd-tab.active { color: ${accent}; border-bottom-color: ${accent}; }
        .pd-tab:hover { color: ${accent}; }
        .rel-card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #f1f5f9; text-decoration: none; color: inherit; transition: all 0.2s; display: block; }
        .rel-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.09); }
        .rel-card img { width: 100%; height: 160px; object-fit: cover; display: block; }
        .qty-btn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid #e5e7eb; background: #fff; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .qty-btn:hover:not(:disabled) { border-color: ${accent}; color: ${accent}; }
        .qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @media(max-width:700px) { .pd-main { flex-direction: column !important; } .pd-img-main { width: 100% !important; } }
        @media(max-width:480px) { .pd-tab { padding: 10px 12px; font-size: 0.82rem; } }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#94a3b8', marginBottom: 24 }}>
          <Link to="/" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>›</span>
          <Link to="/products" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Products</Link>
          <span>›</span>
          {product.category && <><Link to={`/products?cat=${product.category_id}`} style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>{product.category}</Link><span>›</span></>}
          <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* Main Section */}
        <div className="pd-main" style={{ display: 'flex', gap: 40, alignItems: 'flex-start', marginBottom: 40 }}>

          {/* Image Gallery */}
          <div className="pd-img-main" style={{ width: 440, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9', aspectRatio: '1/1', position: 'relative' }}>
              <img src={activeImg || product.image_url} alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }}
                onError={e => { e.target.src = 'https://placehold.co/440x440?text=No+Image'; }} />
              {activeVariant && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(26,26,46,0.82)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                  {activeVariant.combination}
                </div>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {galleryImages.map((img, i) => {
                  const isActive = (activeImg || product.image_url) === img.url;
                  const matchedVariant = product.variants?.find(v => v.image_url === img.url);
                  return (
                    <div key={i} onClick={() => handleThumbnailClick(img.url)} title={matchedVariant?.combination || ''}
                      style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                        border: `2px solid ${isActive ? accent : '#e5e7eb'}`,
                        boxShadow: isActive ? `0 0 0 2px ${accent}33` : 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s', position: 'relative' }}>
                      <img src={img.url} alt={`view ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.src = 'https://placehold.co/64x64?text=?'; }} />
                      {matchedVariant && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.5rem', fontWeight: 700, textAlign: 'center', padding: '2px 0', lineHeight: 1.4 }}>
                          {matchedVariant.combination.split(' / ')[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {product.category && (
              <Link to={`/products?cat=${product.category_id}`} style={{ fontSize: '0.75rem', fontWeight: 700, color: accent, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {product.category}
              </Link>
            )}
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1a1a2e', margin: '8px 0 12px', lineHeight: 1.3 }}>
              {product.name}
            </h1>

            {/* Rating summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Stars rating={avg} />
              <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                {reviews.length > 0 ? <><strong>{avg.toFixed(1)}</strong> ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</> : 'No reviews yet'}
              </span>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 4 }}>
              {showRange ? (
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: accent }}>
                  {formatPrice(minPrice)} <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>— {formatPrice(maxPrice)}</span>
                </div>
              ) : (
                <div style={{ fontSize: '2rem', fontWeight: 900, color: accent }}>
                  {formatPrice(displayPrice)}
                </div>
              )}
              {activeVariant?.price && Number(activeVariant.price) !== Number(product.price) && (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>Base: {formatPrice(product.price)}</div>
              )}
              {showRange && (
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>Select a variant to see exact price</div>
              )}
            </div>

            {/* Variant selectors */}
            {product.options?.length > 0 && (
              <div style={{ margin: '16px 0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {product.options.map(opt => {
                  const values = [...new Set(product.variants?.map(v => v.combination.split(' / ')[product.options.indexOf(opt)]).filter(Boolean))];
                  const isColor = /color|colour/i.test(opt.name);
                  return (
                    <div key={opt.id}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>
                        {opt.name}:
                        {selectedOptions[opt.name]
                          ? <span style={{ color: accent, marginLeft: 6 }}>{selectedOptions[opt.name]}</span>
                          : <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>Select {opt.name}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {values.map(val => {
                          const selected = selectedOptions[opt.name] === val;
                          const available = isValueAvailable(opt.name, val);
                          const variantImg = isColor && product.variants?.find(v => v.combination.includes(val))?.image_url;

                          if (isColor && variantImg) {
                            return (
                              <div key={val} onClick={() => available && handleOptionSelect(opt.name, val)} title={available ? val : `${val} — Out of stock`}
                                style={{ position: 'relative', width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                                  cursor: available ? 'pointer' : 'not-allowed',
                                  border: `3px solid ${selected ? accent : available ? '#e5e7eb' : '#f1f5f9'}`,
                                  boxShadow: selected ? `0 0 0 2px ${accent}44` : 'none',
                                  opacity: available ? 1 : 0.4,
                                  transition: 'all 0.15s' }}>
                                <img src={variantImg} alt={val} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {!available && (
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)' }}>
                                    <div style={{ width: '70%', height: 2, background: '#ef4444', transform: 'rotate(-45deg)', borderRadius: 2 }} />
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <button key={val} onClick={() => available && handleOptionSelect(opt.name, val)}
                              disabled={!available}
                              style={{ padding: '7px 18px', borderRadius: 8,
                                border: `2px solid ${selected ? accent : available ? '#e5e7eb' : '#f1f5f9'}`,
                                background: selected ? accent + '15' : available ? '#fff' : '#fafafa',
                                color: selected ? accent : available ? '#374151' : '#cbd5e1',
                                fontWeight: selected ? 700 : 500, fontSize: '0.85rem',
                                cursor: available ? 'pointer' : 'not-allowed',
                                textDecoration: available ? 'none' : 'line-through',
                                transition: 'all 0.15s' }}>
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {activeVariant?.sku && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>SKU: {activeVariant.sku}</div>
                )}
              </div>
            )}

            {/* Stock status */}
            {(() => {
              const stock = activeVariant?.stock ?? product.stock;
              return (
                <div style={{ marginBottom: 20 }}>
                  {stock === 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#fee2e2', color: '#ef4444', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>✕ Out of Stock</span>
                  ) : stock <= 5 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#fef3c7', color: '#d97706', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>⚡ Only {stock} left</span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>✓ In Stock ({stock} available)</span>
                  )}
                </div>
              );
            })()}

            {/* Quantity */}
            {inStock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8f9fb', borderRadius: 10, padding: '4px 8px', border: '1.5px solid #e5e7eb' }}>
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                  <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(q => Math.min(activeStock, q + 1))} disabled={qty >= activeStock}>+</button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <button onClick={handleAddToCart} disabled={!inStock}
                style={{ flex: '1 1 160px', padding: '14px 24px', background: added ? '#10b981' : (inStock ? accent : '#cbd5e1'), color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '0.95rem', cursor: inStock ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                {added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
              </button>
              <button onClick={handleBuyNow} disabled={!inStock}
                style={{ flex: '1 1 140px', padding: '14px 24px', background: inStock ? '#1a1a2e' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '0.95rem', cursor: inStock ? 'pointer' : 'not-allowed' }}>
                Buy Now
              </button>
            </div>

            {/* Meta */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {product.category && <MetaRow label="Category" value={product.category} />}
              <MetaRow label="Availability" value={inStock ? `In Stock` : 'Out of Stock'} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', marginBottom: 40, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 20px' }}>
            <button className={`pd-tab${tab === 'description' ? ' active' : ''}`} onClick={() => setTab('description')}>Description</button>
            <button className={`pd-tab${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </button>
          </div>

          <div style={{ padding: '16px' }}>
            {tab === 'description' && (
              <div style={{ color: '#374151', lineHeight: 1.8, fontSize: '0.95rem' }}>
                {activeVariant?.description && (
                  <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, borderLeft: `3px solid #16a34a`, fontSize: '0.9rem' }}>
                    <strong style={{ color: '#16a34a' }}>{activeVariant.combination}:</strong> {activeVariant.description}
                  </div>
                )}
                {product.description || <span style={{ color: '#94a3b8' }}>No description provided for this product.</span>}
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                {/* Summary */}
                {reviews.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '12px', background: '#f8f9fb', borderRadius: 12, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>{avg.toFixed(1)}</div>
                      <Stars rating={avg} />
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>{reviews.length} reviews</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5,4,3,2,1].map(s => {
                        const count = reviews.filter(r => r.rating === s).length;
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', width: 8 }}>{s}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', width: 16 }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {summaryLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#eff6ff', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', color: '#1d4ed8' }}>
                    ⏳ Generating AI summary...
                  </div>
                )}
                {aiSummary && !summaryLoading && (
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', borderRadius: 12, marginBottom: 20, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>🤖 AI Review Summary</div>
                    <p style={{ fontSize: '0.88rem', color: '#374151', margin: 0, lineHeight: 1.65 }}>{aiSummary}</p>
                  </div>
                )}

                {/* Review List */}
                {reviews.length === 0 && <p style={{ color: '#94a3b8', marginBottom: 28 }}>No reviews yet. Be the first to review this product!</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ background: '#f8f9fb', borderRadius: 12, padding: '16px 20px', border: r.status === 'pending' ? '1.5px dashed #f59e0b' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>{r.customer}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                            <Stars rating={r.rating} />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                            {r.status === 'pending' && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: 10 }}>⏳ Pending approval</span>}
                          </div>
                        </div>
                      </div>
                      <p style={{ color: '#374151', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{r.comment}</p>
                      {r.admin_reply && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, borderLeft: `3px solid #3b82f6` }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>Store Reply</div>
                          <p style={{ color: '#374151', fontSize: '0.85rem', margin: 0 }}>{r.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Write Review */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Write a Review</h4>
                  {!user ? (
                    <div style={{ background: '#f8f9fb', borderRadius: 10, padding: '16px 20px', color: '#64748b', fontSize: '0.88rem' }}>
                      <Link to="/login" style={{ color: accent, fontWeight: 700 }}>Login</Link> or <Link to="/register" style={{ color: accent, fontWeight: 700 }}>Register</Link> to write a review.
                    </div>
                  ) : reviews.some(r => r.customer === user.name) ? (
                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 18px', color: '#16a34a', fontSize: '0.88rem', fontWeight: 600 }}>
                      ✓ You have already reviewed this product.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Your Rating *</div>
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          {[1,2,3,4,5].map(i => (
                            <svg key={i} width="28" height="28" viewBox="0 0 24 24"
                              fill={i <= (hoverRating || rating) ? '#f59e0b' : '#e5e7eb'}
                              style={{ cursor: 'pointer', transition: 'fill 0.1s' }}
                              onMouseEnter={() => setHoverRating(i)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRating(i)}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Review *</div>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
                          placeholder="Share your experience with this product..."
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      </div>
                      {reviewMsg && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: reviewMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: reviewMsg.type === 'success' ? '#16a34a' : '#dc2626', fontSize: '0.85rem' }}>
                          {reviewMsg.text}
                        </div>
                      )}
                      <button onClick={handleReview} disabled={submitting}
                        style={{ alignSelf: 'flex-start', padding: '11px 28px', background: accent, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: submitting ? 'wait' : 'pointer' }}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Reviews are published after admin approval.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 20 }}>Related Products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
              {related.map(p => (
                <Link to={`/products/${p.id}`} key={p.id} className="rel-card" onClick={() => window.scrollTo(0, 0)}>
                  <img src={p.image_url} alt={p.name} onError={e => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }} />
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{p.category}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e', marginBottom: 6, lineHeight: 1.4 }}>{p.name}</div>
                    <div style={{ fontWeight: 800, color: accent, fontSize: '0.95rem' }}>{formatPrice(p.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: '0.85rem' }}>
      <span style={{ color: '#94a3b8', minWidth: 90 }}>{label}:</span>
      <span style={{ color: '#374151', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
