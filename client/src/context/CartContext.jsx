import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_KEY = 'ss_cart';
const itemKey = (product_id, variant_id) => `${product_id}_${variant_id || ''}`;

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, variant = null) => {
    const key = itemKey(product.id, variant?.id);
    const price = variant?.price ?? product.price;
    const image = variant?.image_url || product.image_url;
    const variantName = variant?.combination || null;

    setCart(prev => {
      const existing = prev.find(i => i._key === key);
      if (existing) return prev.map(i => i._key === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        _key: key,
        id: product.id,
        product_id: product.id,
        variant_id: variant?.id || null,
        variant_name: variantName,
        name: product.name,
        price,
        image_url: image,
        stock: variant?.stock ?? product.stock,
        quantity: 1,
      }];
    });
  };

  const removeFromCart = (key) => setCart(prev => prev.filter(i => i._key !== key));

  const updateQuantity = (key, qty) => {
    if (qty < 1) return;
    setCart(prev => prev.map(i => i._key === key ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
