import type { Context } from 'hono';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { advanceRequestSchema, loanRequestSchema, reviewSchema } from './compensation.schema.js';
import {
  createAdvanceRequest,
  createLoanRequest,
  getLoans,
  getSalary,
  reviewAdvanceRequest,
  reviewLoanRequest,
} from './compensation.service.js';

export async function salary(c: Context<AppEnv>) {
  return c.json(await getSalary(authUser(c).id, c.req.query('month')?.trim()));
}

export async function createAdvance(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, advanceRequestSchema, 'Invalid advance request.');
  return c.json({ advance: await createAdvanceRequest(authUser(c).id, input) }, 201);
}

export async function loans(c: Context<AppEnv>) {
  return c.json(await getLoans(authUser(c).id));
}

export async function createLoan(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, loanRequestSchema, 'Invalid loan request.');
  return c.json({ request: await createLoanRequest(authUser(c).id, input) }, 201);
}

export async function reviewAdvance(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, reviewSchema, 'Invalid review status.');
  return c.json({ advance: await reviewAdvanceRequest(pathParam(c, 'id'), input) });
}

export async function reviewLoan(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, reviewSchema, 'Invalid review status.');
  return c.json({ request: await reviewLoanRequest(pathParam(c, 'id'), input) });
}
