const { query } = require('../config/db');

async function createDirectMessage({ sender_id, receiver_id, message }) {
  const [result] = await query(
    'INSERT INTO direct_messages (sender_id, receiver_id, message) VALUES (?,?,?)',
    [sender_id, receiver_id, message]
  );
  return result.insertId;
}

async function listInbox(receiver_id) {
  const [rows] = await query(
    'SELECT dm.id, dm.sender_id, dm.receiver_id, dm.message, dm.created_at, ' +
      'u.name AS sender_name, COALESCE(u.profile_picture, u.avatar_url) AS sender_avatar ' +
      'FROM direct_messages dm ' +
      'JOIN users u ON dm.sender_id = u.id ' +
      'WHERE dm.receiver_id = ? ' +
      'ORDER BY dm.created_at DESC',
    [receiver_id]
  );
  return rows;
}

module.exports = { createDirectMessage, listInbox };
