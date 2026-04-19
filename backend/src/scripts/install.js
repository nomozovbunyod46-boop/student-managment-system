const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { initDB, getPool } = require('../config/db');

async function addColumnIfMissing(db, table, columnName, columnSQL) {
  const [rows] = await db.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
    [env.DB_NAME, table, columnName]
  );
  if (rows.length) return;
  await db.query('ALTER TABLE ' + table + ' ADD COLUMN ' + columnSQL);
}

async function addIndexIfMissing(db, table, indexName, indexSQL) {
  const [rows] = await db.query(
    'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=? LIMIT 1',
    [env.DB_NAME, table, indexName]
  );
  if (rows.length) return;
  await db.query('ALTER TABLE ' + table + ' ADD ' + indexSQL);
}

(async () => {
  await initDB({ createDB: true });
  const db = getPool();

  // ==== core tables ====
  await db.query(
    'CREATE TABLE IF NOT EXISTS users (\n' +
      '  id INT AUTO_INCREMENT PRIMARY KEY,\n' +
      '  name VARCHAR(100) NOT NULL,\n' +
      '  email VARCHAR(255) NOT NULL UNIQUE,\n' +
      '  password_hash VARCHAR(255) NOT NULL,\n' +
      '  role VARCHAR(20) NOT NULL DEFAULT "participant",\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n' +
      ')'
  );

  await db.query(
    'CREATE TABLE IF NOT EXISTS events (\n' +
      '  id INT AUTO_INCREMENT PRIMARY KEY,\n' +
      '  title VARCHAR(255) NOT NULL,\n' +
      '  description TEXT,\n' +
      '  organizer_id INT NOT NULL,\n' +
      '  start_time DATETIME NOT NULL,\n' +
      '  end_time DATETIME NOT NULL,\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  CONSTRAINT fk_events_org FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE\n' +
      ')'
  );

  await db.query(
    'CREATE TABLE IF NOT EXISTS event_participants (\n' +
      '  event_id INT NOT NULL,\n' +
      '  user_id INT NOT NULL,\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  PRIMARY KEY (event_id, user_id),\n' +
      '  CONSTRAINT fk_ep_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,\n' +
      '  CONSTRAINT fk_ep_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n' +
      ')'
  );


  // ==== user columns ====
  await addColumnIfMissing(db, 'users', 'avatar_url', 'avatar_url VARCHAR(512) NULL');
  await addColumnIfMissing(db, 'users', 'organizer_verified', 'organizer_verified TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'users', 'is_organizer', 'is_organizer TINYINT(1) NOT NULL DEFAULT 0');
  // ==== event columns ====
  await addColumnIfMissing(db, 'events', 'location', 'location VARCHAR(255) NULL');
  await addColumnIfMissing(db, 'events', 'capacity', 'capacity INT NULL');
  await addColumnIfMissing(db, 'events', 'updated_at', 'updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');
  await addColumnIfMissing(db, 'events', 'views', 'views INT NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'events', 'category', 'category VARCHAR(50) NOT NULL DEFAULT "General"');
  await addColumnIfMissing(db, 'events', 'images_json', 'images_json TEXT NULL');

  // ==== participants columns (QR + promo) ====
  await addColumnIfMissing(db, 'event_participants', 'ticket_code', 'ticket_code VARCHAR(64) NULL');
  await addColumnIfMissing(db, 'event_participants', 'checked_in_at', 'checked_in_at DATETIME NULL');
  await addColumnIfMissing(db, 'event_participants', 'promo_code', 'promo_code VARCHAR(32) NULL');

  await addIndexIfMissing(db, 'event_participants', 'uq_event_participants_ticket_code', 'UNIQUE INDEX uq_event_participants_ticket_code (ticket_code)');

  // ==== unique views table ====
  await db.query(
    'CREATE TABLE IF NOT EXISTS event_views (\n' +
      '  event_id INT NOT NULL,\n' +
      '  user_id INT NOT NULL,\n' +
      '  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  PRIMARY KEY (event_id, user_id),\n' +
      '  CONSTRAINT fk_ev_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,\n' +
      '  CONSTRAINT fk_ev_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n' +
      ')'
  );

  // ==== waitlist ====
  await db.query(
    'CREATE TABLE IF NOT EXISTS event_waitlist (\n' +
      '  event_id INT NOT NULL,\n' +
      '  user_id INT NOT NULL,\n' +
      '  promo_code VARCHAR(32) NULL,\n' +
      '  status VARCHAR(20) NOT NULL DEFAULT "waiting",\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  accepted_at DATETIME NULL,\n' +
      '  PRIMARY KEY (event_id, user_id),\n' +
      '  CONSTRAINT fk_ew_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,\n' +
      '  CONSTRAINT fk_ew_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n' +
      ')'
  );

  // ==== promo codes ====
  await db.query(
    'CREATE TABLE IF NOT EXISTS promo_codes (\n' +
      '  id INT AUTO_INCREMENT PRIMARY KEY,\n' +
      '  event_id INT NOT NULL,\n' +
      '  code VARCHAR(32) NOT NULL,\n' +
      '  discount_percent INT NOT NULL DEFAULT 0,\n' +
      '  usage_limit INT NULL,\n' +
      '  used_count INT NOT NULL DEFAULT 0,\n' +
      '  active TINYINT(1) NOT NULL DEFAULT 1,\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  UNIQUE KEY uq_promo_event_code (event_id, code),\n' +
      '  CONSTRAINT fk_promo_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE\n' +
      ')'
  );

