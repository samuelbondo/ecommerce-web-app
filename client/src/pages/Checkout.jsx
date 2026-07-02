import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import API from '../api';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

// PayPal supported currencies — if admin picks one of these, charge directly
const PAYPAL_SUPPORTED = [
  'AUD','BRL','CAD','CNY','CZK','DKK','EUR','HKD','HUF','ILS',
  'JPY','MYR','MXN','TWD','NZD','NOK','PHP','PLN','GBP','SGD',
  'SEK','CHF','THB','USD',
];

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { settings, formatPrice, paypalRate } = useSettings();
  const navigate = useNavigate();

  const currency = settings.currency || 'USD';
  const paypalCurrency = PAYPAL_SUPPORTED.includes(currency) ? currency : 'USD';
  const paypalAmount = paypalCurrency === currency
    ? total.toFixed(2)
    : (total / paypalRate).toFixed(2);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null); // id of picked address
  const [form, setForm] = useState({ fullName: user?.name || '', email: user?.email || '', phone: '', address: '', city: '' });
  const [errors, setErrors] = useState({});
  const [payMethod, setPayMethod] = useState('paypal');

  useEffect(() => {
    if (!user) return;
    API.get('/addresses').then(r => {
      setSavedAddresses(r.data);
      const def = r.data.find(a => a.is_default) || r.data[0];
      if (def) {
        setSelectedAddr(def.id);
        setForm(p => ({ ...p, fullName: def.name, phone: def.phone || p.phone, address: def.address, city: def.city }));
      }
    }).catch(() => {});
  }, [user]);
  const [formReady, setFormReady] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  const paypalRef = useRef(null);
  const buttonsRendered = useRef(false);
  const currentCurrencyRef = useRef(null);

  // Load / reload PayPal SDK when currency changes
  useEffect(() => {
    if (!settings.loaded && settings.currency === undefined) return;
    const existing = document.getElementById('paypal-sdk');
    if (existing) {
      // If currency changed, remove old script and re-load
      if (currentCurrencyRef.current === paypalCurrency) { setSdkReady(true); return; }
      existing.remove();
      setSdkReady(false);
    }
    currentCurrencyRef.current = paypalCurrency;
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${paypalCurrency}`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, [paypalCurrency]);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    return e;
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  useEffect(() => {
    setFormReady(Object.keys(validate()).length === 0);
  }, [form]);

  // Render PayPal buttons
  useEffect(() => {
    if (!sdkReady || !formReady || payMethod !== 'paypal') return;
    if (buttonsRendered.current) {
      if (paypalRef.current) paypalRef.current.innerHTML = '';
      buttonsRendered.current = false;
    }
    if (!paypalRef.current) return;

    buttonsRendered.current = true;
    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 48 },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: `${settings.site_name || 'Samuel Store'} — ${cart.length} item(s)`,
            amount: {
              currency_code: paypalCurrency,
              value: paypalAmount,
              breakdown: { item_total: { currency_code: paypalCurrency, value: paypalAmount } },
            },
            shipping: {
              name: { full_name: form.fullName },
              address: {
                address_line_1: form.address,
                admin_area_2: form.city,
                country_code: 'RW',
              },
            },
          }],
          application_context: {
            shipping_preference: 'SET_PROVIDED_ADDRESS',
            brand_name: settings.site_name || 'Samuel Store',
          },
        });
      },
      onApprove: async (data, actions) => {
        try {
          const details = await actions.order.capture();
          const items = cart.map(i => ({ product_id: i.product_id || i.id, variant_id: i.variant_id || null, quantity: i.quantity, price: i.price }));
          const res = await API.post('/orders', {
            user_id: user.id,
            items,
            payment_method: 'paypal',
            payment_status: 'paid',
            payment_id: details.id,
          });
          clearCart();
          navigate('/order-confirmation', {
            state: { orderId: res.data.orderId, form, total, paymentMethod: 'paypal', paymentId: details.id },
          });
        } catch {
          setPaypalError('Payment captured but order failed. Contact support.');
        }
      },
      onError: () => setPaypalError('PayPal payment failed. Please try again or use Cash on Delivery.'),
      onCancel: () => setPaypalError('Payment cancelled. You can try again or choose Cash on Delivery.'),
    }).render(paypalRef.current);
  }, [sdkReady, formReady, payMethod, paypalAmount, paypalCurrency]);

  const handleCOD = async () => {
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    try {
      const items = cart.map(i => ({ product_id: i.product_id || i.id, variant_id: i.variant_id || null, quantity: i.quantity, price: i.price }));
      const res = await API.post('/orders', {
        user_id: user.id,
        items,
        payment_method: 'cod',
        payment_status: 'pending',
      });
      clearCart();
      navigate('/order-confirmation', { state: { orderId: res.data.orderId, form, total, paymentMethod: 'cod' } });
    } catch {
      setErrors({ submit: 'Order failed. Please try again.' });
    }
  };

  if (!cart.length) { navigate('/cart'); return null; }

  const showConversion = paypalCurrency !== currency;

  return (
    <div style={s.page}>
      <style>{`
        .ck-method { display:flex; flex-direction:column; border:2px solid #e5e7eb; border-radius:12px; padding:16px 20px; cursor:pointer; transition:all 0.2s; background:#fff; }
        .ck-method.active { border-color:#e94560; background:#fff9fb; }
        .ck-method-hd { display:flex; align-items:center; justify-content:space-between; }
        .ck-method-label { display:flex; align-items:center; gap:10px; font-weight:600; font-size:0.95rem; color:#1a1a2e; }
        .ck-radio { width:18px; height:18px; border-radius:50%; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; }
        .ck-method.active .ck-radio { border-color:#e94560; }
        .ck-radio-dot { width:9px; height:9px; border-radius:50%; background:#e94560; display:none; }
        .ck-method.active .ck-radio-dot { display:block; }
        .ck-field label { display:block; font-size:0.82rem; font-weight:600; color:#374151; margin-bottom:5px; }
        .ck-field input { width:100%; padding:10px 13px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:0.93rem; outline:none; transition:border-color 0.15s; box-sizing:border-box; }
        .ck-field input:focus { border-color:#e94560; box-shadow:0 0 0 3px rgba(233,69,96,0.08); }
        .ck-field input.err { border-color:#ef4444; }
        .ck-err-msg { color:#ef4444; font-size:0.77rem; margin-top:3px; }
        .ck-cod-btn { width:100%; padding:14px; background:#1a1a2e; color:#fff; border:none; border-radius:10px; font-size:1rem; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .ck-cod-btn:hover { background:#0f172a; }
        .ck-not-ready { width:100%; padding:14px; background:#e5e7eb; color:#94a3b8; border:none; border-radius:10px; font-size:0.9rem; text-align:center; }
        @media(max-width:680px) { .ck-layout { flex-direction:column !important; } }
        @media(max-width:520px) {
          .ck-grid2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={s.inner} className="ck-layout">
        <div style={s.left}>
          <div style={s.breadcrumb}>
            <Link to="/cart" style={s.breadLink}>Cart</Link>
            <span style={s.breadSep}>›</span>
            <span style={s.breadCurrent}>Checkout</span>
          </div>
          <h1 style={s.heading}>Checkout</h1>

          <div style={s.block}>
            <h3 style={s.blockTitle}>Contact Information</h3>
            <div style={s.grid2} className="ck-grid2">
              <CkField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} placeholder="Samuel Bondo" />
              <CkField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" />
            </div>
            <CkField label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+250 7XX XXX XXX" />
          </div>

          <div style={s.block}>
            <h3 style={s.blockTitle}>Shipping Address</h3>
            {savedAddresses.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                {savedAddresses.map(a => (
                  <div key={a.id}
                    onClick={() => {
                      setSelectedAddr(a.id);
                      setForm(p => ({ ...p, fullName: a.name, phone: a.phone || p.phone, address: a.address, city: a.city }));
                    }}
                    style={{ ...s.addrOption, border: selectedAddr === a.id ? '2px solid #e94560' : '1.5px solid #e5e7eb', background: selectedAddr === a.id ? '#fff9fb' : '#fff' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e' }}>{a.label}</span>
                      {a.is_default ? <span style={s.defBadge}>Default</span> : null}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#555', marginTop: 2 }}>{a.name} · {a.phone}</div>
                    <div style={{ fontSize: '0.82rem', color: '#555' }}>{a.address}, {a.city}</div>
                  </div>
                ))}
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 6 }}>Or enter a different address below</div>
              </div>
            )}
            <CkField label="Street Address" name="address" value={form.address} onChange={handleChange} error={errors.address} placeholder="KK 508 ST" />
            <CkField label="City" name="city" value={form.city} onChange={handleChange} error={errors.city} placeholder="Kigali" />
          </div>

          <div style={s.block}>
            <h3 style={s.blockTitle}>Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* PayPal */}
              <div className={`ck-method${payMethod === 'paypal' ? ' active' : ''}`} onClick={() => setPayMethod('paypal')}>
                <div className="ck-method-hd">
                  <div className="ck-method-label">
                    <div className="ck-radio"><div className="ck-radio-dot" /></div>
                    <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" style={{ height: 24 }} />
                    <span>PayPal / Debit & Credit Card</span>
                  </div>
                  <span style={s.secureBadge}>🔒 Secure</span>
                </div>
                {payMethod === 'paypal' && (
                  <div style={{ marginTop: 16 }}>
                    <p style={s.paypalNote}>
                      {showConversion
                        ? <>Amount: <strong>{paypalCurrency} {paypalAmount}</strong> ≈ <strong>{formatPrice(total)}</strong></>
                        : <>Amount: <strong>{formatPrice(total)}</strong></>
                      }
                    </p>
                    {paypalError && <p style={s.paypalErr}>{paypalError}</p>}
                    {!formReady && (
                      <div className="ck-not-ready">
                        Complete your contact & shipping details above to activate PayPal
                      </div>
                    )}
                    <div ref={paypalRef} style={{ display: formReady ? 'block' : 'none' }} />
                  </div>
                )}
              </div>

              {/* Cash on Delivery */}
              <div className={`ck-method${payMethod === 'cod' ? ' active' : ''}`} onClick={() => setPayMethod('cod')}>
                <div className="ck-method-hd">
                  <div className="ck-method-label">
                    <div className="ck-radio"><div className="ck-radio-dot" /></div>
                    <span style={{ fontSize: '1.3rem' }}>💵</span>
                    <span>Cash on Delivery</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Pay when you receive</span>
                </div>
                {payMethod === 'cod' && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 14 }}>
                      Pay in cash when your order is delivered. Available in Kigali and surrounding areas.
                    </p>
                    {errors.submit && <p style={s.paypalErr}>{errors.submit}</p>}
                    <button className="ck-cod-btn" onClick={handleCOD}>
                      Place Order — {formatPrice(total)}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div style={s.right}>
          <h3 style={s.summaryTitle}>Order Summary</h3>
          <div style={s.summaryItems}>
            {cart.map(item => (
              <div key={item.id} style={s.summaryItem}>
                <div style={s.summaryItemLeft}>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={s.summaryImg}
                    onError={e => { e.target.src = 'https://placehold.co/48x48?text=?'; }}
                  />
                  <div>
                    <div style={s.summaryName}>{item.name}</div>
                    <div style={s.summaryQty}>Qty: {item.quantity}</div>
                  </div>
                </div>
                <span style={s.summaryPrice}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div style={s.divider} />
          <div style={s.summaryRow}><span>Subtotal</span><span>{formatPrice(total)}</span></div>
          <div style={s.summaryRow}><span>Shipping</span><span style={{ color: '#16a34a' }}>Free</span></div>
          <div style={s.divider} />
          <div style={{ ...s.summaryRow, fontWeight: 800, fontSize: '1.05rem' }}>
            <span>Total</span>
            <span style={{ color: '#e94560' }}>{formatPrice(total)}</span>
          </div>
          {payMethod === 'paypal' && showConversion && (
            <div style={s.usdNote}>≈ {paypalCurrency} {paypalAmount} charged via PayPal</div>
          )}
          <div style={s.secureNote}>
            <svg width="13" height="13" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Secure SSL encrypted checkout
          </div>
        </div>
      </div>
    </div>
  );
}

function CkField({ label, name, type = 'text', value, onChange, error, placeholder }) {
  return (
    <div className="ck-field" style={{ marginBottom: 14 }}>
      <label>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className={error ? 'err' : ''} />
      {error && <div className="ck-err-msg">{error}</div>}
    </div>
  );
}

const s = {
  page: { background: '#f8f9fb', minHeight: '100vh', padding: '24px 16px', boxSizing: 'border-box' },
  inner: { maxWidth: '1020px', margin: '0 auto', display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' },
  left: { flex: '1 1 300px', minWidth: 0 },
  right: { flex: '0 1 300px', width: '100%', background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: '0.85rem' },
  breadLink: { color: '#e94560', textDecoration: 'none', fontWeight: 600 },
  breadSep: { color: '#94a3b8' },
  breadCurrent: { color: '#1a1a2e', fontWeight: 600 },
  heading: { fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 24 },
  block: { background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: 16, border: '1px solid #e5e7eb' },
  blockTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 0 },
  secureBadge: { fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 },
  paypalNote: { fontSize: '0.85rem', color: '#64748b', marginBottom: 12 },
  paypalErr: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: '0.83rem', marginBottom: 12 },
  summaryTitle: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 16 },
  summaryItems: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 4 },
  summaryItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  summaryItemLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  summaryImg: { width: 46, height: 46, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', flexShrink: 0 },
  summaryName: { fontSize: '0.86rem', fontWeight: 600, color: '#1a1a2e' },
  summaryQty: { fontSize: '0.75rem', color: '#94a3b8' },
  summaryPrice: { fontSize: '0.88rem', fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap' },
  divider: { height: 1, background: '#f1f5f9', margin: '14px 0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 8, color: '#374151' },
  usdNote: { fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', marginTop: 10 },
  secureNote: { display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: '0.76rem', color: '#16a34a', marginTop: 14 },
  addrOption: { borderRadius: 10, padding: '10px 14px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' },
  defBadge: { background: '#e94560', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700 },
};
