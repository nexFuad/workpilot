import type { AuthResponse, LoginInput, SessionResponse } from '@/types/auth.types';

const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (
    response.status === 401 &&
    retry &&
    path !== '/api/auth/refresh' &&
    path !== '/api/auth/login'
  ) {
    const refreshed = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) return request<T>(path, init, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.message || 'Something went wrong.', response.status);
  return body as T;
}

export const authServer = {
  login: (input: LoginInput) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: () => request<SessionResponse>('/api/auth/session', {}, false),
  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }, false),
};
