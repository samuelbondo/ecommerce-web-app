const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

router.post('/register', validate(['name', 'email', 'password']), register);
router.post('/login', validate(['email', 'password']), login);

router.get('/me', authenticate, async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT id,name,email,phone,address,city,country,role,status,avatar,created_at,last_login FROM users WHERE id=?', [req.user.id]);
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/avatar', authenticate, async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: 'No avatar provided' });
  if (avatar.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'Image too large. Max 1.5MB.' });
  try {
    await db.query('UPDATE users SET avatar=? WHERE id=?', [avatar, req.user.id]);
    res.json({ message: 'Avatar updated', avatar });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/profile', authenticate, async (req, res) => {
  const { name, email, phone, address, city, country } = req.body;
  try {
    await db.query('UPDATE users SET name=?,email=?,phone=?,address=?,city=?,country=? WHERE id=?', [name, email, phone||null, address||null, city||null, country||null, req.user.id]);
    const [[user]] = await db.query('SELECT id,name,email,phone,address,city,country,role,status,avatar,created_at FROM users WHERE id=?', [req.user.id]);
    res.json({ message: 'Profile updated', user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/password', authenticate, async (req, res) => {
  const { current, newPassword } = req.body;
  try {
    const [[user]] = await db.query('SELECT password FROM users WHERE id=?', [req.user.id]);
    const match = await bcrypt.compare(current, user.password);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
