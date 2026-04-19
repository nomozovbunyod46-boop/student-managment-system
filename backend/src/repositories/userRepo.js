const { query } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await query('SELECT * FROM users WHERE email=?', [email]);
  return rows[0] || null;
}

async function createUser({ name, email, password_hash, role, is_organizer = 0 }) {
  const [result] = await query(
    'INSERT INTO users (name,email,password_hash,role,is_organizer) VALUES (?,?,?,?,?)',
    [name, email, password_hash, role, is_organizer ? 1 : 0]
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await query('SELECT * FROM users WHERE id=?', [id]);
  return rows[0] || null;
}

// Public-safe user profile (NO email, NO password)
async function findPublicById(id) {
  const [rows] = await query(
    'SELECT id, name, role, is_organizer, organizer_verified, avatar_url, created_at FROM users WHERE id=?',
    [id]
  );
  return rows[0] || null;
}


async function updateAvatar(id, avatar_url) {
  const [result] = await query('UPDATE users SET avatar_url=? WHERE id=?', [avatar_url, id]);
  return result.affectedRows;
}

async function listOrganizers() {
  const [rows] = await query('SELECT id,name,email,role,is_organizer,avatar_url,organizer_verified FROM users WHERE is_organizer=1 ORDER BY id DESC');
  return rows;
}

module.exports = {
  findByEmail,
  createUser,
  findById,
  findPublicById,
  updateAvatar,
  listOrganizers,
};
