const AppError = require('../utils/AppError');

const validate = (fields) => (req, res, next) => {
  for (const field of fields) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
      return next(new AppError(`Field '${field}' is required`, 400));
    }
  }
  next();
};

module.exports = validate;
