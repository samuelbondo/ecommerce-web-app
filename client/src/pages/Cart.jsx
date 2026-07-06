import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useSettings();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) return navigate('/login?redirect=/checkout');
    navigate('/checkout');
  };

  if (!cart.length) return (
    <div style={styles.empty}>
      <p>Your cart is empty.</p>
      <button onClick={() => navigate('/products')} style={styles.shopBtn}>Browse Products</button>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2>Your Cart</h2>
      {cart.map((item) => (
        <div key={item._key} style={styles.item}>
          <img src={item.image_url} alt={item.name} style={styles.img} onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=?'; }} />
          <div style={styles.info}>
            <h3 style={styles.name}>{item.name}</h3>
            {item.variant_name && <p style={{ fontSize: '0.78rem', color: '#e94560', fontWeight: 600, margin: '2px 0 0' }}>{item.variant_name}</p>}
            <p style={styles.price}>{formatPrice(item.price)}</p>
          </div>
          <div style={styles.qtyRow}>
            <button style={styles.qtyBtn} onClick={() => updateQuantity(item._key, item.quantity - 1)}>−</button>
            <span style={styles.qtyNum}>{item.quantity}</span>
            <button style={styles.qtyBtn} onClick={() => updateQuantity(item._key, item.quantity + 1)}>+</button>
          </div>
          <span style={styles.subtotal}>{formatPrice(item.price * item.quantity)}</span>
          <button onClick={() => removeFromCart(item._key)} style={styles.remove}>Remove</button>
        </div>
      ))}
      <div style={styles.footer}>
        <h3>Total: {formatPrice(total)}</h3>
        <button onClick={handleCheckout} style={styles.btn}>Proceed to Checkout →</button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px 16px', boxSizing: 'border-box' },
  item: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #eee', padding: '14px 0', flexWrap: 'wrap' },
  img: { width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
  info: { flex: 1, minWidth: '100px' },
  name: { margin: '0 0 4px', fontSize: '0.92rem' },
  price: { color: '#888', fontSize: '0.82rem', margin: 0 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  qtyBtn: { width: '30px', height: '30px', border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' },
  qtyNum: { minWidth: '22px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' },
  subtotal: { fontWeight: '600', color: '#1a1a2e', minWidth: '60px', textAlign: 'right', fontSize: '0.9rem' },
  remove: { background: '#e94560', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' },
  footer: { marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  btn: { padding: '11px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700' },
  empty: { textAlign: 'center', padding: '60px 16px' },
  shopBtn: { marginTop: '12px', padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};
