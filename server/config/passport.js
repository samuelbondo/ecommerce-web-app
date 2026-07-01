const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../config/db');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const googleId = profile.id;
    const avatar = profile.photos?.[0]?.value || null;

    // Check if user exists by google_id
    const [[byGoogle]] = await db.query('SELECT * FROM users WHERE google_id=?', [googleId]);
    if (byGoogle) return done(null, byGoogle);

    // Check if user exists by email (local account)
    const [[byEmail]] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (byEmail) {
      // Link Google to existing account
      await db.query('UPDATE users SET google_id=?, auth_provider="both", avatar=COALESCE(NULLIF(avatar,""),?) WHERE id=?', [googleId, avatar, byEmail.id]);
      const [[updated]] = await db.query('SELECT * FROM users WHERE id=?', [byEmail.id]);
      return done(null, updated);
    }

    // Create new Google user (no password)
    const [result] = await db.query(
      'INSERT INTO users (name, email, google_id, auth_provider, avatar, password) VALUES (?,?,?,"google",?,NULL)',
      [name, email, googleId, avatar]
    );
    const [[newUser]] = await db.query('SELECT * FROM users WHERE id=?', [result.insertId]);
    return done(null, newUser);
  } catch (err) {
    return done(err, null);
  }
}));

module.exports = passport;
