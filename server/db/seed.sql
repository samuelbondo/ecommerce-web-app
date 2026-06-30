USE samuel_store;

INSERT INTO categories (name) VALUES
  ('Electronics'),
  ('Clothing'),
  ('Books'),
  ('Home & Kitchen');

INSERT INTO products (name, description, price, stock, image_url, category_id) VALUES
  ('Wireless Headphones', 'Noise-cancelling over-ear headphones with 30-hour battery life', 79.99, 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop', 1),
  ('Smartphone Stand', 'Adjustable aluminium desk stand for phones and tablets', 14.99, 120, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop', 1),
  ('Classic T-Shirt', '100% cotton unisex t-shirt, available in multiple colours', 19.99, 200, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop', 2),
  ('Running Shoes', 'Lightweight breathable sneakers for everyday training', 59.99, 75, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop', 2),
  ('JavaScript: The Good Parts', 'Essential JS book by Douglas Crockford', 24.99, 40, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=300&fit=crop', 3),
  ('Clean Code', 'A handbook of agile software craftsmanship by Robert C. Martin', 29.99, 35, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop', 3),
  ('Coffee Maker', '12-cup programmable drip coffee maker with thermal carafe', 49.99, 60, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop', 4),
  ('Non-stick Pan Set', '3-piece granite-coated non-stick cookware set', 39.99, 45, 'https://images.unsplash.com/photo-1584990347449-a2d4c2c044ba?w=400&h=300&fit=crop', 4);
