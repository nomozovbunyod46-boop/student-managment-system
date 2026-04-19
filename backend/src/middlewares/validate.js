const ApiError = require('../utils/ApiError');

module.exports = function validate(schema, where = 'body') {
  return function (req, _res, next) {
    const data = req[where];
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message
      }));
      return next(new ApiError(400, 'Validation error', issues));
    }
    req[where] = parsed.data;
    return next();
  };
};
