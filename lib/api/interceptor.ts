// lib/api/interceptor.ts

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Wraps a fetch function with automatic 401 handling.
 * On 401, clears auth state and redirects to login.
 * Ignores auth-related endpoints to prevent infinite loops.
 */
export function withAuthInterceptor(fetchFn: FetchFn): FetchFn {
  return async (input, init) => {
    const response = await fetchFn(input, init);

    // Skip interceptor for auth endpoints to avoid loops
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/me');

    if (response.status === 401 && !isAuthEndpoint) {
      // Clear local auth state
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('dashboard_redirect');
      } catch {}

      // Optionally call logout endpoint with refresh token
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
        }
      } catch {}

      // Redirect to login (avoid redirect loops)
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.replace('/login');
      }
    }

    return response;
  };
}