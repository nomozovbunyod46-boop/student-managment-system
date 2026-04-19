const { query } = require('../config/db');

async function createSupportMessage({ name, email, message }) {
  const [result] = await query(
    'INSERT INTO support_messages (name, email, message) VALUES (?,?,?)',
    [name, email, message]
  );
  return result.insertId;
}

module.exports = { createSupportMessage };
