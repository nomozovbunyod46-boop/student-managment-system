const path = require('path');
const fs = require('fs');
const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Event images are stored here:
// backend/uploads/events/<filename>
const EVENT_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'events');

function ensureDir() {
  try {
    fs.mkdirSync(EVENT_UPLOAD_DIR, { recursive: true });
  } catch (_) {
    // ignore
  }
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    ensureDir();
    cb(null, EVENT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const name = `eventimg_${req.user.id}_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  }
});

function fileFilter(_req, file, cb) {
  const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
  cb(ok ? null : new ApiError(400, 'Event image must be jpg/png/webp'), ok);
}

// max 1 image, 8MB
const upload = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

exports.uploadEventImagesMulti = upload.array('images', 1);

exports.uploadEventImages = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) throw new ApiError(400, 'images files required');

  const urls = files.map((f) => `/uploads/events/${f.filename}`);
  res.json({ urls });
});
