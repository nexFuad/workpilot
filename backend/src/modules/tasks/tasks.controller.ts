import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { taskStatusSchema } from './tasks.schema.js';
import { listTasks, updateTaskStatus } from './tasks.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listTasks(authUser(c).id, getListQuery(c, 20)));
}

export async function updateStatus(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, taskStatusSchema, 'Select a valid task status.');
  return c.json({
    task: await updateTaskStatus(pathParam(c, 'id'), authUser(c).id, input),
  });
}
