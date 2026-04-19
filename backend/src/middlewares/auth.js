const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');

function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication required'));
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch (_e) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

function requireRole(...roles) {
  return function (req, _res, next) {
    const role = req.user?.role;
    const isOrg = Boolean(req.user?.is_organizer);
    const allowed = roles.some(r => (r === 'organizer' ? isOrg : r === role));
    if (!allowed) {
      return next(new ApiError(403, 'Forbidden'));
    }
    return next();
  };
}

module.exports = { authRequired, requireRole };
