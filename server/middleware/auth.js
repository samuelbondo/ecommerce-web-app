const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return next(new AppError('Authentication required', 401));

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin')
    return next(new AppError('Admin access required', 403));
  next();
};

const requireCustomer = (req, res, next) => {
  if (!req.user)
    return next(new AppError('Authentication required', 401));
  next();
};

module.exports = { authenticate, requireAdmin, requireCustomer };
