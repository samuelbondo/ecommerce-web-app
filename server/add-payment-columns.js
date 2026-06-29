require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  const columns = [
    `ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cod'`,
    `ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending'`,
    `ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255) DEFAULT NULL`,
  ];

  for (const sql of columns) {
    try {
      await c.execute(sql);
      console.log('Added:', sql.split('ADD COLUMN ')[1].split(' ')[0]);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Already exists, skipping:', sql.split('ADD COLUMN ')[1].split(' ')[0]);
      } else throw e;
    }
  }

  await c.end();
  console.log('Done!');
}

run().catch(err => { console.error(err.message); process.exit(1); });
