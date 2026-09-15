import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { advanceReviewSchema } from './hr-advances.schema.js';
import { listAdvanceRequests, reviewAdvanceRequest } from './hr-advances.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listAdvanceRequests(getListQuery(c)));
}

export async function updateStatus(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, advanceReviewSchema, 'Invalid status.');
  return c.json({ request: await reviewAdvanceRequest(pathParam(c, 'id'), input) });
}
