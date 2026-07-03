const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (toEmail, userName, code) => {
  await resend.emails.send({
    from: `Samuel Store <${process.env.MAIL_FROM}>`,
    to: toEmail,
    subject: 'Your Samuel Store password reset code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#e94560;color:#fff;font-weight:800;font-size:1.3rem;padding:10px 20px;border-radius:10px;">Samuel Store</div>
        </div>
        <h2 style="color:#1a1a2e;margin-bottom:8px;">Password Reset Request</h2>
        <p style="color:#555;line-height:1.6;">Hi <strong>${userName}</strong>, we received a request to reset your password. Use the code below — it expires in <strong>10 minutes</strong>.</p>
        <div style="background:#fff;border:2px solid #e94560;border-radius:10px;padding:28px;text-align:center;margin:24px 0;">
          <div style="font-size:0.8rem;color:#888;margin-bottom:8px;letter-spacing:2px;text-transform:uppercase;">Your verification code</div>
          <span style="font-size:2.8rem;font-weight:800;letter-spacing:14px;color:#1a1a2e;">${code}</span>
        </div>
        <p style="color:#888;font-size:0.85rem;line-height:1.6;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#aaa;font-size:0.75rem;text-align:center;">Samuel Store &mdash; Your trusted online shop</p>
      </div>
    `,
  });
};

// ── Standard auth ──────────────────────────────────────
router.post('/register', validate(['name', 'email', 'password']), register);
router.post('/login', validate(['email', 'password']), login);

router.get('/me', authenticate, async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT id,name,email,phone,address,city,country,role,status,avatar,auth_provider,created_at,last_login FROM users WHERE id=?', [req.user.id]);
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
    const [[user]] = await db.query('SELECT id,name,email,phone,address,city,country,role,status,avatar,auth_provider,created_at FROM users WHERE id=?', [req.user.id]);
    res.json({ message: 'Profile updated', user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/password', authenticate, async (req, res) => {
  const { current, newPassword } = req.body;
  try {
    const [[user]] = await db.query('SELECT password, auth_provider FROM users WHERE id=?', [req.user.id]);
    if (user.auth_provider === 'google') return res.status(400).json({ error: 'Use set-password for Google accounts' });
    const match = await bcrypt.compare(current, user.password);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Google OAuth ───────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  (req, res) => {
    try {
      const user = req.user;
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const userData = encodeURIComponent(JSON.stringify({
        id: user.id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, auth_provider: user.auth_provider
      }));
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${userData}`);
    } catch (err) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
    }
  }
);

// ── Facebook OAuth ─────────────────────────────────
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

router.get('/facebook/callback',
  (req, res, next) => {
    passport.authenticate('facebook', { session: false }, (err, user) => {
      if (err) {
        console.error('Facebook callback error:', err?.message || err);
        // Expired/used codes are Render double-request noise — send empty 200
        if (err.message && (err.message.includes('expired') || err.message.includes('been used'))) {
          return res.status(200).send('OK');
        }
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_failed`);
      }
      if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_failed`);
      try {
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const userData = encodeURIComponent(JSON.stringify({
          id: user.id, name: user.name, email: user.email,
          role: user.role, avatar: user.avatar, auth_provider: user.auth_provider
        }));
        const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${userData}`;
        // Small delay ensures this response arrives after any duplicate error responses
        setTimeout(() => res.redirect(redirectUrl), 500);
      } catch (e) {
        console.error('Facebook JWT error:', e.message);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_failed`);
      }
    })(req, res, next);
  }
);

// ── Set password (Google user adds a password) ─────────
router.post('/set-password', authenticate, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const [[user]] = await db.query('SELECT auth_provider FROM users WHERE id=?', [req.user.id]);
    const hashed = await bcrypt.hash(password, 10);
    const newProvider = user.auth_provider === 'google' ? 'both' : user.auth_provider;
    await db.query('UPDATE users SET password=?, auth_provider=? WHERE id=?', [hashed, newProvider, req.user.id]);
    res.json({ message: 'Password set. You can now log in with email or Google.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Link Google to existing account ───────────────────
router.post('/link-google', authenticate, async (req, res) => {
  const { google_id, avatar } = req.body;
  if (!google_id) return res.status(400).json({ error: 'google_id required' });
  try {
    const [[user]] = await db.query('SELECT avatar FROM users WHERE id=?', [req.user.id]);
    const newAvatar = user.avatar || avatar || null;
    await db.query('UPDATE users SET google_id=?, auth_provider=?, avatar=? WHERE id=?',
      [google_id, 'both', newAvatar, req.user.id]);
    res.json({ message: 'Google account linked successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/preferences', authenticate, async (req, res) => {
  try {
    const [[u]] = await db.query(
      'SELECT notif_email_orders, notif_email_promos, notif_newsletter, notif_sms FROM users WHERE id=?',
      [req.user.id]
    );
    res.json(u);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/preferences', authenticate, async (req, res) => {
  const { notif_email_orders, notif_email_promos, notif_newsletter, notif_sms } = req.body;
  try {
    await db.query(
      'UPDATE users SET notif_email_orders=?, notif_email_promos=?, notif_newsletter=?, notif_sms=? WHERE id=?',
      [notif_email_orders ? 1:0, notif_email_promos ? 1:0, notif_newsletter ? 1:0, notif_sms ? 1:0, req.user.id]
    );
    res.json({ message: 'Preferences saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Forgot password — Step 1: send OTP ────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const [[user]] = await db.query('SELECT id, name FROM users WHERE email=?', [email]);
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs for this email
    await db.query('UPDATE otp_codes SET used=1 WHERE email=? AND used=0', [email]);
    // Insert new OTP
    await db.query('INSERT INTO otp_codes (email, code, expires_at) VALUES (?,?,?)', [email, code, expiresAt]);

    // Send OTP email
    await sendOTPEmail(email, user.name, code);

    res.json({ message: 'OTP sent to your email' });
  } catch (err) { console.error('forgot-password error:', err); res.status(500).json({ error: err.message }); }
});

// ── Forgot password — Step 2: verify OTP ──────────────
router.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });
  try {
    const [[otp]] = await db.query(
      'SELECT * FROM otp_codes WHERE email=? AND code=? AND used=0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );
    if (!otp) return res.status(400).json({ error: 'Invalid or expired code' });

    // Mark OTP as used
    await db.query('UPDATE otp_codes SET used=1 WHERE id=?', [otp.id]);

    // Issue a short-lived reset token (5 min)
    const resetToken = jwt.sign({ email, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    res.json({ message: 'Code verified', resetToken });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Forgot password — Step 3: set new password ────────
router.post('/reset-password', async (req, res) => {
  const { resetToken, password } = req.body;
  if (!resetToken || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    let payload;
    try { payload = jwt.verify(resetToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ error: 'Reset token expired. Please start over.' }); }

    if (payload.purpose !== 'reset') return res.status(400).json({ error: 'Invalid token' });

    const hashed = await bcrypt.hash(password, 10);
    await db.query("UPDATE users SET password=?, auth_provider=CASE WHEN auth_provider='google' THEN 'both' ELSE auth_provider END WHERE email=?", [hashed, payload.email]);
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Delete account + all user data ───────────────────
router.delete('/delete-data', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query('DELETE FROM cart WHERE user_id=?', [userId]);
    await db.query('DELETE FROM addresses WHERE user_id=?', [userId]);
    await db.query('DELETE FROM reviews WHERE user_id=?', [userId]);
    await db.query('DELETE FROM notifications WHERE user_id=?', [userId]);
    await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id=?)', [userId]);
    await db.query('DELETE FROM orders WHERE user_id=?', [userId]);
    await db.query('DELETE FROM otp_codes WHERE email=(SELECT email FROM users WHERE id=?)', [userId]);
    await db.query('DELETE FROM users WHERE id=?', [userId]);
    res.json({ message: 'Your account and all associated data have been permanently deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
