const asyncHandler = require('../utils/asyncHandler');
const supportService = require('../services/supportService');

exports.create = asyncHandler(async (req, res) => {
  const payload = await supportService.create(req.body || {});
  res.status(201).json(payload);
});
