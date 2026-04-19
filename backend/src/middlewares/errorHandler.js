const env = require('../config/env');

module.exports = function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const payload = { message: err.message || 'Internal server error' };
  if (err.details) payload.details = err.details;
  if (!env.isProd && status === 500) payload.stack = err.stack;
  res.status(status).json(payload);
};
