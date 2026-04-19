const { z } = require('zod');

const directMessageCreateSchema = z.object({
  receiver_id: z.coerce.number().int().positive(),
  message: z.string().min(1).max(2000)
});

module.exports = { directMessageCreateSchema };
