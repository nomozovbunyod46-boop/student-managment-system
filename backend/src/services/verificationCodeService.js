// In-memory store: email -> { code, expiresAt }
const store = new Map();

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function setCode(email, code) {
  store.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + CODE_EXPIRY_MS
  });
}

function getCode(email) {
  const entry = store.get(email.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase());
    return null;
  }
  return entry.code;
}

function deleteCode(email) {
  store.delete(email.toLowerCase());
}

module.exports = {
  generateCode,
  setCode,
  getCode,
  deleteCode,
  CODE_EXPIRY_MS
};
