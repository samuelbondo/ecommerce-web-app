const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const [existing] = await User.findByEmail(email);
  if (existing.length) return next(new AppError('Email already registered', 400));

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await User.create(name, email, hashed);
  res.status(201).json({ message: 'User registered', userId: result.insertId });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const [rows] = await User.findByEmail(email);
  if (!rows.length) return next(new AppError('Invalid credentials', 400));

  const user = rows[0];
  if (user.status === 'suspended') return next(new AppError('Your account has been suspended. Please contact support.', 403));
  if (!user.password) return next(new AppError('This account uses Google login. Please sign in with Google.', 400));
  const match = await bcrypt.compare(password, user.password);
  if (!match) return next(new AppError('Invalid credentials', 400));

  await User.updateLastLogin(user.id);
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, auth_provider: user.auth_provider, phone: user.phone, address: user.address, city: user.city, country: user.country } });
});

module.exports = { register, login };
