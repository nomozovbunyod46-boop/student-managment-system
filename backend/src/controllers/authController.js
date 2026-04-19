const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const verificationCodeService = require('../services/verificationCodeService');
const emailService = require('../services/emailService');

exports.login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.json({ token, user });
});

exports.register = asyncHandler(async (req, res) => {
  const { token, user } = await authService.register(req.body);
  res.status(201).json({ token, user });
});

exports.sendVerificationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userRepo = require('../repositories/userRepo');
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }
  const code = verificationCodeService.generateCode();
  verificationCodeService.setCode(email, code);

  const emailSent = await emailService.sendVerificationEmail(email, code);
  if (emailSent) {
    res.json({ sent: true });
  } else {
    // SMTP sozlanmagan bo'lsa: dev uchun kod javobda (faqat development)
    if (process.env.NODE_ENV === 'development') {
      res.json({ sent: true, code });
    } else {
      res.status(503).json({ message: 'Email service not configured. Contact support.' });
    }
  }
});

exports.verifyAndRegister = asyncHandler(async (req, res) => {
  const { token, user } = await authService.verifyAndRegister(req.body);
  res.status(201).json({ token, user });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
