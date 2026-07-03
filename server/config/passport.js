const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('../config/db');
const jwt = require('jsonwebtoken');

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

    // Check if user exists by email (local account) — link Google to it
    const [[byEmail]] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (byEmail) {
      const newAvatar = byEmail.avatar || avatar;
      await db.query('UPDATE users SET google_id=?, auth_provider=?, avatar=? WHERE id=?',
        [googleId, 'both', newAvatar, byEmail.id]);
      const [[updated]] = await db.query('SELECT * FROM users WHERE id=?', [byEmail.id]);
      return done(null, updated);
    }

    // New user — create with Google, no password
    const [result] = await db.query(
      'INSERT INTO users (name, email, google_id, auth_provider, avatar) VALUES (?,?,?,?,?)',
      [name, email, googleId, 'google', avatar]
    );
    const [[newUser]] = await db.query('SELECT * FROM users WHERE id=?', [result.insertId]);
    return done(null, newUser);
  } catch (err) {
    return done(err, null);
  }
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
  profileFields: ['id', 'displayName', 'emails', 'photos'],
  enableProof: true,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const facebookId = profile.id;
    const name = profile.displayName;
    const email = profile.emails?.[0]?.value || null;
    const avatar = profile.photos?.[0]?.value || null;

    // Check by facebook_id
    const [[byFacebook]] = await db.query('SELECT * FROM users WHERE facebook_id=?', [facebookId]);
    if (byFacebook) return done(null, byFacebook);

    // Check by email — link Facebook to existing account
    if (email) {
      const [[byEmail]] = await db.query('SELECT * FROM users WHERE email=?', [email]);
      if (byEmail) {
        const newAvatar = byEmail.avatar || avatar;
        await db.query('UPDATE users SET facebook_id=?, auth_provider=?, avatar=? WHERE id=?',
          [facebookId, 'both', newAvatar, byEmail.id]);
        const [[updated]] = await db.query('SELECT * FROM users WHERE id=?', [byEmail.id]);
        return done(null, updated);
      }
    }

    // New user — create with Facebook
    const safeName = name || 'Facebook User';
    const [result] = await db.query(
      'INSERT INTO users (name, email, facebook_id, auth_provider, avatar) VALUES (?,?,?,?,?)',
      [safeName, email || null, facebookId, 'facebook', avatar]
    );
    const [[newUser]] = await db.query('SELECT * FROM users WHERE id=?', [result.insertId]);
    return done(null, newUser);
  } catch (err) {
    return done(err, null);
  }
}));

module.exports = passport;
