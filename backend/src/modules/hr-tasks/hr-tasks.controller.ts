import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { taskSchema } from './hr-tasks.schema.js';
import { createTask, deleteTask, listTasks, updateTask } from './hr-tasks.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listTasks(getListQuery(c)));
}

export async function create(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, taskSchema, 'Please provide valid task details.');
  return c.json({ task: await createTask(input) }, 201);
}

export async function update(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, taskSchema, 'Please provide valid task details.');
  return c.json({ task: await updateTask(pathParam(c, 'id'), input) });
}

export async function remove(c: Context<AppEnv>) {
  await deleteTask(pathParam(c, 'id'));
  return c.json({ message: 'Task deleted.' });
}
