# Storage Utilities Guide

This guide covers localStorage, sessionStorage, and cookie utilities for secure data persistence.

## Table of Contents

- [localStorage Manager](#localstorage-manager)
- [sessionStorage Manager](#sessionstorage-manager)
- [Cookie Manager](#cookie-manager)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)

---

## localStorage Manager

Type-safe localStorage abstraction with JSON serialization.

### Interface

```typescript
interface StorageManager {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

export const localStorageManager: StorageManager;
```

### Basic Usage

```tsx
import { localStorageManager } from '@/lib/storage';

// Store a value
localStorageManager.setItem('user_theme', 'dark');

// Retrieve a value
const theme = localStorageManager.getItem<string>('user_theme');
// theme = 'dark'

// Remove a value
localStorageManager.removeItem('user_theme');

// Clear all
localStorageManager.clear();
```

### Type-Safe Complex Objects

```tsx
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

// Store
const preferences: UserPreferences = {
  theme: 'dark',
  language: 'en',
  notifications: true,
};
localStorageManager.setItem('preferences', preferences);

// Retrieve
const retrieved = localStorageManager.getItem<UserPreferences>('preferences');
// retrieved = {
//   theme: 'dark',
//   language: 'en',
//   notifications: true
// }
```

### Array Storage

```tsx
interface SavedSearch {
  id: string;
  query: string;
  timestamp: number;
}

// Store array
const searches: SavedSearch[] = [
  { id: '1', query: 'schools', timestamp: Date.now() },
  { id: '2', query: 'students', timestamp: Date.now() },
];
localStorageManager.setItem('saved_searches', searches);

// Retrieve
const retrieved = localStorageManager.getItem<SavedSearch[]>('saved_searches');
// retrieved is properly typed as SavedSearch[]
```

### Handling Serialization Errors

```tsx
// Errors are caught and logged automatically
try {
  const value = localStorageManager.getItem<string>('corrupted_key');
  if (value === null) {
    console.log('Key not found or parse failed, returned null');
  }
} catch (error) {
  // Errors are already logged internally
}
```

### Quota Handling

```tsx
// When quota is exceeded, setItem gracefully fails
try {
  // Fill localStorage
  for (let i = 0; i < 100000; i++) {
    localStorageManager.setItem(`key_${i}`, 'x'.repeat(10000));
  }
} catch (error) {
  // Quota exceeded error logged
  // Application continues without crashing
}
```

### SSR Safety

```tsx
// Safe to use in Next.js
// Checks for window object automatically

export function PreferencesComponent() {
  // Will not crash in SSR/server components
  const theme = localStorageManager.getItem<string>('theme');

  return <div>{theme || 'light'}</div>;
}
```

### In Hooks

```tsx
export function useStoredTheme() {
  const [theme, setTheme] = useState<string>(() => {
    // Get initial value from storage
    return localStorageManager.getItem<string>('theme') || 'light';
  });

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorageManager.setItem('theme', newTheme);
  };

  return [theme, updateTheme] as const;
}
```

---

## sessionStorage Manager

Session-only storage, cleared when browser closes.

### Interface

```typescript
export const sessionStorageManager: StorageManager;
```

### Basic Usage

```tsx
import { sessionStorageManager } from '@/lib/storage';

// Store a value for the session
sessionStorageManager.setItem('current_form_step', 2);

// Retrieve
const step = sessionStorageManager.getItem<number>('current_form_step');
// step = 2

// When browser closes, value is automatically cleared
```

### Temporary Data Storage

```tsx
// Store form in-progress data
const formState = {
  step: 1,
  email: 'user@example.com',
  completed: false,
};
sessionStorageManager.setItem('registration_form', formState);

// On page reload within session, data persists
// On new session, data is cleared
```

### Multi-Step Form

```tsx
export function MultiStepForm() {
  const [step, setStep] = useState(() => {
    return sessionStorageManager.getItem<number>('current_step') || 1;
  });

  const handleNextStep = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    sessionStorageManager.setItem('current_step', nextStep);
  };

  useEffect(() => {
    return () => {
      // Clean up on unmount (optional)
      // sessionStorageManager.removeItem('current_step');
    };
  }, []);

  return (
    <div>
      <p>Step {step}</p>
      <button onClick={handleNextStep}>Next</button>
    </div>
  );
}
```

### Differences from localStorage

| Feature | localStorage | sessionStorage |
|---------|--------------|----------------|
| **Duration** | Persistent until cleared | Cleared on browser close |
| **Scope** | Same origin (domain) | Per tab/window |
| **Capacity** | ~5-10MB | ~5-10MB |
| **Use Case** | User preferences | Temporary session data |

---

## Cookie Manager

Secure cookie management with authentication token support.

### Interface

```typescript
interface CookieOptions {
  maxAge?: number;                    // Lifetime in seconds
  expires?: Date;                     // Expiration date
  path?: string;                      // Cookie path (default: '/')
  domain?: string;                    // Cookie domain
  secure?: boolean;                   // HTTPS only
  httpOnly?: boolean;                 // JS-inaccessible (server-only)
  sameSite?: 'Strict' | 'Lax' | 'None'; // CSRF protection
}

export const cookieManager = {
  getCookie(name: string): string | null;
  setCookie(name: string, value: string, options?: CookieOptions): void;
  deleteCookie(name: string): void;
};
```

### Basic Usage

```tsx
import { cookieManager } from '@/lib/storage';

// Set a cookie
cookieManager.setCookie('user_id', '12345');

// Get a cookie
const userId = cookieManager.getCookie('user_id');
// userId = '12345'

// Delete a cookie
cookieManager.deleteCookie('user_id');
```

### Authentication Token Storage

```tsx
// Store auth token with security options
cookieManager.setCookie('auth_token', token, {
  maxAge: 3600, // 1 hour
  path: '/',
  secure: true, // HTTPS only
  httpOnly: true, // Not accessible from JavaScript
  sameSite: 'Strict', // CSRF protection
});

// Token is automatically sent with requests
// And inaccessible from client-side JavaScript
```

### Refresh Token

```tsx
// Store long-lived refresh token
cookieManager.setCookie('refresh_token', refreshToken, {
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'Lax',
});

// Use for token refresh
const token = cookieManager.getCookie('refresh_token');
if (token) {
  const newToken = await refreshAuthToken(token);
  cookieManager.setCookie('auth_token', newToken, {
    maxAge: 3600,
    secure: true,
    httpOnly: true,
  });
}
```

### Session Cookies

```tsx
// Session cookie (cleared when browser closes)
cookieManager.setCookie('session_id', sessionId, {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'Lax',
  // No maxAge or expires = session cookie
});
```

### Expiring Cookies

```tsx
// Cookie that expires in 30 days
const expirationDate = new Date();
expirationDate.setDate(expirationDate.getDate() + 30);

cookieManager.setCookie('remember_me', userId, {
  expires: expirationDate,
  path: '/',
  secure: true,
});

// Or using maxAge (seconds)
cookieManager.setCookie('remember_me', userId, {
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  path: '/',
  secure: true,
});
```

### Deleting Cookies

```tsx
// Delete a cookie
cookieManager.deleteCookie('session_id');

// Delete with specific path
const deleteCookieWithPath = (name: string) => {
  cookieManager.deleteCookie(name);
};
```

---

## Security Considerations

### 1. **HttpOnly Cookies**

Always use `httpOnly: true` for sensitive tokens:

```tsx
// ✅ GOOD - XSS protected
cookieManager.setCookie('auth_token', token, {
  httpOnly: true,
  secure: true,
});

// ❌ BAD - Vulnerable to XSS
cookieManager.setCookie('auth_token', token, {
  httpOnly: false, // Accessible from JavaScript
});
```

### 2. **Secure Flag**

Always use `secure: true` in production:

```tsx
// ✅ GOOD - HTTPS only
cookieManager.setCookie('auth_token', token, {
  secure: true,
});

// ❌ BAD - Sent over HTTP too
cookieManager.setCookie('auth_token', token, {
  secure: false,
});
```

### 3. **SameSite Protection**

Protect against CSRF attacks:

```tsx
// ✅ GOOD - Strict CSRF protection
cookieManager.setCookie('auth_token', token, {
  sameSite: 'Strict', // Only sent for same-site requests
});

// ⚠️ MODERATE - Allows cross-site GET
cookieManager.setCookie('auth_token', token, {
  sameSite: 'Lax',
});

// ❌ NOT RECOMMENDED - CSRF vulnerable
cookieManager.setCookie('auth_token', token, {
  sameSite: 'None', // Only use if absolutely necessary
});
```

### 4. **Sensitive Data Storage**

Use appropriate storage for different data types:

```tsx
// ✅ localStorage - Public preferences
localStorageManager.setItem('theme', 'dark');

// ✅ sessionStorage - Temporary data
sessionStorageManager.setItem('form_draft', formData);

// ✅ httpOnly cookies - Auth tokens
cookieManager.setCookie('auth_token', token, { httpOnly: true });

// ❌ AVOID - Don't store secrets in localStorage
localStorageManager.setItem('api_key', secret); // Vulnerable to XSS
```

### 5. **Token Expiration**

Always set expiration times for tokens:

```tsx
// ✅ GOOD - Short-lived token
cookieManager.setCookie('auth_token', token, {
  maxAge: 3600, // 1 hour
});

// ⚠️ RISKY - No expiration
cookieManager.setCookie('auth_token', token);
```

---

## Best Practices

### 1. **Type Safety**

Always specify types when retrieving data:

```tsx
// ✅ GOOD - Type specified
const user = localStorageManager.getItem<UserType>('user');

// ⚠️ RISKY - No type
const user = localStorageManager.getItem('user') as any;
```

### 2. **Error Handling**

Plan for storage failures:

```tsx
try {
  localStorageManager.setItem('data', largeObject);
} catch (error) {
  if (error instanceof DOMException && error.code === 22) {
    console.error('Storage quota exceeded');
    // Cleanup old data
    localStorageManager.removeItem('old_data');
  }
}
```

### 3. **Data Validation**

Validate retrieved data:

```tsx
// ✅ GOOD - Validate before use
const theme = localStorageManager.getItem<string>('theme');
if (theme && ['light', 'dark'].includes(theme)) {
  applyTheme(theme);
} else {
  applyTheme('light');
}

// ❌ BAD - Trust untrusted data
const theme = localStorageManager.getItem<string>('theme');
applyTheme(theme); // Could be corrupted
```

### 4. **Key Naming**

Use consistent, descriptive key names:

```tsx
// ✅ GOOD - Clear naming
localStorageManager.setItem('user_preferences_theme', 'dark');
localStorageManager.setItem('user_preferences_language', 'en');

// ⚠️ UNCLEAR - Ambiguous
localStorageManager.setItem('theme', 'dark');
localStorageManager.setItem('data', largeObject);
```

### 5. **Cleanup on Logout**

Clear sensitive data on logout:

```tsx
export function logout() {
  // Clear tokens
  cookieManager.deleteCookie('auth_token');
  cookieManager.deleteCookie('refresh_token');

  // Clear user data
  localStorageManager.removeItem('user');
  localStorageManager.removeItem('user_preferences');

  // Clear temporary session data
  sessionStorageManager.clear();

  // Redirect to login
  router.push('/login');
}
```

### 6. **Feature Detection**

Check for storage availability:

```tsx
export function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorageManager.setItem(test, test);
    localStorageManager.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Use in your code
if (isLocalStorageAvailable()) {
  localStorageManager.setItem('theme', 'dark');
} else {
  applyDefaultTheme();
}
```

### 7. **SSR-Safe Usage**

Always check for browser environment:

```tsx
// ✅ GOOD - Checks for window
export function useStoredValue<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    return localStorageManager.getItem<T>(key) || defaultValue;
  });
  // ...
}

// ❌ BAD - Fails in SSR
export function useStoredValue<T>(key: string, defaultValue: T) {
  const value = localStorageManager.getItem<T>(key) || defaultValue;
  // Crashes in SSR/server components
}
```

---

## Common Patterns

### Pattern 1: Auth Token Management

```tsx
export function useAuthTokens() {
  const setTokens = (token: string, refreshToken: string) => {
    cookieManager.setCookie('auth_token', token, {
      maxAge: 3600,
      secure: true,
      httpOnly: true,
      sameSite: 'Strict',
    });
    cookieManager.setCookie('refresh_token', refreshToken, {
      maxAge: 7 * 24 * 60 * 60,
      secure: true,
      httpOnly: true,
      sameSite: 'Strict',
    });
  };

  const clearTokens = () => {
    cookieManager.deleteCookie('auth_token');
    cookieManager.deleteCookie('refresh_token');
  };

  return { setTokens, clearTokens };
}
```

### Pattern 2: Persistent Preferences

```tsx
export function usePreferences() {
  const [prefs, setPrefs] = useState(() => {
    return (
      localStorageManager.getItem<UserPreferences>('preferences') ||
      DEFAULT_PREFERENCES
    );
  });

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    localStorageManager.setItem('preferences', updated);
  };

  return [prefs, updatePreferences] as const;
}
```

### Pattern 3: Form Auto-Save

```tsx
export function useAutoSaveForm<T extends Record<string, any>>(formKey: string, initialValues: T) {
  const [values, setValues] = useState(() => {
    return sessionStorageManager.getItem<T>(formKey) || initialValues;
  });

  const updateField = (field: keyof T, value: T[keyof T]) => {
    const updated = { ...values, [field]: value };
    setValues(updated);
    sessionStorageManager.setItem(formKey, updated);
  };

  const clearForm = () => {
    setValues(initialValues);
    sessionStorageManager.removeItem(formKey);
  };

  return { values, updateField, clearForm };
}
```

---

For more examples, see the test files in `/lib/storage/__tests__/`.
