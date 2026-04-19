const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const sanitizeUser = require('../utils/sanitizeUser');
const userRepo = require('../repositories/userRepo');

async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new ApiError(400, 'User not found');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new ApiError(400, 'Wrong password');

  const safe = sanitizeUser(user);
  const token = signToken({ id: safe.id, role: safe.role, email: safe.email, is_organizer: safe.is_organizer ? 1 : 0 });
  return { token, user: safe };
}

async function register({ name, email, password, role }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new ApiError(409, 'Email already in use');

  // Organizer is an account-type flag, not a system role.
  let is_organizer = 0;
  let safeRole = role || 'participant';
  if (safeRole === 'organizer') {
    safeRole = 'participant';
    is_organizer = 1;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = await userRepo.createUser({ name, email, password_hash, role: safeRole, is_organizer });
  const user = await userRepo.findById(id);
  const safe = sanitizeUser(user);
  const token = signToken({ id: safe.id, role: safe.role, email: safe.email, is_organizer: safe.is_organizer ? 1 : 0 });
  return { token, user: safe };
}

async function verifyAndRegister({ email, code, name, password, role }) {
  const verificationCodeService = require('./verificationCodeService');
  const savedCode = verificationCodeService.getCode(email);
  if (!savedCode || savedCode !== code) {
    throw new ApiError(400, 'Invalid or expired verification code');
  }
  verificationCodeService.deleteCode(email);
  return register({ name, email, password, role });
}

module.exports = { login, register, verifyAndRegister };
