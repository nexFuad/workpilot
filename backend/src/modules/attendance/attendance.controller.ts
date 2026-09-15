import type { Context } from 'hono';
import { parseJsonBody } from '../../lib/validation.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { attendanceActionSchema } from './attendance.schema.js';
import {
  checkIn,
  checkOut,
  findCurrentAttendance,
  listAttendanceHistory,
  listAttendanceOptions,
} from './attendance.service.js';

export async function options(c: Context<AppEnv>) {
  return c.json(await listAttendanceOptions());
}

export async function current(c: Context<AppEnv>) {
  return c.json({ attendance: await findCurrentAttendance(authUser(c).id) });
}

export async function history(c: Context<AppEnv>) {
  const search = c.req.query('search')?.trim() ?? '';
  return c.json({ attendances: await listAttendanceHistory(authUser(c).id, search) });
}

export async function createCheckIn(c: Context<AppEnv>) {
  const input = await parseJsonBody(
    c,
    attendanceActionSchema,
    'Select a site, shift, and attendance photo.',
  );
  return c.json({ attendance: await checkIn(authUser(c).id, input) }, 201);
}

export async function createCheckOut(c: Context<AppEnv>) {
  const input = await parseJsonBody(
    c,
    attendanceActionSchema,
    'Select a site, shift, and attendance photo.',
  );
  return c.json({ attendance: await checkOut(authUser(c).id, input) });
}
