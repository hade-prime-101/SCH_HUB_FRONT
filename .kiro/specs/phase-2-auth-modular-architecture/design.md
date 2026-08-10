# Phase 2: Authentication & Modular Architecture - Design Document

## Overview

Phase 2 extends Phase 1's modular architecture by implementing authentication infrastructure using clean, reusable patterns. The design emphasizes:
- Custom hooks for state management
- Pure function validators
- Storage abstraction layer
- Consistent with Phase 1 module organization

---

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│        Pages (/app/login, /dashboard)      │
├─────────────────────────────────────────────┤
│     Components (/components/shared/ui)     │
├─────────────────────────────────────────────┤
│    Hooks (/lib/hooks - State Management)   │
├─────────────────────────────────────────────┤
│   Validators (/lib/validators - Logic)     │
├─────────────────────────────────────────────┤
│   Storage (/lib/storage - Persistence)     │
├─────────────────────────────────────────────┤
│    API Client (/lib/api-client - HTTP)     │
├─────────────────────────────────────────────┤
│      Types (/types - Type Definitions)     │
└─────────────────────────────────────────────┘
```

---

## Module: Custom Hooks (`/lib/hooks/`)

### useAuth Hook

**Purpose:** Centralized authentication state management

**Implementation:**
```typescript
// /lib/hooks/useAuth.ts

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useAuth(): {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
} {
  // Manage auth state
  // Call apiClient.login() on login
  // Call apiClient.logout() on logout
  // Restore session from localStorage on mount
  // Handle token refresh on 401
}
```

**Usage:**
```typescript
const { user, isAuthenticated, login, logout, loading, error } = useAuth();

if (loading) return <LoadingSkeleton />;
if (!isAuthenticated) return <LoginForm />;
return <Dashboard />;
```

### useForm Hook

**Purpose:** Form state management without external library

**Implementation:**
```typescript
// /lib/hooks/useForm.ts

export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: T) => Record<keyof T, string>;
}): {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  isSubmitting: boolean;
} {
  // Manage values state
  // Manage errors state
  // Track touched fields
  // Validate on blur
  // Submit with validation
}
```

**Usage:**
```typescript
const form = useForm({
  initialValues: { email: '', password: '' },
  validate: (values) => {
    const errors = {};
    if (!validateEmail(values.email).valid) {
      errors.email = "Invalid email";
    }
    if (!validatePassword(values.password).valid) {
      errors.password = "Password too weak";
    }
    return errors;
  },
  onSubmit: async (values) => {
    await apiClient.register(values);
  },
});

<form onSubmit={form.handleSubmit}>
  <input
    name="email"
    value={form.values.email}
    onChange={form.handleChange}
    onBlur={form.handleBlur}
  />
  {form.errors.email && <span>{form.errors.email}</span>}
</form>
```

### useAsync Hook

**Purpose:** Manage async operation state

**Implementation:**
```typescript
// /lib/hooks/useAsync.ts

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true,
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T>;
} {
  // Execute async function on mount (if immediate)
  // Update state: data, loading, error
  // Handle cleanup to prevent memory leak
  // Allow manual execution via execute()
}
```

**Usage:**
```typescript
const { data: schools, loading, error } = useAsync(
  () => apiClient.getSchools(),
  true,
);

if (loading) return <LoadingSkeleton />;
if (error) return <ErrorMessage message={error.message} />;
return <SelectionList items={schools} />;
```

### useLocalStorage Hook

**Purpose:** Persist state to localStorage

**Implementation:**
```typescript
// /lib/hooks/useLocalStorage.ts

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  // Initialize from localStorage or initialValue
  // Sync state with localStorage
  // Handle JSON serialization
  // Handle storage events from other tabs
}
```

**Usage:**
```typescript
const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
  'sidebar_collapsed',
  false,
);

return (
  <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
    Toggle Sidebar
  </button>
);
```

---

## Module: Validators (`/lib/validators/`)

### Email Validator

```typescript
// /lib/validators/email.ts

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  // RFC 5322 compatible regex or library
  // Return { valid: true } or { valid: false, error: "message" }
}

// Usage
const result = validateEmail(email);
if (!result.valid) console.log(result.error);
```

### Password Validator

```typescript
// /lib/validators/password.ts

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export function validatePassword(
  password: string,
  options?: { minLength?: number; requireNumbers?: boolean; requireSymbols?: boolean },
): PasswordValidationResult {
  // Check: length, uppercase, lowercase, numbers, symbols
  // Return array of failed checks
  // Calculate strength score
}

// Usage
const result = validatePassword(password);
result.errors.forEach(error => console.log(error));
console.log(`Strength: ${result.strength}`);
```

### Form Validator

```typescript
// /lib/validators/form.ts

export type FormValidationSchema<T> = {
  [K in keyof T]: (value: T[K]) => string | undefined;
};

export function validateForm<T extends Record<string, any>>(
  values: T,
  schema: FormValidationSchema<T>,
): Record<keyof T, string | undefined> {
  // Apply each validator function
  // Return errors object
}

// Usage
const errors = validateForm(formValues, {
  email: (v) => validateEmail(v).error,
  password: (v) => validatePassword(v).errors[0],
});
```

---

## Module: Storage (`/lib/storage/`)

### LocalStorage Abstraction

```typescript
// /lib/storage/localStorage.ts

export const localStorageManager = {
  getItem<T>(key: string): T | null {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading localStorage[${key}]:`, error);
      return null;
    }
  },

  setItem<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.error('localStorage quota exceeded');
      }
    }
  },

  removeItem(key: string): void {
    window.localStorage.removeItem(key);
  },

  clear(): void {
    window.localStorage.clear();
  },
};

// Usage
const settings = localStorageManager.getItem<UserSettings>('user_settings');
localStorageManager.setItem('user_settings', newSettings);
```

### SessionStorage Abstraction

```typescript
// /lib/storage/sessionStorage.ts

export const sessionStorageManager = {
  // Same interface as localStorage
  // Separate from localStorage for in-session data
};

// Usage
const tempData = sessionStorageManager.getItem<TempData>('temp_data');
sessionStorageManager.setItem('temp_data', newTempData);
```

### Cookie Manager

```typescript
// /lib/storage/cookies.ts

export interface CookieOptions {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export const cookieManager = {
  getCookie(name: string): string | null {
    // Parse document.cookie
    // Return value or null
  },

  setCookie(name: string, value: string, options?: CookieOptions): void {
    // Build cookie string with options
    // Set document.cookie
  },

  deleteCookie(name: string): void {
    // Set cookie with maxAge=0
  },
};

// Usage
const token = cookieManager.getCookie('auth_token');
cookieManager.setCookie('auth_token', token, { 
  secure: true, 
  httpOnly: true, 
  sameSite: 'Strict' 
});
```

---

## API Client Extensions

### Auth Endpoints

```typescript
// /lib/api-client.ts (extend existing)

class ApiClient {
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async checkAuth(): Promise<User | null> {
    try {
      return await this.request<User>('/auth/me');
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.request('/auth/refresh', { method: 'POST' });
  }
}
```

### Request Interceptor

```typescript
// Add to ApiClient constructor

private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      'Authorization': `Bearer ${this.getAuthToken()}`,
    },
  });

  // If 401, try to refresh token and retry
  if (response.status === 401) {
    await this.refreshToken();
    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });
  }

  return response.json();
}

private getAuthToken(): string | null {
  return cookieManager.getCookie('auth_token');
}
```

---

## Component Updates

### LoginForm Component

```typescript
// /components/shared/LoginForm.tsx

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: (v) => ({
      email: !validateEmail(v.email).valid ? validateEmail(v.email).error : '',
      password: !validatePassword(v.password).valid ? 'Invalid password' : '',
    }),
    onSubmit: async (v) => await onSubmit(v.email, v.password),
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      
      {/* Email field */}
      <div>
        <label>Email</label>
        <input
          name="email"
          type="email"
          value={form.values.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
        />
        {form.touched.email && form.errors.email && (
          <span className="text-red-500 text-sm">{form.errors.email}</span>
        )}
      </div>

      {/* Password field */}
      <div>
        <label>Password</label>
        <PasswordInput
          name="password"
          value={form.values.password}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
        />
        {form.touched.password && form.errors.password && (
          <span className="text-red-500 text-sm">{form.errors.password}</span>
        )}
      </div>

      {/* Submit button */}
      <button type="submit" disabled={isLoading || !form.values.email || !form.values.password}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### PasswordInput Component

```typescript
// /components/ui/PasswordInput.tsx

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
}

export function PasswordInput({ showStrength, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          {...props}
          className="w-full pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          {showPassword ? <MdVisibility /> : <MdVisibilityOff />}
        </button>
      </div>
      
      {showStrength && props.value && (
        <PasswordStrengthIndicator password={String(props.value)} />
      )}
    </div>
  );
}
```

---

## Login Page Refactored

```typescript
// /app/login/page.tsx

export default function LoginPage() {
  const { login, error, loading } = useAuth();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        <LoginForm onSubmit={handleLogin} isLoading={loading} error={error} />
        <p className="mt-4 text-center">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-600">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## Export Patterns

### Hook Exports
