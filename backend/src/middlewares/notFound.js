const ApiError = require('../utils/ApiError');
module.exports = function notFound(_req, _res, next) {
  next(new ApiError(404, 'Route not found'));
};
