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
  const match = await bcrypt.compare(password, user.password);
  if (!match) return next(new AppError('Invalid credentials', 400));

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = { register, login };
