import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { payrollSchema, payrollStatusSchema } from './hr-payroll.schema.js';
import {
  generatePreviousPayroll,
  listPayroll,
  savePayroll,
  updatePayrollStatus,
} from './hr-payroll.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listPayroll(getListQuery(c), c.req.query('month')));
}

export async function generate(c: Context<AppEnv>) {
  return c.json(await generatePreviousPayroll());
}

export async function save(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, payrollSchema, 'Invalid payroll data.');
  return c.json({ payment: await savePayroll(input) });
}

export async function updateStatus(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, payrollStatusSchema, 'Select a valid payroll status.');
  return c.json({ payment: await updatePayrollStatus(pathParam(c, 'id'), input) });
}
