import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useCart();
  const { formatPrice } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/products/${id}`).then((res) => setProduct(res.data));
  }, [id]);

  if (!product) return <p style={{ padding: '24px' }}>Loading...</p>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.back}>← Back</button>
      <div style={styles.wrapper}>
        <img src={product.image_url} alt={product.name} style={styles.img} onError={(e) => { e.target.src = 'https://placehold.co/300x300?text=No+Image'; }} />
        <div style={styles.info}>
          <h2>{product.name}</h2>
          <p style={styles.category}>{product.category}</p>
          <p style={styles.price}>{formatPrice(product.price)}</p>
          <p style={styles.desc}>{product.description}</p>
          <p>In stock: {product.stock}</p>
          <button onClick={() => { addToCart(product); navigate('/cart'); }} style={styles.btn}>
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px' },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', marginBottom: '16px' },
  wrapper: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  img: { width: '300px', height: '300px', objectFit: 'cover', borderRadius: '8px' },
  info: { flex: 1, minWidth: '200px' },
  category: { color: '#888', marginBottom: '8px' },
  price: { fontSize: '1.5rem', color: '#e94560', fontWeight: 'bold', margin: '8px 0' },
  desc: { margin: '12px 0' },
  btn: { padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
};
