const path = require('path');
const fs = require('fs');
const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const userRepo = require('../repositories/userRepo');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');

function ensureUploadDir() {
  try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {}
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg','.jpeg','.png','.webp'].includes(ext) ? ext : '.jpg';
    const name = `avatar_${req.user.id}_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  const ok = ['image/jpeg','image/png','image/webp'].includes(file.mimetype);
  cb(ok ? null : new ApiError(400, 'Avatar must be jpg/png/webp'), ok);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

exports.uploadAvatarSingle = upload.single('avatar');

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'avatar file required');

  const urlPath = `/uploads/avatars/${req.file.filename}`;
  await userRepo.updateAvatar(req.user.id, urlPath);

  // update req.user so /me reflects immediately
  req.user.avatar_url = urlPath;

  res.json({ avatar_url: urlPath });
});

exports.listOrganizers = asyncHandler(async (req, res) => {
  const rows = await userRepo.listOrganizers();
  res.json(rows);
});

// Public profile: safe fields only (NO email, NO password hash)
exports.getPublicUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw new ApiError(400, 'Invalid user id');

  const u = await userRepo.findPublicById(id);
  if (!u) throw new ApiError(404, 'User not found');

  res.json(u);
});
exports.getMe = asyncHandler(async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  // password_hash ni olib tashlash shart bo‘lsa sanitize qiling (hozir sanitize util bor)
  const sanitizeUser = require('../utils/sanitizeUser');
  res.json(sanitizeUser(user));
});

