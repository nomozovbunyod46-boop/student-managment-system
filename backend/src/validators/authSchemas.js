const { z } = require('zod');

const email = z.string().email();
const password = z.string().min(8).max(72);

const loginSchema = z.object({ email, password });

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email,
  password,
  role: z.enum(['participant', 'organizer']).optional().default('participant')
});

const sendVerificationCodeSchema = z.object({ email });
const verifyAndRegisterSchema = z.object({
  email,
  code: z.string().length(6),
  name: z.string().min(2).max(100),
  password,
  role: z.enum(['participant', 'organizer']).optional().default('participant')
});

module.exports = { loginSchema, registerSchema, sendVerificationCodeSchema, verifyAndRegisterSchema };
