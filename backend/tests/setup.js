const path = require('path');
const dotenv = require('dotenv');
const { initDB, getPool } = require('../src/config/db');

dotenv.config({ path: path.join(__dirname, '..', '.env.test') });
process.env.NODE_ENV = 'test';

async function ensureSchema(db) {
  await db.query(
    'CREATE TABLE IF NOT EXISTS users (\n' +
      '  id INT AUTO_INCREMENT PRIMARY KEY,\n' +
      '  name VARCHAR(100) NOT NULL,\n' +
      '  email VARCHAR(255) NOT NULL UNIQUE,\n' +
      '  password_hash VARCHAR(255) NOT NULL,\n' +
      '  role VARCHAR(20) NOT NULL DEFAULT "participant",\n' +
      '  is_organizer TINYINT(1) NOT NULL DEFAULT 0,\n' +
      '  avatar_url VARCHAR(512) NULL,\n' +
      '  profile_picture VARCHAR(512) NULL,\n' +
      '  last_active_at DATETIME NULL,\n' +
      '  organizer_verified TINYINT(1) NOT NULL DEFAULT 0,\n' +
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
      '  location VARCHAR(255) NULL,\n' +
      '  capacity INT NULL,\n' +
      '  views INT NOT NULL DEFAULT 0,\n' +
      '  category VARCHAR(50) NOT NULL DEFAULT "General",\n' +
      '  images_json TEXT NULL,\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,\n' +
      '  CONSTRAINT fk_events_org FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE\n' +
      ')'
  );

  await db.query(
    'CREATE TABLE IF NOT EXISTS event_participants (\n' +
      '  event_id INT NOT NULL,\n' +
      '  user_id INT NOT NULL,\n' +
      '  ticket_code VARCHAR(64) NULL,\n' +
      '  checked_in_at DATETIME NULL,\n' +
      '  promo_code VARCHAR(32) NULL,\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  PRIMARY KEY (event_id, user_id),\n' +
      '  CONSTRAINT fk_ep_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,\n' +
      '  CONSTRAINT fk_ep_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n' +
      ')'
  );

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

  await db.query(
    'CREATE TABLE IF NOT EXISTS support_messages (\n' +
      '  id INT AUTO_INCREMENT PRIMARY KEY,\n' +
      '  name VARCHAR(100) NOT NULL,\n' +
      '  email VARCHAR(255) NOT NULL,\n' +
      '  message TEXT NOT NULL,\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n' +
      ')'
  );

  await db.query(
    'CREATE TABLE IF NOT EXISTS direct_messages (\n' +
      '  id INT AUTO_INCREMENT PRIMARY KEY,\n' +
      '  sender_id INT NOT NULL,\n' +
      '  receiver_id INT NOT NULL,\n' +
      '  message TEXT NOT NULL,\n' +
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  CONSTRAINT fk_dm_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,\n' +
      '  CONSTRAINT fk_dm_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE\n' +
      ')'
  );
}

async function resetData(db) {
  await db.query('SET FOREIGN_KEY_CHECKS=0');
  await db.query('TRUNCATE TABLE promo_codes');
  await db.query('TRUNCATE TABLE event_waitlist');
  await db.query('TRUNCATE TABLE event_participants');
  await db.query('TRUNCATE TABLE events');
  await db.query('TRUNCATE TABLE support_messages');
  await db.query('TRUNCATE TABLE direct_messages');
  await db.query('TRUNCATE TABLE users');
  await db.query('SET FOREIGN_KEY_CHECKS=1');
}

beforeAll(async () => {
  await initDB({ createDB: true });
  const db = getPool();
  await ensureSchema(db);
});

beforeEach(async () => {
  const db = getPool();
  await resetData(db);
});

afterAll(async () => {
  const db = getPool();
  await db.end();
});
