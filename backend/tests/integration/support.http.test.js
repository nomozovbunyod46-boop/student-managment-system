const request = require('supertest');
const app = require('../../src/app');
const { getPool } = require('../../src/config/db');

describe('support endpoint integration', () => {
  test('creates support message and stores it', async () => {
    const payload = {
      name: 'Test User',
      email: 'support@test.local',
      message: 'I need help with my event registration.'
    };

    const res = await request(app).post('/api/support').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.id).toBe('number');

    const db = getPool();
    const [rows] = await db.query('SELECT name,email,message FROM support_messages WHERE id=?', [res.body.id]);
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe(payload.name);
    expect(rows[0].email).toBe(payload.email);
    expect(rows[0].message).toBe(payload.message);
  });
});
