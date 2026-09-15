import { Hono } from 'hono';
import { requireAuth, requireHrRole, type AppEnv } from '../../middleware/auth.middleware.js';
import { create, list, listForReview, remove, review } from './documents.controller.js';

export const documentRoutes = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', list)
  .post('/', create)
  .get('/review', requireHrRole, listForReview)
  .patch('/:id/review', requireHrRole, review)
  .delete('/:id', requireHrRole, remove);
