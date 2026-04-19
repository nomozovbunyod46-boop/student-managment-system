const supportRepo = require('../repositories/supportRepo');

async function create(payload) {
  const id = await supportRepo.createSupportMessage({
    name: String(payload.name || '').trim(),
    email: String(payload.email || '').trim(),
    message: String(payload.message || '').trim()
  });
  return { ok: true, id };
}

module.exports = { create };
