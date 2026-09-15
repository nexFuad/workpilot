import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { projectSchema } from './hr-projects.schema.js';
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from './hr-projects.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listProjects(getListQuery(c)));
}

export async function create(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, projectSchema, 'Please provide valid project details.');
  return c.json({ project: await createProject(input) }, 201);
}

export async function update(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, projectSchema, 'Please provide valid project details.');
  return c.json({ project: await updateProject(pathParam(c, 'id'), input) });
}

export async function remove(c: Context<AppEnv>) {
  await deleteProject(pathParam(c, 'id'));
  return c.json({ message: 'Project deleted.' });
}
