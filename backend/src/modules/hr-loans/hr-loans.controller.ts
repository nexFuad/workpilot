import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { loanReviewSchema } from './hr-loans.schema.js';
import { listLoanRequests, reviewLoanRequest } from './hr-loans.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listLoanRequests(getListQuery(c)));
}

export async function updateStatus(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, loanReviewSchema, 'Invalid status.');
  return c.json({ request: await reviewLoanRequest(pathParam(c, 'id'), input) });
}
