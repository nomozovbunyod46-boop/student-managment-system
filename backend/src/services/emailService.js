const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM
} = process.env;

let transporter = null;

function isEmailConfigured() {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isEmailConfigured()) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  return transporter;
}

/**
 * Tasdiqlash kodini emailga yuboradi.
 * @param {string} to - Qabul qiluvchi email
 * @param {string} code - 6 xonali kod
 * @returns {Promise<boolean>} - Muvaffaqiyatli yuborilsa true
 */
async function sendVerificationEmail(to, code) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('Email not configured (SMTP). Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return false;
  }
  const from = EMAIL_FROM || SMTP_USER;
  await transport.sendMail({
    from: `"Nomozov Events" <${from}>`,
    to,
    subject: 'Tasdiqlash kodingiz',
    text: `Sizning tasdiqlash kodingiz: ${code}. Kod 10 daqiqa amal qiladi.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Tasdiqlash kodi</h2>
        <p>Hisob yaratish uchun quyidagi kodni kiriting:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${code}</p>
        <p style="color: #64748b; font-size: 14px;">Kod 10 daqiqa amal qiladi.</p>
      </div>
    `
  });
  return true;
}

module.exports = {
  isEmailConfigured,
  sendVerificationEmail
};
