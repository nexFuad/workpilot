import type { AuthResponse, LoginInput, SessionResponse } from '@/types/auth.types';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const isVercelBuild = process.env.VERCEL === '1';

if (isVercelBuild && !configuredApiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is required for a production build.');
}

const baseUrl = (configuredApiUrl || 'http://localhost:4000').replace(/\/$/, '');
const parsedApiUrl = new URL(baseUrl);
const isLocalApi = ['localhost', '127.0.0.1'].includes(parsedApiUrl.hostname);

if (isVercelBuild && isLocalApi) {
  throw new Error('NEXT_PUBLIC_API_URL cannot point to localhost in a Vercel deployment.');
}

if (process.env.NODE_ENV === 'production' && !isLocalApi && parsedApiUrl.protocol !== 'https:') {
  throw new Error('NEXT_PUBLIC_API_URL must use HTTPS in production.');
}

let refreshRequest: Promise<boolean> | null = null;

function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
  if (
    response.status === 401 &&
    retry &&
    path !== '/api/auth/refresh' &&
    path !== '/api/auth/login'
  ) {
    if (await refreshAccessToken()) return apiRequest<T>(path, init, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.message || 'Something went wrong.', response.status);
  return body as T;
}

export const authServer = {
  login: (input: LoginInput) =>
    apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: () => apiRequest<SessionResponse>('/api/auth/session', {}, false),
  logout: () => apiRequest<{ message: string }>('/api/auth/logout', { method: 'POST' }, false),
  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    address?: string;
    profileImage?: string;
  }) =>
    apiRequest<AuthResponse>('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest<{ message: string }>('/api/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
