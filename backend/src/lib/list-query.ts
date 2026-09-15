import type { Context } from 'hono';

export type ListQuery = {
  search: string;
  status?: string;
  page: number;
  limit: number;
  skip: number;
};

export function getListQuery(c: Context, defaultLimit = 10): ListQuery {
  const page = Math.max(Number.parseInt(c.req.query('page') ?? '1', 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(c.req.query('limit') ?? String(defaultLimit), 10) || defaultLimit, 1),
    50,
  );
  const rawStatus = c.req.query('status')?.trim().toLowerCase();

  return {
    search: c.req.query('search')?.trim() ?? '',
    status: rawStatus && rawStatus !== 'all' ? rawStatus : undefined,
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function pagination(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
