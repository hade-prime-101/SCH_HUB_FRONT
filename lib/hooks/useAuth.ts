'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User, AuthResponse, DashboardRedirect } from '@/types/auth';
import { authApi as apiClient } from '@/lib/api';
import { clearAuthCookie } from '@/lib/api/base';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  dashboardRedirect: DashboardRedirect | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    dashboardRedirect: null,
  });

  const isMountedRef = useRef(true);

  const storeTokens = useCallback((accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    } catch {}
    // Sync to HTTP-only cookie so the splash-screen auth check stays accurate
    fetch('/api/auth/set-cookie', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ accessToken }),
    }).catch(() => {});
  }, []);

  const clearTokens = useCallback(() => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('dashboard_redirect');
    } catch {}
  }, []);

  const storeUser = useCallback((user: User) => {
    try { localStorage.setItem('auth_user', JSON.stringify(user)); } catch {}
  }, []);

  const getStoredUser = useCallback((): User | null => {
    try {
      const u = localStorage.getItem('auth_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }, []);

  const getStoredToken = useCallback((): string | null => {
    try { return localStorage.getItem('auth_token'); } catch { return null; }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isMountedRef.current) return;
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const res = await apiClient.login(email, password);
      if (!isMountedRef.current) return;

      const { user, accessToken, refreshToken, dashboardRedirect } = res;
      if (!user || !accessToken) throw new Error('Invalid authentication response');

      storeTokens(accessToken, refreshToken);
      storeUser(user);
      if (dashboardRedirect) {
        localStorage.setItem('dashboard_redirect', dashboardRedirect);
      }

      setAuthState({ user, loading: false, error: null, isAuthenticated: true, dashboardRedirect: dashboardRedirect ?? null });
      return dashboardRedirect;
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthState({ user: null, loading: false, error: msg, isAuthenticated: false, dashboardRedirect: null });
      clearTokens();
      throw err;  // re-throw the original error so callers can inspect .status
    }
  }, [storeTokens, storeUser, clearTokens]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) await apiClient.logout(refreshToken);
    } catch {}
    clearTokens();
    // Clear the HTTP-only cookie so the splash auth check reflects logout
    await clearAuthCookie();
    if (isMountedRef.current) {
      setAuthState({ user: null, loading: false, error: null, isAuthenticated: false, dashboardRedirect: null });
    }
  }, [clearTokens]);

  const checkAuth = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setAuthState(prev => ({ ...prev, loading: false, isAuthenticated: false }));
      return;
    }
    try {
      const user = await apiClient.getMe();
      if (!isMountedRef.current) return;
      if (user) {
        storeUser(user);
        const redirect = (localStorage.getItem('dashboard_redirect') as DashboardRedirect) || null;
        setAuthState({ user, loading: false, error: null, isAuthenticated: true, dashboardRedirect: redirect });
      } else {
        clearTokens();
        setAuthState({ user: null, loading: false, error: null, isAuthenticated: false, dashboardRedirect: null });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      if (!isMountedRef.current) return;
      // If auth check fails, clear tokens and mark as not authenticated
      clearTokens();
      setAuthState({ user: null, loading: false, error: null, isAuthenticated: false, dashboardRedirect: null });
    }
  }, [getStoredToken, storeUser, clearTokens, getStoredUser]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    checkAuth();
    return () => { isMountedRef.current = false; };
  }, [checkAuth]);

  return { ...authState, login, logout, checkAuth };
}
