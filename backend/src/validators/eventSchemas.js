const { z } = require('zod');

const imageUrl = z.string().min(1).max(1024);

const createEventSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(5000).optional().default(''),
  start_time: z.string().min(1),
  end_time: z.string().min(1),

  location: z.string().min(1).max(255).optional().nullable(),
  capacity: z.coerce.number().int().positive().max(100000).optional().nullable(),

  // ✅ UI uchun: category + images DB da saqlanadi
  category: z.string().min(1).max(50).optional().default('General'),
  images: z.array(imageUrl).max(20).optional().default([])
});

const updateEventSchema = createEventSchema.partial();

module.exports = { createEventSchema, updateEventSchema };
