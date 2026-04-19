const ApiError = require('../utils/ApiError');
const userRepo = require('../repositories/userRepo');
const directMessageRepo = require('../repositories/directMessageRepo');

async function create({ sender, receiver_id, message }) {
  if (Number(receiver_id) === Number(sender.id)) {
    throw new ApiError(400, 'Cannot message yourself');
  }

  const receiver = await userRepo.findById(Number(receiver_id));
  if (!receiver) throw new ApiError(404, 'Receiver not found');

  const id = await directMessageRepo.createDirectMessage({
    sender_id: sender.id,
    receiver_id: Number(receiver_id),
    message: String(message || '').trim()
  });

  return { ok: true, id };
}

async function inbox(user) {
  const rows = await directMessageRepo.listInbox(user.id);
  return rows;
}

module.exports = { create, inbox };
