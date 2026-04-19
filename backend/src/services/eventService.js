const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { toMysqlDatetime } = require('../utils/datetime');
const { query } = require('../config/db');
const eventRepo = require('../repositories/eventRepo');

async function list() {
  return eventRepo.listEvents();
}

async function get(id) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
}

async function bumpView(id, user) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');

  // Organizer o‘z eventini ko‘rsa views qo‘shilmasin
  if (Number(event.organizer_id) === Number(user.id)) {
    return { views: await eventRepo.getViews(id) };
  }

  // Har user uchun faqat 1 marta
  const inserted = await eventRepo.addViewOnce(id, user.id);
  if (inserted) {
    await eventRepo.incrementViews(id);
  }

  return { views: await eventRepo.getViews(id) };
}

function normalizePromoCode(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  const up = s.toUpperCase();
  if (up.length > 32) throw new ApiError(400, 'promo_code too long');
  if (!/^[A-Z0-9_-]+$/.test(up)) throw new ApiError(400, 'Invalid promo_code format');
  return up;
}

async function join(id, user, body = {}) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');

  if (Number(event.organizer_id) === Number(user.id)) {
    throw new ApiError(400, 'Organizer cannot join their own event');
  }

  // Oldin join qilgan bo‘lsa
  const existing = await eventRepo.getParticipant(id, user.id);
  if (existing?.ticket_code) {
    return {
      ok: true,
      joined: true,
      ticket_code: existing.ticket_code,
      checked_in_at: existing.checked_in_at,
      promo_code: existing.promo_code || null
    };
  }

  const promoCode = normalizePromoCode(body.promo_code);

  // capacity -> to‘lsa waitlist
  const capacity = event.capacity == null ? null : Number(event.capacity);
  if (capacity != null) {
    const cnt = await eventRepo.countParticipants(id);
    if (cnt >= capacity) {
      await eventRepo.addToWaitlist(id, user.id, promoCode);
      return { ok: true, waitlisted: true };
    }
  }

  // promo tekshir
  let promo = null;
  if (promoCode) {
    promo = await eventRepo.getPromoByCode(id, promoCode);
    if (!promo || !promo.active) throw new ApiError(400, 'Invalid promo code');
    if (promo.usage_limit != null && Number(promo.used_count) >= Number(promo.usage_limit)) {
      throw new ApiError(400, 'Promo code limit reached');
    }
  }

  const ticketCode = crypto.randomBytes(16).toString('hex');

  const inserted = await eventRepo.addParticipantWithTicket(id, user.id, ticketCode, promoCode);

  // Agar parallel join bo‘lib qolsa
  if (!inserted) {
    const p = await eventRepo.getParticipant(id, user.id);
    return {
      ok: true,
      joined: true,
      ticket_code: p?.ticket_code || null,
      checked_in_at: p?.checked_in_at || null,
      promo_code: p?.promo_code || null
    };
  }

  // promo usage increment (join muvaffaqiyatli bo‘lgandan keyin)
  if (promo) {
    const ok = await eventRepo.incrementPromoUsage(promo.id);
    if (!ok) {
      // rollback minimal: participantni o‘chirib yuboramiz
      await query('DELETE FROM event_participants WHERE event_id=? AND user_id=?', [id, user.id]);
      throw new ApiError(400, 'Promo code limit reached');
    }
  }

  const saved = await eventRepo.getParticipant(id, user.id);
  return {
    ok: true,
    joined: true,
    ticket_code: saved?.ticket_code || ticketCode,
    checked_in_at: saved?.checked_in_at || null,
    promo_code: saved?.promo_code || promoCode || null
  };
}

async function myTicket(id, user) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');

  const p = await eventRepo.getParticipant(id, user.id);
  if (!p) return { ok: true, joined: false };

  return {
    ok: true,
    joined: true,
    ticket_code: p.ticket_code,
    checked_in_at: p.checked_in_at,
    promo_code: p.promo_code || null
  };
}

function assertOwnerOrAdmin(event, user) {
  const isOwner = Number(event.organizer_id) === Number(user.id);
  if (!['admin','super_admin'].includes(user.role) && !isOwner) throw new ApiError(403, 'Forbidden');
  return isOwner;
}

async function participants(id, user) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');
  assertOwnerOrAdmin(event, user);
  return eventRepo.listParticipants(id);
}

async function checkin(id, ticket_code, user) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');
  assertOwnerOrAdmin(event, user);

  const code = String(ticket_code || '').trim();
  if (!code) throw new ApiError(400, 'ticket_code required');

  const p = await eventRepo.getParticipantByTicket(id, code);
  if (!p) throw new ApiError(404, 'Ticket not found');

  const updated = await eventRepo.setCheckedIn(id, code);
  if (!updated) return { ok: true, already: true };

  return { ok: true, checked_in: true };
}

/* ===== WAITLIST ===== */

async function waitlist(id, user) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');
  assertOwnerOrAdmin(event, user);
  return eventRepo.listWaitlist(id);
}

async function acceptWaitlist(id, userIdToAccept, user) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');
  assertOwnerOrAdmin(event, user);

  const uid = Number(userIdToAccept);
  if (!uid) throw new ApiError(400, 'user_id required');

  const already = await eventRepo.getParticipant(id, uid);
  if (already) {
    await eventRepo.markWaitlistAccepted(id, uid);
    return { ok: true, already_joined: true, ticket_code: already.ticket_code || null };
  }

  const entry = await eventRepo.getWaitlistEntry(id, uid);
  if (!entry || entry.status !== 'waiting') throw new ApiError(404, 'Waitlist entry not found');

  const capacity = event.capacity == null ? null : Number(event.capacity);
  if (capacity != null) {
    const cnt = await eventRepo.countParticipants(id);
    if (cnt >= capacity) throw new ApiError(400, 'Event is still full');
  }

  // promo tekshir (waitlistdagi promo_code bo‘lsa)
  const promoCode = normalizePromoCode(entry.promo_code);
  let promo = null;
  if (promoCode) {
    promo = await eventRepo.getPromoByCode(id, promoCode);
    if (!promo || !promo.active) throw new ApiError(400, 'Invalid promo code');
    if (promo.usage_limit != null && Number(promo.used_count) >= Number(promo.usage_limit)) {
      throw new ApiError(400, 'Promo code limit reached');
    }
  }

  const ticketCode = crypto.randomBytes(16).toString('hex');
  const inserted = await eventRepo.addParticipantWithTicket(id, uid, ticketCode, promoCode);
  if (!inserted) {
    const p = await eventRepo.getParticipant(id, uid);
    await eventRepo.markWaitlistAccepted(id, uid);
    return { ok: true, joined: true, ticket_code: p?.ticket_code || null };
  }

  if (promo) {
    const ok = await eventRepo.incrementPromoUsage(promo.id);
    if (!ok) {
      await query('DELETE FROM event_participants WHERE event_id=? AND user_id=?', [id, uid]);
      throw new ApiError(400, 'Promo code limit reached');
    }
  }

  await eventRepo.markWaitlistAccepted(id, uid);
  return { ok: true, joined: true, ticket_code: ticketCode };
}

/* ===== PROMO CODES ===== */

async function promoList(id, user) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');
  assertOwnerOrAdmin(event, user);
  return eventRepo.listPromoCodes(id);
}

async function promoCreate(id, payload, user) {
  const event = await eventRepo.getEventById(id);
  if (!event) throw new ApiError(404, 'Event not found');
  assertOwnerOrAdmin(event, user);

  const code = normalizePromoCode(payload.code);
  if (!code) throw new ApiError(400, 'code required');

  const discountPercent = payload.discount_percent == null ? 0 : Number(payload.discount_percent);
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new ApiError(400, 'discount_percent must be 0..100');
  }

  const usageLimit = payload.usage_limit == null || payload.usage_limit === '' ? null : Number(payload.usage_limit);
  if (usageLimit != null && (!Number.isFinite(usageLimit) || usageLimit <= 0)) {
    throw new ApiError(400, 'usage_limit must be positive');
  }

  try {
    const idNew = await eventRepo.createPromoCode(id, {
      code,
      discount_percent: discountPercent,
      usage_limit: usageLimit,
      active: 1
    });
    return { ok: true, id: idNew, code, discount_percent: discountPercent, usage_limit: usageLimit };
  } catch (e) {
    // duplicate
    if (String(e?.code) === 'ER_DUP_ENTRY') throw new ApiError(400, 'Promo code already exists');
    throw e;
  }
}

/* ===== CRUD ===== */

async function create(payload, organizer_id) {
  const st = toMysqlDatetime(payload.start_time);
  const et = toMysqlDatetime(payload.end_time);

  if (!st || !et) throw new ApiError(400, 'Invalid date format');
  if (new Date(payload.start_time) >= new Date(payload.end_time)) {
    throw new ApiError(400, 'end_time must be after start_time');
  }

const images = Array.isArray(payload.images) ? payload.images : [];
  const category = payload.category ? String(payload.category).slice(0, 50) : 'General';
  let images_json = null;
  try { images_json = images.length ? JSON.stringify(images) : null; } catch { images_json = null; }

  const id = await eventRepo.createEvent({
    title: payload.title,
    description: payload.description,
    organizer_id,
    start_time: st,
    end_time: et,
    location: payload.location ?? null,
    capacity: payload.capacity ?? null,
    category,
    images_json
  });


  return get(id);
}

async function update(id, patch, user) {
  const existing = await eventRepo.getEventById(id);
  if (!existing) throw new ApiError(404, 'Event not found');

  const isOwner = Number(existing.organizer_id) === Number(user.id);
  if (!['admin','super_admin'].includes(user.role) && !isOwner) throw new ApiError(403, 'Forbidden');

  const dbPatch = { ...patch };

  // map UI fields -> DB columns
  if (Object.prototype.hasOwnProperty.call(dbPatch, 'images')) {
    const images = Array.isArray(dbPatch.images) ? dbPatch.images : [];
    try { dbPatch.images_json = images.length ? JSON.stringify(images) : null; } catch { dbPatch.images_json = null; }
    delete dbPatch.images;
  }
  if (Object.prototype.hasOwnProperty.call(dbPatch, 'category')) {
    dbPatch.category = dbPatch.category ? String(dbPatch.category).slice(0, 50) : 'General';
  }


  if (dbPatch.start_time) {
    const st = toMysqlDatetime(dbPatch.start_time);
    if (!st) throw new ApiError(400, 'Invalid start_time');
    dbPatch.start_time = st;
  }

  if (dbPatch.end_time) {
    const et = toMysqlDatetime(dbPatch.end_time);
    if (!et) throw new ApiError(400, 'Invalid end_time');
    dbPatch.end_time = et;
  }

  await eventRepo.updateEvent(id, dbPatch);
  return get(id);
}

async function remove(id, user) {
  const existing = await eventRepo.getEventById(id);
  if (!existing) throw new ApiError(404, 'Event not found');

  const isOwner = Number(existing.organizer_id) === Number(user.id);
  if (!['admin','super_admin'].includes(user.role) && !isOwner) throw new ApiError(403, 'Forbidden');

  await eventRepo.deleteEvent(id);
  return { ok: true };
}

module.exports = {
  list,
  get,
  bumpView,

  join,
  myTicket,
  participants,
  checkin,

  waitlist,
  acceptWaitlist,

  promoList,
  promoCreate,

  create,
  update,
  remove
};
