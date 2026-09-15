import type { Context } from 'hono';
import type { z } from 'zod';
import { ApiError } from './api-error.js';

export async function parseJsonBody<TSchema extends z.ZodType>(
  c: Context,
  schema: TSchema,
  fallbackMessage = 'Invalid request data.',
): Promise<z.infer<TSchema>> {
  const body = await c.req.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(400, result.error.issues[0]?.message ?? fallbackMessage);
  }
  return result.data;
}

export function pathParam(c: Context, name: string) {
  const value = c.req.param(name);
  if (!value) throw new ApiError(400, `Missing path parameter: ${name}.`);
  return value;
}
