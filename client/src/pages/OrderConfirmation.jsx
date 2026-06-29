import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function OrderConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useSettings();

  if (!state?.orderId) {
    navigate('/');
    return null;
  }

  const { orderId, form, total } = state;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>✅</div>
        <h2 style={styles.title}>Order Confirmed!</h2>
        <p style={styles.sub}>Thank you, <strong>{form.fullName}</strong>. Your order has been placed successfully.</p>
        <div style={styles.details}>
          <Row label="Order ID" value={`#${orderId}`} />
          <Row label="Email" value={form.email} />
          <Row label="Phone" value={form.phone} />
          <Row label="Delivery Address" value={`${form.address}, ${form.city}`} />
          <Row label="Total Paid" value={formatPrice(total)} highlight />
        </div>
        <div style={styles.actions}>
          <button onClick={() => navigate('/orders')} style={styles.btnPrimary}>View My Orders</button>
          <button onClick={() => navigate('/products')} style={styles.btnSecondary}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={rowStyles.row}>
      <span style={rowStyles.label}>{label}</span>
      <span style={{ ...rowStyles.value, ...(highlight ? rowStyles.highlight : {}) }}>{value}</span>
    </div>
  );
}

const styles = {
  page: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '48px 24px', minHeight: '70vh' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px 32px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  icon: { fontSize: '3rem', marginBottom: '12px' },
  title: { fontSize: '1.6rem', marginBottom: '8px', color: '#1a1a2e' },
  sub: { color: '#555', marginBottom: '28px' },
  details: { background: '#f9f9f9', borderRadius: '10px', padding: '20px', textAlign: 'left', marginBottom: '28px' },
  actions: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: { padding: '10px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' },
  btnSecondary: { padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' },
};

const rowStyles = {
  row: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', gap: '12px' },
  label: { color: '#888', fontSize: '0.85rem' },
  value: { fontWeight: '500', fontSize: '0.9rem', textAlign: 'right' },
  highlight: { color: '#e94560', fontWeight: '700', fontSize: '1rem' },
};
