import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { leaveReviewSchema } from './hr-leave.schema.js';
import { listLeaveRequests, reviewLeaveRequest } from './hr-leave.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listLeaveRequests(getListQuery(c)));
}

export async function updateStatus(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, leaveReviewSchema, 'Select approve or reject.');
  return c.json({ request: await reviewLeaveRequest(pathParam(c, 'id'), input) });
}
