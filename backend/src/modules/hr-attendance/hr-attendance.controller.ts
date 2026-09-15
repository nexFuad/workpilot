import type { Context } from 'hono';
import { ApiError } from '../../lib/api-error.js';
import { getListQuery } from '../../lib/list-query.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { attendanceDateSchema } from './hr-attendance.schema.js';
import { getDailyAttendance } from './hr-attendance.service.js';

export async function list(c: Context<AppEnv>) {
  const date = attendanceDateSchema.safeParse(
    c.req.query('date') ?? new Date().toISOString().slice(0, 10),
  );
  if (!date.success) throw new ApiError(400, 'Invalid date.');
  return c.json(await getDailyAttendance(date.data, getListQuery(c)));
}
