/**
 * Samuel Store — Database Migration Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Safely syncs the production Aiven database with the local schema.
 * Every entry checks if the table/column already exists before applying —
 * so this script is fully idempotent (safe to run multiple times).
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 * Each migration entry has:
 *   desc    — human-readable label shown in the console
 *   check   — SQL that returns { c: 0 } if missing, { c: 1 } if already exists
 *   sql     — the ALTER TABLE or CREATE TABLE to run if missing
 *   checkFn — (optional) custom function to evaluate the check result
 *
 * WORKFLOW — whenever you add a new table or column locally:
 * ─────────────────────────────────────────────────────────────────────────────
 *  1. Make your schema change locally (XAMPP / schema.sql)
 *  2. Add a new entry to the migrations array below
 *  3. Run this script against Aiven (production) before pushing to GitHub
 *  4. Push — Render redeploys automatically, Aiven is already up to date
 *
 * Run against Aiven (production) — Windows cmd:
 * ─────────────────────────────────────────────────────────────────────────────
 *   set DB_HOST=mysql-2701278c-ecommerce-web-app.h.aivencloud.com
 *   set DB_PORT=17137
 *   set DB_USER=avnadmin
 *   set DB_PASSWORD=your_aiven_password
 *   set DB_NAME=defaultdb
 *   set DB_SSL=true
 *   node server/migrate.js
 *
 * Run against local XAMPP:
 * ─────────────────────────────────────────────────────────────────────────────
 *   node server/migrate.js
 *   (uses DB_HOST=localhost from server/.env by default)
 *
 * Migration history (what has been applied to Aiven so far):
 * ─────────────────────────────────────────────────────────────────────────────
 *  products        — featured, visible
 *  orders          — payment_method, payment_status, payment_id,
 *                    customer_name, customer_email, customer_phone,
 *                    customer_address, total_amount
 *  order_items     — variant_id, variant_name
 *  users           — status, phone, address, city, country, avatar,
 *                    admin_notes, google_id, auth_provider, last_login,
 *                    password (nullable for Google-only users)
 *  cart            — session_id, created_at, variant_id
 *  categories      — description
 *  settings        — updated_at
 *  NEW TABLES      — otp_codes, reviews, banners, settings,
 *                    product_images, product_options, product_variants,
 *                    payments, cart_items
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'samuel_store',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    multipleStatements: false,
  });

  console.log('Connected to:', process.env.DB_HOST || 'localhost');

  const migrations = [
    // products — featured column
    {
      desc: 'products.featured',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND COLUMN_NAME='featured'`,
      sql: `ALTER TABLE products ADD COLUMN featured TINYINT(1) DEFAULT 0`,
    },
    // products — visible column
    {
      desc: 'products.visible',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND COLUMN_NAME='visible'`,
      sql: `ALTER TABLE products ADD COLUMN visible TINYINT(1) DEFAULT 1`,
    },
    // orders — payment_method
    {
      desc: 'orders.payment_method',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='payment_method'`,
      sql: `ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'cod'`,
    },
    // orders — payment_status
    {
      desc: 'orders.payment_status',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='payment_status'`,
      sql: `ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'`,
    },
    // orders — payment_id
    {
      desc: 'orders.payment_id',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='payment_id'`,
      sql: `ALTER TABLE orders ADD COLUMN payment_id VARCHAR(100) DEFAULT NULL`,
    },
    // users — status
    {
      desc: 'users.status',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='status'`,
      sql: `ALTER TABLE users ADD COLUMN status ENUM('active','suspended') DEFAULT 'active'`,
    },
    // users — phone
    {
      desc: 'users.phone',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='phone'`,
      sql: `ALTER TABLE users ADD COLUMN phone VARCHAR(30) DEFAULT NULL`,
    },
    // users — address
    {
      desc: 'users.address',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='address'`,
      sql: `ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL`,
    },
    // users — city
    {
      desc: 'users.city',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='city'`,
      sql: `ALTER TABLE users ADD COLUMN city VARCHAR(100) DEFAULT NULL`,
    },
    // users — country
    {
      desc: 'users.country',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='country'`,
      sql: `ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT NULL`,
    },
    // users — avatar
    {
      desc: 'users.avatar',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='avatar'`,
      sql: `ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL`,
    },
    // users — admin_notes
    {
      desc: 'users.admin_notes',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='admin_notes'`,
      sql: `ALTER TABLE users ADD COLUMN admin_notes TEXT DEFAULT NULL`,
    },
    // users — google_id
    {
      desc: 'users.google_id',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='google_id'`,
      sql: `ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL`,
    },
    // users — auth_provider
    {
      desc: 'users.auth_provider',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='auth_provider'`,
      sql: `ALTER TABLE users ADD COLUMN auth_provider VARCHAR(10) DEFAULT 'local'`,
    },
    // users — last_login
    {
      desc: 'users.last_login',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='last_login'`,
      sql: `ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL`,
    },
    // users — password nullable (for Google-only users)
    {
      desc: 'users.password → nullable',
      check: `SELECT IS_NULLABLE AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='password'`,
      sql: `ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL`,
      checkFn: (row) => row.c === 'YES', // skip if already nullable
    },
    // new tables
    {
      desc: 'CREATE TABLE otp_codes',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='otp_codes'`,
      sql: `CREATE TABLE otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      desc: 'CREATE TABLE reviews',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reviews'`,
      sql: `CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        status ENUM('pending','approved','rejected') DEFAULT 'approved',
        admin_reply TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
    },
    {
      desc: 'CREATE TABLE banners',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='banners'`,
      sql: `CREATE TABLE banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        image_url VARCHAR(500),
        link VARCHAR(255),
        active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      desc: 'CREATE TABLE settings',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='settings'`,
      sql: `CREATE TABLE settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    },
    {
      desc: 'CREATE TABLE product_images',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='product_images'`,
      sql: `CREATE TABLE product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        is_primary TINYINT(1) DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
    },
    {
      desc: 'CREATE TABLE product_options',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='product_options'`,
      sql: `CREATE TABLE product_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
    },
    {
      desc: 'CREATE TABLE product_variants',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='product_variants'`,
      sql: `CREATE TABLE product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        combination VARCHAR(500) NOT NULL,
        price DECIMAL(10,2) DEFAULT NULL,
        stock INT DEFAULT NULL,
        sku VARCHAR(100) DEFAULT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
    },
    {
      desc: 'CREATE TABLE payments',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='payments'`,
      sql: `CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(100) DEFAULT NULL,
        status ENUM('pending','completed','failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )`,
    },
    {
      desc: 'CREATE TABLE cart_items',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cart_items'`,
      sql: `CREATE TABLE cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
    },
    // cart — missing columns
    {
      desc: 'cart.session_id',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cart' AND COLUMN_NAME='session_id'`,
      sql: `ALTER TABLE cart ADD COLUMN session_id VARCHAR(255) DEFAULT NULL`,
    },
    {
      desc: 'cart.created_at',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cart' AND COLUMN_NAME='created_at'`,
      sql: `ALTER TABLE cart ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    },
    {
      desc: 'cart.variant_id',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cart' AND COLUMN_NAME='variant_id'`,
      sql: `ALTER TABLE cart ADD COLUMN variant_id INT DEFAULT NULL`,
    },
    // order_items — missing columns
    {
      desc: 'order_items.variant_id',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='order_items' AND COLUMN_NAME='variant_id'`,
      sql: `ALTER TABLE order_items ADD COLUMN variant_id INT DEFAULT NULL`,
    },
    {
      desc: 'order_items.variant_name',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='order_items' AND COLUMN_NAME='variant_name'`,
      sql: `ALTER TABLE order_items ADD COLUMN variant_name VARCHAR(500) DEFAULT NULL`,
    },
    // orders — missing columns
    {
      desc: 'orders.customer_name',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='customer_name'`,
      sql: `ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255) DEFAULT NULL`,
    },
    {
      desc: 'orders.customer_email',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='customer_email'`,
      sql: `ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255) DEFAULT NULL`,
    },
    {
      desc: 'orders.customer_phone',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='customer_phone'`,
      sql: `ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50) DEFAULT NULL`,
    },
    {
      desc: 'orders.customer_address',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='customer_address'`,
      sql: `ALTER TABLE orders ADD COLUMN customer_address TEXT DEFAULT NULL`,
    },
    {
      desc: 'orders.total_amount',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='total_amount'`,
      sql: `ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) DEFAULT NULL`,
    },
    // categories — description
    {
      desc: 'categories.description',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='categories' AND COLUMN_NAME='description'`,
      sql: `ALTER TABLE categories ADD COLUMN description TEXT DEFAULT NULL`,
    },
    // settings — updated_at
    {
      desc: 'settings.updated_at',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='settings' AND COLUMN_NAME='updated_at'`,
      sql: `ALTER TABLE settings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    },
    {
      desc: 'users.notif_email_orders',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='notif_email_orders'`,
      sql: `ALTER TABLE users ADD COLUMN notif_email_orders TINYINT(1) DEFAULT 1`,
    },
    {
      desc: 'users.notif_email_promos',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='notif_email_promos'`,
      sql: `ALTER TABLE users ADD COLUMN notif_email_promos TINYINT(1) DEFAULT 0`,
    },
    {
      desc: 'users.notif_newsletter',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='notif_newsletter'`,
      sql: `ALTER TABLE users ADD COLUMN notif_newsletter TINYINT(1) DEFAULT 0`,
    },
    {
      desc: 'users.notif_sms',
      check: `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='notif_sms'`,
      sql: `ALTER TABLE users ADD COLUMN notif_sms TINYINT(1) DEFAULT 1`,
    },
    {
      desc: 'CREATE TABLE addresses',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='addresses'`,
      sql: `CREATE TABLE addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        label VARCHAR(50) DEFAULT 'Home',
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(30) DEFAULT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) DEFAULT 'Kenya',
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
    },
    {
      desc: 'CREATE TABLE notifications',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notifications'`,
      sql: `CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        icon VARCHAR(10) DEFAULT '🔔',
        message TEXT NOT NULL,
        read_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
    },
    {
      desc: 'CREATE TABLE conversations',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='conversations'`,
      sql: `CREATE TABLE conversations (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT DEFAULT NULL,
        guest_name VARCHAR(100) DEFAULT 'Guest',
        status ENUM('open','taken_over','closed') DEFAULT 'open',
        admin_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
    },
    {
      desc: 'CREATE TABLE conversation_messages',
      check: `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='conversation_messages'`,
      sql: `CREATE TABLE conversation_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL,
        role ENUM('user','assistant','admin') NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )`,
    },
  ];

  let applied = 0;
  let skipped = 0;

  for (const m of migrations) {
    const [[row]] = await conn.execute(m.check);
    const exists = m.checkFn ? m.checkFn(row) : row.c > 0;
    if (exists) {
      console.log(`  ✓ skip  — ${m.desc}`);
      skipped++;
    } else {
      await conn.execute(m.sql);
      console.log(`  ✅ done  — ${m.desc}`);
      applied++;
    }
  }

  await conn.end();
  console.log(`\nMigration complete — ${applied} applied, ${skipped} already existed.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
