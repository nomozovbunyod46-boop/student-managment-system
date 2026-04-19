const asyncHandler = require('../utils/asyncHandler');
const directMessageService = require('../services/directMessageService');

exports.create = asyncHandler(async (req, res) => {
  const payload = await directMessageService.create({
    sender: req.user,
    receiver_id: req.body?.receiver_id,
    message: req.body?.message
  });
  res.status(201).json(payload);
});

exports.inbox = asyncHandler(async (req, res) => {
  const rows = await directMessageService.inbox(req.user);
  res.json(rows);
});
