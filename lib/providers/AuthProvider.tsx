'use client';

import { createContext, useContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import type { User, AuthResponse, DashboardRedirect } from '@/types/auth';
import { authApi as apiClient } from '@/lib/api';
import { clearAuthCookie } from '@/lib/api/base';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  dashboardRedirect: DashboardRedirect | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<DashboardRedirect | undefined>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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
    // Sync to HTTP-only cookie
    fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
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
    try {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } catch {}
  }, []);

  const getStoredUser = useCallback((): User | null => {
    try {
      const u = localStorage.getItem('auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const getStoredToken = useCallback((): string | null => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!isMountedRef.current) return;
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await apiClient.login(email, password);
        if (!isMountedRef.current) return;

        const { user, accessToken, refreshToken, dashboardRedirect } = res;
        if (!user || !accessToken)
          throw new Error('Invalid authentication response');

        storeTokens(accessToken, refreshToken);
        storeUser(user);
        if (dashboardRedirect) {
          localStorage.setItem('dashboard_redirect', dashboardRedirect);
        }

        setAuthState({
          user,
          loading: false,
          error: null,
          isAuthenticated: true,
          dashboardRedirect: dashboardRedirect ?? null,
        });
        return dashboardRedirect;
      } catch (err) {
        if (!isMountedRef.current) return;
        const msg =
          err instanceof Error ? err.message : 'Authentication failed';
        setAuthState({
          user: null,
          loading: false,
          error: msg,
          isAuthenticated: false,
          dashboardRedirect: null,
        });
        clearTokens();
        throw err;
      }
    },
    [storeTokens, storeUser, clearTokens]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) await apiClient.logout(refreshToken);
    } catch {}
    clearTokens();
    await clearAuthCookie();
    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      dashboardRedirect: null,
    });
  }, [clearTokens]);

  const checkAuth = useCallback(async () => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token) {
      setAuthState((prev) => ({ ...prev, loading: false, isAuthenticated: false }));
      return;
    }

    // If we have stored user data, trust it immediately
    if (storedUser) {
      const redirect =
        (localStorage.getItem('dashboard_redirect') as DashboardRedirect) ||
        null;
      setAuthState({
        user: storedUser,
        loading: false,
        error: null,
        isAuthenticated: true,
        dashboardRedirect: redirect,
      });

      // Verify token is still valid in the background
      try {
        const user = await apiClient.getMe();
        if (!isMountedRef.current) return;
        if (user) {
          storeUser(user);
        } else {
          clearTokens();
          setAuthState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
            dashboardRedirect: null,
          });
        }
      } catch (err) {
        // Token is invalid
        clearTokens();
        setAuthState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          dashboardRedirect: null,
        });
      }
      return;
    }

    // No stored user, try to fetch from API
    try {
      const user = await apiClient.getMe();
      if (!isMountedRef.current) return;
      if (user) {
        storeUser(user);
        const redirect =
          (localStorage.getItem('dashboard_redirect') as DashboardRedirect) ||
          null;
        setAuthState({
          user,
          loading: false,
          error: null,
          isAuthenticated: true,
          dashboardRedirect: redirect,
        });
      } else {
        clearTokens();
        setAuthState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          dashboardRedirect: null,
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Auth check failed:', err);
      clearTokens();
      setAuthState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        dashboardRedirect: null,
      });
    }
  }, [getStoredToken, storeUser, clearTokens, getStoredUser]);

  useEffect(() => {
    checkAuth();
    return () => {
      isMountedRef.current = false;
    };
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
