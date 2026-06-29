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
    if (!user) return navigate('/login');
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
        <div key={item.id} style={styles.item}>
          <img src={item.image_url} alt={item.name} style={styles.img} onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=?'; }} />
          <div style={styles.info}>
            <h3 style={styles.name}>{item.name}</h3>
            <p style={styles.price}>{formatPrice(item.price)}</p>
          </div>
          <div style={styles.qtyRow}>
            <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
            <span style={styles.qtyNum}>{item.quantity}</span>
            <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          </div>
          <span style={styles.subtotal}>{formatPrice(item.price * item.quantity)}</span>
          <button onClick={() => removeFromCart(item.id)} style={styles.remove}>Remove</button>
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
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px' },
  item: { display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #eee', padding: '14px 0', flexWrap: 'wrap' },
  img: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' },
  info: { flex: 1, minWidth: '120px' },
  name: { margin: '0 0 4px', fontSize: '0.95rem' },
  price: { color: '#888', fontSize: '0.85rem', margin: 0 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  qtyBtn: { width: '28px', height: '28px', border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
  qtyNum: { minWidth: '24px', textAlign: 'center', fontWeight: '600' },
  subtotal: { fontWeight: '600', color: '#1a1a2e', minWidth: '70px', textAlign: 'right' },
  remove: { background: '#e94560', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  footer: { marginTop: '24px', textAlign: 'right' },
  btn: { padding: '10px 28px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
  empty: { textAlign: 'center', padding: '60px 24px' },
  shopBtn: { marginTop: '12px', padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};
