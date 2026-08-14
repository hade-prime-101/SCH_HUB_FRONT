// lib/api/base.ts

import { withAuthInterceptor } from './interceptor';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  isFormData = false
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const response = await withAuthInterceptor(fetch)(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  return data as T;
}

// ── Convenience helpers ──────────────────────────────────────────────────────

export function apiGet<T>(endpoint: string, params?: Record<string, any>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<T>(endpoint + query, { method: 'GET' });
}

export function apiPost<T>(endpoint: string, body: any, isFormData = false) {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
  }, isFormData);
}

export function apiPatch<T>(endpoint: string, body: any) {
  return apiFetch<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(endpoint: string, body: any) {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(endpoint: string) {
  return apiFetch<T>(endpoint, {
    method: 'DELETE',
  });
}

// ─── Clear auth cookie (used by useAuth) ────────────────────────────────────

export async function clearAuthCookie() {
  try {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
  } catch {}
}