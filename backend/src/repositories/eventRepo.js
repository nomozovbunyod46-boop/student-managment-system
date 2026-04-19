const { query } = require('../config/db');

async function listEvents() {
  const [rows] = await query(
    'SELECT e.*, u.name as organizer_name, u.avatar_url as organizer_avatar_url, u.organizer_verified as organizer_verified FROM events e LEFT JOIN users u ON e.organizer_id=u.id ORDER BY e.start_time DESC'

  );
  return rows;
}

async function getEventById(id) {
  const [rows] = await query(
    'SELECT e.*, u.name as organizer_name, u.avatar_url as organizer_avatar_url, u.organizer_verified as organizer_verified FROM events e LEFT JOIN users u ON e.organizer_id=u.id WHERE e.id=?',
    [id]
  );
  return rows[0] || null;
}

async function createEvent({ title, description, organizer_id, start_time, end_time, location = null, capacity = null, category = 'General', images_json = null }) {
  const [result] = await query(
    'INSERT INTO events (title,description,organizer_id,start_time,end_time,location,capacity,category,images_json) VALUES (?,?,?,?,?,?,?,?,?)',
    [title, description, organizer_id, start_time, end_time, location, capacity, category, images_json]
  );
  return result.insertId;
}


async function updateEvent(id, patch) {
  const keys = Object.keys(patch);
  if (!keys.length) return 0;

  const set = keys.map((k) => `${k}=?`).join(', ');
  const vals = keys.map((k) => patch[k]);
  vals.push(id);

  const [result] = await query(`UPDATE events SET ${set} WHERE id=?`, vals);
  return result.affectedRows;
}

async function deleteEvent(id) {
  const [result] = await query('DELETE FROM events WHERE id=?', [id]);
  return result.affectedRows;
}

// ✅ views +1
async function incrementViews(id) {
  const [result] = await query('UPDATE events SET views = views + 1 WHERE id=?', [id]);
  return result.affectedRows;
}

// ✅ hozirgi views ni olish
async function getViews(id) {
  const [rows] = await query('SELECT views FROM events WHERE id=?', [id]);
  return rows[0] ? rows[0].views : 0;
}

// ✅ participants count (capacity uchun)
async function countParticipants(eventId) {
  const [rows] = await query('SELECT COUNT(*) as cnt FROM event_participants WHERE event_id=?', [eventId]);
  return rows[0]?.cnt ?? 0;
}

// ✅ participants (legacy join uchun ham qolsin)
async function addParticipant(eventId, userId) {
  const [result] = await query(
    'INSERT IGNORE INTO event_participants (event_id, user_id) VALUES (?,?)',
    [eventId, userId]
  );
  return result.affectedRows;
}

// ✅ har user uchun faqat 1 marta view yozish
async function addViewOnce(eventId, userId) {
  const [result] = await query(
    'INSERT IGNORE INTO event_views (event_id, user_id) VALUES (?,?)',
    [eventId, userId]
  );
  return result.affectedRows; // 1 = yangi, 0 = oldin bor
}

/* ===========================
   ✅ QR TICKET + CHECK-IN
   =========================== */

// ✅ join qilganda ticket_code bilan yozish
async function addParticipantWithTicket(eventId, userId, ticketCode, promoCode = null) {
  const [result] = await query(
    'INSERT IGNORE INTO event_participants (event_id, user_id, ticket_code, promo_code) VALUES (?,?,?,?)',
    [eventId, userId, ticketCode, promoCode]
  );
  return result.affectedRows; // 1 = yangi, 0 = oldin bor
}

// ✅ user shu eventga join bo‘lganmi? (ticket_code ni olish uchun)
async function getParticipant(eventId, userId) {
  const [rows] = await query(
    'SELECT * FROM event_participants WHERE event_id=? AND user_id=?',
    [eventId, userId]
  );
  return rows[0] || null;
}

// ✅ ticket_code bo‘yicha participant topish
async function getParticipantByTicket(eventId, ticketCode) {
  const [rows] = await query(
    'SELECT * FROM event_participants WHERE event_id=? AND ticket_code=?',
    [eventId, ticketCode]
  );
  return rows[0] || null;
}

// ✅ check-in qilish (faqat 1 marta)
async function setCheckedIn(eventId, ticketCode) {
  const [result] = await query(
    'UPDATE event_participants SET checked_in_at=NOW() WHERE event_id=? AND ticket_code=? AND checked_in_at IS NULL',
    [eventId, ticketCode]
  );
  return result.affectedRows; // 1 = check-in bo‘ldi, 0 = oldin bo‘lgan yoki topilmadi
}

// ✅ organizer uchun participants ro‘yxati
async function listParticipants(eventId) {
  const [rows] = await query(
    `SELECT ep.user_id, ep.ticket_code, ep.checked_in_at, ep.promo_code, ep.created_at,
            u.name, u.email
     FROM event_participants ep
     LEFT JOIN users u ON u.id = ep.user_id
     WHERE ep.event_id=?
     ORDER BY ep.created_at DESC`,
    [eventId]
  );
  return rows;
}

/* ===========================
   ✅ WAITLIST
   =========================== */

async function addToWaitlist(eventId, userId, promoCode = null) {
  const [result] = await query(
    'INSERT IGNORE INTO event_waitlist (event_id, user_id, promo_code, status) VALUES (?,?,?, "waiting")',
    [eventId, userId, promoCode]
  );
  return result.affectedRows;
}

async function getWaitlistEntry(eventId, userId) {
  const [rows] = await query(
    'SELECT * FROM event_waitlist WHERE event_id=? AND user_id=?',
    [eventId, userId]
  );
  return rows[0] || null;
}

async function listWaitlist(eventId) {
  const [rows] = await query(
    `SELECT w.user_id, w.status, w.promo_code, w.created_at, w.accepted_at,
            u.name, u.email
     FROM event_waitlist w
     LEFT JOIN users u ON u.id = w.user_id
     WHERE w.event_id=? AND w.status="waiting"
     ORDER BY w.created_at ASC`,
    [eventId]
  );
  return rows;
}

async function markWaitlistAccepted(eventId, userId) {
  const [result] = await query(
    'UPDATE event_waitlist SET status="accepted", accepted_at=NOW() WHERE event_id=? AND user_id=? AND status="waiting"',
    [eventId, userId]
  );
  return result.affectedRows;
}

/* ===========================
   ✅ PROMO CODES
   =========================== */

async function getPromoByCode(eventId, code) {
  const [rows] = await query(
    'SELECT * FROM promo_codes WHERE event_id=? AND code=?',
    [eventId, code]
  );
  return rows[0] || null;
}

async function listPromoCodes(eventId) {
  const [rows] = await query(
    'SELECT id, code, discount_percent, usage_limit, used_count, active, created_at FROM promo_codes WHERE event_id=? ORDER BY created_at DESC',
    [eventId]
  );
  return rows;
}

async function createPromoCode(eventId, { code, discount_percent = 0, usage_limit = null, active = 1 }) {
  const [result] = await query(
    'INSERT INTO promo_codes (event_id, code, discount_percent, usage_limit, used_count, active) VALUES (?,?,?,?,0,?)',
    [eventId, code, discount_percent, usage_limit, active]
  );
  return result.insertId;
}

async function incrementPromoUsage(promoId) {
  const [result] = await query(
    'UPDATE promo_codes SET used_count = used_count + 1 WHERE id=? AND active=1 AND (usage_limit IS NULL OR used_count < usage_limit)',
    [promoId]
  );
  return result.affectedRows;
}

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  incrementViews,
  getViews,

  countParticipants,
  addParticipant,
  addViewOnce,

  // QR + check-in
  addParticipantWithTicket,
  getParticipant,
  getParticipantByTicket,
  setCheckedIn,
  listParticipants,

  // waitlist
  addToWaitlist,
  getWaitlistEntry,
  listWaitlist,
  markWaitlistAccepted,

  // promo
  getPromoByCode,
  listPromoCodes,
  createPromoCode,
  incrementPromoUsage
};
