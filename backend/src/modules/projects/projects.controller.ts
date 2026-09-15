import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { listProjects } from './projects.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listProjects(authUser(c).id, getListQuery(c, 12)));
}
