import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import API from '../api';

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useSettings();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: user?.email || '', phone: '', address: '', city: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    if (!form.phone.trim() || !/^\+?[\d\s\-]{7,15}$/.test(form.phone)) e.phone = 'Valid phone number is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const items = cart.map((i) => ({ product_id: i.id, quantity: i.quantity, price: i.price }));
      const res = await API.post('/orders', { user_id: user.id, items });
      clearCart();
      navigate('/order-confirmation', { state: { orderId: res.data.orderId, form, total } });
    } catch (err) {
      alert('Order failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) {
    navigate('/cart');
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <h2 style={styles.heading}>Checkout</h2>
        <form onSubmit={handleSubmit} noValidate>
          <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
          <Field label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
          <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+250 7XX XXX XXX" />
          <Field label="Street Address" name="address" value={form.address} onChange={handleChange} error={errors.address} />
          <Field label="City" name="city" value={form.city} onChange={handleChange} error={errors.city} />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Placing Order...' : '✅ Place Order'}
          </button>
        </form>
      </div>

      <div style={styles.right}>
        <h3 style={styles.summaryTitle}>Order Summary</h3>
        {cart.map((item) => (
          <div key={item.id} style={styles.summaryItem}>
            <span style={styles.summaryName}>{item.name} × {item.quantity}</span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div style={styles.divider} />
        <div style={styles.summaryTotal}>
          <span>Total</span>
          <span style={styles.totalAmt}>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, error, placeholder }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={fStyles.label}>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || ''}
        style={{ ...fStyles.input, ...(error ? fStyles.inputErr : {}) }}
      />
      {error && <p style={fStyles.err}>{error}</p>}
    </div>
  );
}

const styles = {
  page: { display: 'flex', gap: '32px', maxWidth: '960px', margin: '0 auto', padding: '32px 24px', flexWrap: 'wrap' },
  left: { flex: '1 1 400px' },
  right: { flex: '0 1 300px', background: '#f9f9f9', borderRadius: '12px', padding: '24px', height: 'fit-content', border: '1px solid #e5e7eb' },
  heading: { marginBottom: '24px' },
  btn: { width: '100%', padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', marginTop: '8px' },
  summaryTitle: { marginBottom: '16px', fontSize: '1.1rem' },
  summaryItem: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' },
  summaryName: { color: '#555', flex: 1, marginRight: '8px' },
  divider: { height: '1px', background: '#e5e7eb', margin: '16px 0' },
  summaryTotal: { display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1rem' },
  totalAmt: { color: '#e94560' },
};

const fStyles = {
  label: { display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' },
  inputErr: { borderColor: '#e94560' },
  err: { color: '#e94560', fontSize: '0.8rem', margin: '4px 0 0' },
};
