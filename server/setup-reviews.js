require('dotenv').config();
const db = require('./config/db');

const run = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      rating TINYINT NOT NULL,
      comment TEXT NOT NULL,
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      admin_reply TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY one_review_per_user (product_id, user_id)
    )
  `);
  console.log('reviews table ready');
  process.exit(0);
};

run().catch(e => { console.error(e.message); process.exit(1); });
