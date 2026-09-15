import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import {
  createEmployeeSchema,
  employeeStatusSchema,
  updateEmployeeSchema,
} from './hr-employees.schema.js';
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
  updateEmployeeStatus,
} from './hr-employees.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listEmployees(authUser(c).id, getListQuery(c), c.req.query('role')));
}

export async function details(c: Context<AppEnv>) {
  return c.json(await getEmployee(pathParam(c, 'id'), authUser(c).id));
}

export async function create(c: Context<AppEnv>) {
  const input = await parseJsonBody(
    c,
    createEmployeeSchema,
    'Please provide valid employee details.',
  );
  return c.json({ employee: await createEmployee(input, authUser(c).id) }, 201);
}

export async function updateStatus(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, employeeStatusSchema, 'Select a valid account status.');
  return c.json({
    employee: await updateEmployeeStatus(pathParam(c, 'id'), input.isActive, authUser(c).id),
  });
}

export async function update(c: Context<AppEnv>) {
  const input = await parseJsonBody(
    c,
    updateEmployeeSchema,
    'Please provide valid employee details.',
  );
  return c.json({
    employee: await updateEmployee(pathParam(c, 'id'), input, authUser(c).id),
  });
}

export async function remove(c: Context<AppEnv>) {
  await deleteEmployee(pathParam(c, 'id'));
  return c.json({ message: 'Employee and related records deleted.' });
}
