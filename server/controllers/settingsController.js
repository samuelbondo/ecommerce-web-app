const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getSettings = asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT key_name, value FROM settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key_name, r.value])));
});

const updateSetting = asyncHandler(async (req, res) => {
  const { key_name, value } = req.body;
  await db.query(
    'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
    [key_name, value, value]
  );
  res.json({ message: 'Setting updated' });
});

module.exports = { getSettings, updateSetting };
