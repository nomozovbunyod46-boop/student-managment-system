const request = require('supertest');
const app = require('../../src/app');
const { getPool } = require('../../src/config/db');

async function registerUser({ name, email, role = 'participant' }) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'Passw0rd!', role });
  expect(res.status).toBe(201);
  return res.body;
}

async function createEvent(token, payload) {
  const res = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  expect(res.status).toBe(201);
  return res.body;
}

async function createPromo(token, eventId, payload) {
  const res = await request(app)
    .post(`/api/events/${eventId}/promo-codes`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  expect(res.status).toBe(200);
  return res.body;
}

describe('promo usage integration', () => {
  test('concurrent joins with promo usage_limit=1 only allow one participant', async () => {
    const organizer = await registerUser({ name: 'Org', email: 'org1@test.local', role: 'organizer' });
    const userA = await registerUser({ name: 'User A', email: 'a@test.local' });
    const userB = await registerUser({ name: 'User B', email: 'b@test.local' });

    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const event = await createEvent(organizer.token, {
      title: 'Promo Race',
      description: 'Test event',
      start_time: start,
      end_time: end,
      location: 'Test',
      category: 'General',
      images: ['https://example.com/a.jpg']
    });

    await createPromo(organizer.token, event.id, {
      code: 'SAVE10',
      discount_percent: 0,
      usage_limit: 1
    });

    const joinA = request(app)
      .post(`/api/events/${event.id}/join`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ promo_code: 'SAVE10' });

    const joinB = request(app)
      .post(`/api/events/${event.id}/join`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ promo_code: 'SAVE10' });

    const [resA, resB] = await Promise.all([joinA, joinB]);
    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 400]);

    const db = getPool();
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM event_participants WHERE event_id=?', [event.id]);
    const [promoRows] = await db.query('SELECT used_count FROM promo_codes WHERE event_id=? AND code=?', [event.id, 'SAVE10']);
    expect(rows[0].cnt).toBe(1);
    expect(promoRows[0].used_count).toBe(1);
  });

  test('acceptWaitlist respects promo usage_limit with concurrent accepts', async () => {
    const organizer = await registerUser({ name: 'Org2', email: 'org2@test.local', role: 'organizer' });
    const userA = await registerUser({ name: 'User A2', email: 'a2@test.local' });
    const userB = await registerUser({ name: 'User B2', email: 'b2@test.local' });
    const userC = await registerUser({ name: 'User C2', email: 'c2@test.local' });
    const userD = await registerUser({ name: 'User D2', email: 'd2@test.local' });

    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const event = await createEvent(organizer.token, {
      title: 'Waitlist Promo',
      description: 'Test event 2',
      start_time: start,
      end_time: end,
      location: 'Test',
      category: 'General',
      images: ['https://example.com/b.jpg'],
      capacity: 2
    });

    await createPromo(organizer.token, event.id, {
      code: 'WAIT10',
      discount_percent: 0,
      usage_limit: 1
    });

    // Fill capacity
    await request(app)
      .post(`/api/events/${event.id}/join`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send();
    await request(app)
      .post(`/api/events/${event.id}/join`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send();

    // Create waitlist entries with promo
    await request(app)
      .post(`/api/events/${event.id}/join`)
      .set('Authorization', `Bearer ${userC.token}`)
      .send({ promo_code: 'WAIT10' });
    await request(app)
      .post(`/api/events/${event.id}/join`)
      .set('Authorization', `Bearer ${userD.token}`)
      .send({ promo_code: 'WAIT10' });

    // Increase capacity so accept can proceed
    const db = getPool();
    await db.query('UPDATE events SET capacity=? WHERE id=?', [3, event.id]);

    const acceptC = request(app)
      .post(`/api/events/${event.id}/waitlist/accept`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ user_id: userC.user.id });

    const acceptD = request(app)
      .post(`/api/events/${event.id}/waitlist/accept`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ user_id: userD.user.id });

    const [resC, resD] = await Promise.all([acceptC, acceptD]);
    const statuses = [resC.status, resD.status].sort();
    expect(statuses).toEqual([200, 400]);

    const [countRows] = await db.query('SELECT COUNT(*) as cnt FROM event_participants WHERE event_id=?', [event.id]);
    const [promoRows] = await db.query('SELECT used_count FROM promo_codes WHERE event_id=? AND code=?', [event.id, 'WAIT10']);
    expect(countRows[0].cnt).toBe(3);
    expect(promoRows[0].used_count).toBe(1);

    const [waitRows] = await db.query(
      'SELECT user_id, status FROM event_waitlist WHERE event_id=? AND user_id IN (?,?) ORDER BY user_id',
      [event.id, userC.user.id, userD.user.id]
    );
    const statusesByUser = Object.fromEntries(waitRows.map((r) => [r.user_id, r.status]));
    const statusValues = [statusesByUser[userC.user.id], statusesByUser[userD.user.id]].sort();
    expect(statusValues).toEqual(['accepted', 'waiting']);
  });
});

describe('leave event integration', () => {
  test('leave removes participant and decrements promo usage', async () => {
    const organizer = await registerUser({ name: 'OrgLeave', email: 'orgleave@test.local', role: 'organizer' });
    const user = await registerUser({ name: 'User Leave', email: 'leave@test.local' });

    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const event = await createEvent(organizer.token, {
      title: 'Leave Event',
      description: 'Test leave',
      start_time: start,
      end_time: end,
      location: 'Test',
      category: 'General',
      images: ['https://example.com/c.jpg']
    });

    await createPromo(organizer.token, event.id, {
      code: 'LEAVE10',
      discount_percent: 0,
      usage_limit: 5
    });

    await request(app)
      .post(`/api/events/${event.id}/join`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ promo_code: 'LEAVE10' });

    const leaveRes = await request(app)
      .post(`/api/events/${event.id}/leave`)
      .set('Authorization', `Bearer ${user.token}`)
      .send();

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.ok).toBe(true);
    expect(leaveRes.body.left).toBe(true);

    const db = getPool();
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM event_participants WHERE event_id=?', [event.id]);
    const [promoRows] = await db.query('SELECT used_count FROM promo_codes WHERE event_id=? AND code=?', [event.id, 'LEAVE10']);
    expect(rows[0].cnt).toBe(0);
    expect(promoRows[0].used_count).toBe(0);
  });

  test('leave handles not-joined and organizer cases', async () => {
    const organizer = await registerUser({ name: 'OrgLeave2', email: 'orgleave2@test.local', role: 'organizer' });
    const user = await registerUser({ name: 'User Leave2', email: 'leave2@test.local' });

    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const event = await createEvent(organizer.token, {
      title: 'Leave Event 2',
      description: 'Test leave 2',
      start_time: start,
      end_time: end,
      location: 'Test',
      category: 'General',
      images: ['https://example.com/d.jpg']
    });

    const notJoinedRes = await request(app)
      .post(`/api/events/${event.id}/leave`)
      .set('Authorization', `Bearer ${user.token}`)
      .send();

    expect(notJoinedRes.status).toBe(200);
    expect(notJoinedRes.body.ok).toBe(true);
    expect(notJoinedRes.body.left).toBe(false);

    const organizerLeave = await request(app)
      .post(`/api/events/${event.id}/leave`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send();

    expect(organizerLeave.status).toBe(400);
  });
});
