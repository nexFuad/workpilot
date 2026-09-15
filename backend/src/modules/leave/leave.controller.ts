import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { leaveRequestSchema } from './leave.schema.js';
import {
  createLeaveRequest,
  deleteLeaveRequest,
  listLeaveRequests,
  updateLeaveRequest,
} from './leave.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listLeaveRequests(authUser(c).id, getListQuery(c, 20)));
}

export async function create(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, leaveRequestSchema, 'Invalid leave request.');
  return c.json({ request: await createLeaveRequest(authUser(c).id, input) }, 201);
}

export async function update(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, leaveRequestSchema, 'Invalid leave request.');
  return c.json({
    request: await updateLeaveRequest(pathParam(c, 'id'), authUser(c).id, input),
  });
}

export async function remove(c: Context<AppEnv>) {
  await deleteLeaveRequest(pathParam(c, 'id'), authUser(c).id);
  return c.json({ message: 'Leave request deleted.' });
}
