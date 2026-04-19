const mysql = require('mysql2/promise');
const env = require('./env');

let pool;

async function initDB({ createDB = false } = {}) {
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD
  });

  if (createDB) {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  }

  await conn.end();

  pool = mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });

  return pool;
}

function getPool() {
  if (!pool) throw new Error('DB not initialized. Call initDB() before getPool().');
  return pool;
}

async function query(sql, params = []) {
  const db = getPool();
  return db.query(sql, params);
}

module.exports = { initDB, getPool, query };
