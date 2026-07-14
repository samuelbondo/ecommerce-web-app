import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { fmtOrderId } from '../utils/formatOrderId';

export default function OrderConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useSettings();

  if (!state?.orderId) {
    navigate('/');
    return null;
  }

  const { orderId, form, total, paymentMethod, paymentId, items } = state;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>✅</div>
        <h2 style={styles.title}>Order Confirmed!</h2>
        <p style={styles.sub}>Thank you, <strong>{form.fullName}</strong>. Your order has been placed successfully.</p>
        <div style={styles.details}>
          <Row label="Order ID" value={fmtOrderId(orderId, new Date())} />
          <Row label="Email" value={form.email} />
          <Row label="Phone" value={form.phone} />
          <Row label="Delivery Address" value={`${form.address}, ${form.city}`} />
          <Row label="Payment" value={paymentMethod === 'paypal' ? '✅ Paid via PayPal' : '💵 Cash on Delivery'} />
          {paymentId && <Row label="Payment ID" value={paymentId} />}
          <Row label="Total" value={formatPrice(total)} highlight />
        </div>
        {items?.length > 0 && (
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Items Ordered</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8f9fb', borderRadius: 10 }}>
                  <img src={item.image_url} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 7, flexShrink: 0, border: '1px solid #e5e7eb' }}
                    onError={e => { e.target.src = 'https://placehold.co/40x40?text=?'; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a2e' }}>{item.name}</div>
                    {item.variant_name && <div style={{ fontSize: '0.72rem', color: '#e94560', fontWeight: 600 }}>{item.variant_name}</div>}
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap' }}>{formatPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
  page: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 16px', minHeight: '70vh', boxSizing: 'border-box' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px 20px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  icon: { fontSize: '3rem', marginBottom: '12px' },
  title: { fontSize: '1.5rem', marginBottom: '8px', color: '#1a1a2e' },
  sub: { color: '#555', marginBottom: '24px', fontSize: '0.9rem' },
  details: { background: '#f9f9f9', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '24px' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: { flex: '1 1 auto', padding: '10px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  btnSecondary: { flex: '1 1 auto', padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
};

const rowStyles = {
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #eee', gap: '12px' },
  label: { color: '#888', fontSize: '0.82rem', flexShrink: 0, paddingTop: '1px' },
  value: { fontWeight: '500', fontSize: '0.88rem', textAlign: 'right', wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0 },
  highlight: { color: '#e94560', fontWeight: '700', fontSize: '0.95rem' },
};
