import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useSettings } from '../context/SettingsContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const { formatPrice } = useSettings();

  useEffect(() => {
    API.get('/products').then((res) => setProducts(res.data));
    API.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = selected ? p.category_id === Number(selected) : true;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={styles.container}>
      <h2>All Products</h2>
      <div style={styles.filters}>
        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.input} />
        <select value={selected} onChange={(e) => setSelected(e.target.value)} style={styles.input}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={styles.grid}>
        {filtered.map((p) => (
          <Link to={`/products/${p.id}`} key={p.id} style={styles.card}>
            <img src={p.image_url} alt={p.name} style={styles.img} onError={(e) => { e.target.src = 'https://placehold.co/300x300?text=No+Image'; }} />
            <h3 style={styles.name}>{p.name}</h3>
            <p style={styles.price}>{formatPrice(p.price)}</p>
            <p style={styles.stock}>Stock: {p.stock}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px' },
  filters: { display: 'flex', gap: '12px', marginBottom: '24px' },
  input: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  card: { border: '1px solid #ddd', borderRadius: '8px', padding: '12px', textDecoration: 'none', color: '#333' },
  img: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' },
  name: { fontSize: '0.95rem', margin: '8px 0 4px' },
  price: { color: '#e94560', fontWeight: 'bold' },
  stock: { fontSize: '0.8rem', color: '#888' },
};
