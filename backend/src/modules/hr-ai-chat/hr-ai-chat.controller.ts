import type { Context } from 'hono';
import { ApiError } from '../../lib/api-error.js';
import { parseJsonBody } from '../../lib/validation.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { chatMessageSchema } from './hr-ai-chat.schema.js';
import { getConversation, listConversations, saveAndReplyToHrChat } from './hr-ai-chat.service.js';

const attempts = new Map<string, number[]>();
function enforceRateLimit(userId: string) {
  const now = Date.now();
  const recent = (attempts.get(userId) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 8)
    throw new ApiError(429, 'Please wait a minute before sending more messages.');
  recent.push(now);
  attempts.set(userId, recent);
}
export async function sendMessage(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, chatMessageSchema, 'Write a valid chat message.');
  const user = authUser(c);
  enforceRateLimit(user.id);
  try {
    return c.json(await saveAndReplyToHrChat(user, input.message, input.conversationId));
  } catch (error) {
    throw new ApiError(503, error instanceof Error ? error.message : 'AI service is unavailable.');
  }
}

export async function list(c: Context<AppEnv>) {
  return c.json({ conversations: await listConversations(authUser(c).id) });
}

export async function getOne(c: Context<AppEnv>) {
  const id = c.req.param('id');
  if (!id) throw new ApiError(400, 'Missing conversation ID.');
  return c.json({ conversation: await getConversation(authUser(c).id, id) });
}
