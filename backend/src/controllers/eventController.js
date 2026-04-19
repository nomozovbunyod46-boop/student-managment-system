const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const eventService = require('../services/eventService');

exports.list = asyncHandler(async (_req, res) => {
  res.json(await eventService.list());
});

exports.get = asyncHandler(async (req, res) => {
  res.json(await eventService.get(Number(req.params.id)));
});

// ✅ views +1
exports.view = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  res.json(await eventService.bumpView(id, req.user));
});

// ✅ join (ticket_code qaytaradi, capacity bo‘lsa waitlist)
exports.join = asyncHandler(async (req, res) => {
  res.json(await eventService.join(Number(req.params.id), req.user, req.body || {}));
});

exports.myTicket = asyncHandler(async (req, res) => {
  res.json(await eventService.myTicket(Number(req.params.id), req.user));
});

// organizer/admin: participants list
exports.participants = asyncHandler(async (req, res) => {
  res.json(await eventService.participants(Number(req.params.id), req.user));
});

// organizer/admin: check-in
exports.checkin = asyncHandler(async (req, res) => {
  const ticket_code = String(req.body?.ticket_code || '').trim();
  if (!ticket_code) throw new ApiError(400, 'ticket_code required');
  res.json(await eventService.checkin(Number(req.params.id), ticket_code, req.user));
});

// organizer/admin: waitlist list
exports.waitlist = asyncHandler(async (req, res) => {
  res.json(await eventService.waitlist(Number(req.params.id), req.user));
});

// organizer/admin: accept waitlist
exports.acceptWaitlist = asyncHandler(async (req, res) => {
  const user_id = req.body?.user_id;
  if (!user_id) throw new ApiError(400, 'user_id required');
  res.json(await eventService.acceptWaitlist(Number(req.params.id), user_id, req.user));
});

// organizer/admin: promo list
exports.promoList = asyncHandler(async (req, res) => {
  res.json(await eventService.promoList(Number(req.params.id), req.user));
});

// organizer/admin: promo create
exports.promoCreate = asyncHandler(async (req, res) => {
  res.json(await eventService.promoCreate(Number(req.params.id), req.body || {}, req.user));
});

exports.create = asyncHandler(async (req, res) => {
  const event = await eventService.create(req.body, req.user.id);
  res.status(201).json(event);
});

exports.update = asyncHandler(async (req, res) => {
  const event = await eventService.update(Number(req.params.id), req.body, req.user);
  res.json(event);
});

exports.remove = asyncHandler(async (req, res) => {
  res.json(await eventService.remove(Number(req.params.id), req.user));
});
