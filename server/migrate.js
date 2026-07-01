/**
 * Samuel Store — Database Migration Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Safely adds all missing columns to an existing live database (Aiven / XAMPP).
 * Uses ALTER TABLE ... IF NOT EXISTS — safe to run multiple times.
 *
 * Run against Aiven (production):
 *   set DB_HOST=mysql-2701278c-ecommerce-web-app.h.aivencloud.com
 *   set DB_PORT=17137
 *   set DB_USER=avnadmin
 *   set DB_PASSWORD=your_aiven_password
 *   set DB_NAME=defaultdb
 *   set DB_SSL=true
 *   node server/migrate.js
 *
 * Run against local XAMPP:
 *   node server/migrate.js
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
