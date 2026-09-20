import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { getOne, list, sendMessage } from './hr-ai-chat.controller.js';

export const hrAiChatRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/conversations', list)
  .get('/conversations/:id', getOne)
  .post('/messages', sendMessage);
