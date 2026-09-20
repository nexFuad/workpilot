import { z } from 'zod';

export const chatMessageSchema = z.object({
  conversationId: z.string().cuid().optional(),
  message: z.string().trim().min(1, 'Write a message.').max(1500, 'Message is too long.'),
});
