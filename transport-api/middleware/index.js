// Central error handler
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = { errorHandler, requestLogger };
