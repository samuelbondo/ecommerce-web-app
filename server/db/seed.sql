USE samuel_store;

INSERT INTO categories (name) VALUES
  ('Electronics'),
  ('Clothing'),
  ('Books'),
  ('Home & Kitchen');

INSERT INTO products (name, description, price, stock, image_url, category_id) VALUES
  ('Wireless Headphones', 'Noise-cancelling over-ear headphones', 79.99, 50, 'https://via.placeholder.com/300?text=Headphones', 1),
  ('Smartphone Stand', 'Adjustable desk stand for phones', 14.99, 120, 'https://via.placeholder.com/300?text=Stand', 1),
  ('Classic T-Shirt', '100% cotton unisex t-shirt', 19.99, 200, 'https://via.placeholder.com/300?text=TShirt', 2),
  ('Running Shoes', 'Lightweight breathable sneakers', 59.99, 75, 'https://via.placeholder.com/300?text=Shoes', 2),
  ('JavaScript: The Good Parts', 'Essential JS book by Douglas Crockford', 24.99, 40, 'https://via.placeholder.com/300?text=Book', 3),
  ('Clean Code', 'A handbook of agile software craftsmanship', 29.99, 35, 'https://via.placeholder.com/300?text=CleanCode', 3),
  ('Coffee Maker', '12-cup programmable coffee maker', 49.99, 60, 'https://via.placeholder.com/300?text=CoffeeMaker', 4),
  ('Non-stick Pan Set', '3-piece non-stick cookware set', 39.99, 45, 'https://via.placeholder.com/300?text=Pans', 4);
