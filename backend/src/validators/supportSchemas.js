const { z } = require('zod');

const supportCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  message: z.string().min(10).max(2000)
});

module.exports = { supportCreateSchema };
