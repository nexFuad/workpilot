import type { ListParams } from '@/types/pagination.types';

export function listQuery(params: ListParams = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') query.set(key, String(value));
  });

  const value = query.toString();
  return value ? `?${value}` : '';
}
