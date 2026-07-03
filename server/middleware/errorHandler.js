const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  console.error(`[ERROR] ${statusCode} — ${err.message}`);
  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
