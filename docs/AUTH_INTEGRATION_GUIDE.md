# Authentication Integration Guide

This guide explains how to integrate authentication into your Next.js application using the provided auth hooks and components.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Login Flow](#login-flow)
- [Protected Routes](#protected-routes)
- [Session Management](#session-management)
- [Token Refresh](#token-refresh)
- [Logout](#logout)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

The authentication system provides:

- User login with email/password
- Automatic session restoration on app load
- Token refresh on 401 responses
- Protected route enforcement
- Logout and session cleanup
- Type-safe user and auth response types

### Architecture

```
┌─────────────────────────────────────────────┐
│         App Layout / Root Component         │
│  (useAuth hook initializes on mount)        │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼────┐        ┌───▼──────────┐
    │ Login  │        │ Dashboard    │
    │ Page   │        │ (Protected)  │
    └────────┘        └──────────────┘
```

---

## Setup

### 1. Initialize Authentication in Root Layout

```tsx
// app/layout.tsx
'use client';

import { useAuth } from '@/lib/hooks';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuth();

  // Prevent hydration mismatch
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Create Auth Provider (Optional)

For more complex apps, create an auth provider:

```tsx
// app/providers.tsx
'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks';

export function Providers({ children }: { children: ReactNode }) {
  // useAuth initializes on first render
  // This ensures auth state is available throughout the app

  return <>{children}</>;
}

// app/layout.tsx
import { Providers } from '@/app/providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Login Flow

### Basic Login Implementation

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/shared/LoginForm';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoginError(null);
      await login(email, password);
      // Automatically redirected in useAuth, or manually:
      router.push('/dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  return (
    <div>
      <LoginForm
        onSubmit={handleLogin}
        isLoading={loading}
        error={loginError}
      />
    </div>
  );
}
```

### Login Form Component

```tsx
// components/shared/LoginForm.tsx
'use client';

import { useState } from 'react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({
  onSubmit,
  isLoading = false,
  error = null,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="error-alert">{error}</div>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <PasswordInput
        value={password}
        onChange={setPassword}
        placeholder="Password"
      />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

---

## Protected Routes

### Method 1: Client-Side Protection

```tsx
// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### Method 2: HOC for Protected Components

```tsx
// lib/hoc/withAuth.tsx
import { useAuth } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, loading, router]);

    if (loading) {
      return <LoadingSkeleton />;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Usage
function Dashboard() {
  return <h1>Dashboard</h1>;
}

export default withAuth(Dashboard);
```

### Method 3: Middleware (Recommended)

```tsx
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

---

## Session Management

### Automatic Session Restoration

The `useAuth` hook automatically restores the user session on app load:

```tsx
// This happens automatically in useAuth
useEffect(() => {
  checkAuth(); // Called on mount
}, []);
```

### Checking Authentication Status

```tsx
export function Header() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <header>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.email}</p>
          {/* User menu */}
        </div>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  );
}
```

### Manual Session Check

```tsx
export function useSessionCheck() {
  const { checkAuth, isAuthenticated } = useAuth();

  const refetch = async () => {
    await checkAuth();
  };

  return { refetch, isAuthenticated };
}
```

---

## Token Refresh

### Automatic Token Refresh

The API client automatically handles token refresh on 401:

```typescript
// When a 401 response is received:
// 1. API client attempts to refresh the token
// 2. New token is stored in localStorage
// 3. Original request is retried with new token
// 4. If refresh fails, user is redirected to login
```

### Manual Token Refresh

```tsx
import { apiClient } from '@/lib/api-client';

export function useTokenRefresh() {
  const refreshToken = async () => {
    try {
      const response = await apiClient.refreshToken();
      // Token is automatically stored by apiClient
      console.log('Token refreshed');
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // User should be logged out
    }
  };

  return { refreshToken };
}
```

### Token Expiration Handling

```tsx
export function useTokenExpiration() {
  const { logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Decode token to get expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = payload.exp * 1000 - Date.now();

    if (expiresIn < 0) {
      // Token already expired
      logout();
      return;
    }

    // Set timeout to refresh before expiration
    const timeoutId = setTimeout(() => {
      logout();
    }, expiresIn - 60000); // Refresh 1 minute before expiration

    return () => clearTimeout(timeoutId);
  }, [logout]);
}
```

---

## Logout

### Basic Logout

```tsx
import { useAuth } from '@/lib/hooks';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Logout with Confirmation

```tsx
export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleLogout = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to log out?'
    );

    if (!confirmed) return;

    try {
      setIsConfirming(true);
      await logout();
      router.push('/login');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <button onClick={handleLogout} disabled={isConfirming}>
      {isConfirming ? 'Logging out...' : 'Logout'}
    </button>
  );
}
```

### Automatic Logout on Token Expiration

```tsx
export function useAutoLogout() {
  const { logout } = useAuth();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkTokenExpiration = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // No token, user is logged out
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresIn = payload.exp * 1000 - Date.now();

        if (expiresIn < 0) {
          // Token expired, logout
          logout();
        } else if (expiresIn < 60000) {
          // Token expiring soon, check again in 10 seconds
          timeoutId = setTimeout(checkTokenExpiration, 10000);
        } else {
          // Check again 1 minute before expiration
          timeoutId = setTimeout(
            checkTokenExpiration,
            expiresIn - 60000
          );
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        logout();
      }
    };

    checkTokenExpiration();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [logout]);
}
```

---

## Error Handling

### Login Error States

```tsx
export function LoginForm() {
  const { login, error: authError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (email: string, password: string) => {
    setLocalError(null);

    try {
      await login(email, password);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';

      // Handle specific errors
      if (errorMessage.includes('401')) {
        setLocalError('Invalid email or password');
      } else if (errorMessage.includes('Network')) {
        setLocalError('Network error. Please try again');
      } else {
        setLocalError(errorMessage);
      }
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(email, password);
    }}>
      {localError && <ErrorMessage message={localError} />}
      {authError && <ErrorMessage message={authError} />}
      {/* Form fields */}
    </form>
  );
}
```

### API Error Handling

```tsx
// lib/api-client.ts interceptor
if (response.status === 401) {
  // Attempt to refresh token
  try {
    const refreshResponse = await this.refreshToken();
    // Retry request
  } catch (error) {
    // Token refresh failed, logout user
    localStorage.removeItem('auth_token');
    router.push('/login');
    throw new Error('Session expired. Please login again');
  }
} else if (response.status === 403) {
  throw new Error('Access denied');
} else if (response.status >= 500) {
  throw new Error('Server error. Please try again later');
}
```

---

## Examples

### Complete Login Flow

```tsx
// 1. User navigates to /login
// 2. LoginForm component renders
// 3. User enters email and password
// 4. Clicks "Sign In"
// 5. LoginForm calls onSubmit callback
// 6. useAuth's login() function calls apiClient.login()
// 7. Server returns user, token, and refreshToken
// 8. Tokens stored in localStorage
// 9. User state updated to authenticated
// 10. Component redirects to /dashboard

// app/login/page.tsx
export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by useAuth
    }
  };

  return <LoginForm onSubmit={handleLogin} isLoading={loading} error={error} />;
}
```

### Complete Logout Flow

```tsx
// 1. User clicks "Logout" button
// 2. Logout confirmation dialog shown
// 3. User confirms logout
// 4. useAuth's logout() function called
// 5. Calls apiClient.logout() to notify server
// 6. Clears auth tokens from localStorage
// 7. Auth state reset (user = null, isAuthenticated = false)
// 8. Component redirects to /login

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (window.confirm('Logout?')) {
      await logout();
      router.push('/login');
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Protected Dashboard

```tsx
// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <p>User ID: {user.id}</p>
      <p>Roles: {user.roles.join(', ')}</p>
      {/* Dashboard content */}
    </div>
  );
}
```

---

For more examples and patterns, see:
- Hook usage: `/docs/HOOKS_GUIDE.md`
- Form validation: `/docs/VALIDATORS_GUIDE.md`
- Storage: `/docs/STORAGE_GUIDE.md`
