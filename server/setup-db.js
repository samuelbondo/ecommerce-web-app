const mysql = require('mysql2/promise');

// Run this script locally only — never commit real credentials
// Set these environment variables before running:
// DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

async function run() {
  console.log('Connecting to MySQL...');

  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    multipleStatements: false,
  });

  console.log('Connected!');

  const statements = [
    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 0,
      image_url VARCHAR(500),
      category_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('customer','admin') DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      total DECIMAL(10,2) NOT NULL,
      status ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      product_id INT,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      product_id INT,
      quantity INT DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(100) NOT NULL UNIQUE,
      value TEXT
    )`,
    `INSERT IGNORE INTO categories (name) VALUES ('Electronics'),('Clothing'),('Books'),('Home & Kitchen')`,
    `INSERT IGNORE INTO products (name, description, price, stock, image_url, category_id) VALUES
      ('Wireless Headphones','Noise-cancelling over-ear headphones',79.99,50,'https://via.placeholder.com/300?text=Headphones',1),
      ('Smartphone Stand','Adjustable desk stand for phones',14.99,120,'https://via.placeholder.com/300?text=Stand',1),
      ('Classic T-Shirt','100% cotton unisex t-shirt',19.99,200,'https://via.placeholder.com/300?text=TShirt',2),
      ('Running Shoes','Lightweight breathable sneakers',59.99,75,'https://via.placeholder.com/300?text=Shoes',2),
      ('JavaScript: The Good Parts','Essential JS book by Douglas Crockford',24.99,40,'https://via.placeholder.com/300?text=Book',3),
      ('Clean Code','A handbook of agile software craftsmanship',29.99,35,'https://via.placeholder.com/300?text=CleanCode',3),
      ('Coffee Maker','12-cup programmable coffee maker',49.99,60,'https://via.placeholder.com/300?text=CoffeeMaker',4),
      ('Non-stick Pan Set','3-piece non-stick cookware set',39.99,45,'https://via.placeholder.com/300?text=Pans',4)`
  ];

  for (const sql of statements) {
    await c.execute(sql);
    console.log('OK:', sql.trim().split('\n')[0].substring(0, 60));
  }

  await c.end();
  console.log('\nDatabase setup complete!');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
