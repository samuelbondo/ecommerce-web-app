import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useSettings } from '../context/SettingsContext';
import { fmtOrderId } from '../utils/formatOrderId';

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return navigate('/login');
    API.get(`/orders/${user.id}`)
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p style={{ padding: '40px 24px' }}>Loading orders...</p>;

  if (!orders.length) return (
    <div style={styles.empty}>
      <h2>No orders yet</h2>
      <p>You haven't placed any orders.</p>
      <button onClick={() => navigate('/products')} style={styles.shopBtn}>Start Shopping</button>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Orders</h2>
      <p style={styles.sub}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      {orders.map((order) => (
        <div key={order.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <span style={styles.orderId}>{fmtOrderId(order.id, order.created_at)}</span>
              <span style={styles.date}>{new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div style={styles.right}>
              <span style={{ ...styles.badge, background: STATUS_COLORS[order.status] || '#888' }}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <span style={styles.total}>{formatPrice(order.total)}</span>
            </div>
          </div>
          <div style={styles.divider} />
          <div style={styles.items}>
            {order.items.map((item) => (
              <div key={item.id} style={styles.item}>
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={styles.img}
                  onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=?'; }}
                />
                <div style={styles.itemInfo}>
                  <span style={styles.itemName}>{item.name}</span>
                  <span style={styles.itemQty}>Qty: {item.quantity}</span>
                </div>
                <span style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { maxWidth: '720px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box' },
  title: { fontSize: '1.5rem', marginBottom: '4px' },
  sub: { color: '#888', marginBottom: '24px', fontSize: '0.9rem' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', flexWrap: 'wrap', gap: '8px' },
  orderId: { fontWeight: '700', fontSize: '0.88rem', marginRight: '10px', fontFamily: 'monospace', letterSpacing: '0.5px' },
  date: { color: '#888', fontSize: '0.82rem' },
  right: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  badge: { color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  total: { fontWeight: '700', color: '#1a1a2e', fontSize: '0.95rem' },
  divider: { height: '1px', background: '#f0f0f0' },
  items: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  item: { display: 'flex', alignItems: 'center', gap: '12px' },
  img: { width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
  itemInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  itemName: { fontWeight: '500', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemQty: { color: '#888', fontSize: '0.8rem' },
  itemPrice: { fontWeight: '600', color: '#e94560', fontSize: '0.88rem', flexShrink: 0 },
  empty: { textAlign: 'center', padding: '60px 16px' },
  shopBtn: { marginTop: '16px', padding: '10px 28px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' },
};
