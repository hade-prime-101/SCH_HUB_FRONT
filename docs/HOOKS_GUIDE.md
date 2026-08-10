# Hooks Usage Guide

This guide covers all custom hooks available in the application and their usage patterns.

## Table of Contents

- [useAuth](#useauth)
- [useForm](#useform)
- [useAsync](#useasync)
- [useLocalStorage](#uselocalstorage)
- [Best Practices](#best-practices)

---

## useAuth

The `useAuth` hook manages authentication state and provides login/logout functionality.

### Return Value

```typescript
{
  user: User | null;           // Current authenticated user
  loading: boolean;            // Loading state during auth operations
  error: string | null;        // Error message if auth failed
  isAuthenticated: boolean;    // Whether user is logged in
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

### Basic Usage

```tsx
import { useAuth } from '@/lib/hooks';

export function Dashboard() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Login Example

```tsx
import { useAuth } from '@/lib/hooks';

export function LoginForm() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // User is now logged in, redirect handled automatically
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Protected Route Example

```tsx
import { useAuth } from '@/lib/hooks';
import { useRouter } from 'next/navigation';

export function ProtectedPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <LoadingSpinner />;

  return <div>Protected content</div>;
}
```

### Key Features

- **Session Restoration**: Automatically restores user session from localStorage on mount
- **Token Refresh**: Handles 401 responses and refreshes tokens transparently
- **Error Handling**: Captures and provides error messages
- **Loading State**: Tracks loading state during async operations

---

## useForm

The `useForm` hook manages form state including values, errors, and touched fields.

### Return Value

```typescript
{
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  handleChange: (e: ChangeEvent) => void;
  handleBlur: (e: FocusEvent) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  setFieldValue: (field: K, value: T[K]) => void;
  setFieldError: (field: K, error: string) => void;
  setFieldTouched: (field: K, isTouched: boolean) => void;
  resetForm: () => void;
  setValues: (values: T) => void;
}
```

### Basic Usage

```tsx
import { useForm } from '@/lib/hooks';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof LoginFormValues, string>> = {};

      if (!values.email) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Invalid email format';
      }

      if (!values.password) {
        errors.password = 'Password is required';
      } else if (values.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      return errors;
    },
    onSubmit: async (values) => {
      await apiClient.login(values.email, values.password);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        placeholder="Email"
      />
      {form.touched.email && form.errors.email && (
        <span>{form.errors.email}</span>
      )}

      <input
        name="password"
        type="password"
        value={form.values.password}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        placeholder="Password"
      />
      {form.touched.password && form.errors.password && (
        <span>{form.errors.password}</span>
      )}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Dynamic Field Updates

```tsx
// Set a specific field's value
form.setFieldValue('email', 'new@example.com');

// Set multiple values at once
form.setValues({
  email: 'test@example.com',
  password: 'newpassword',
});

// Manually set field error
form.setFieldError('email', 'Email already exists');

// Reset to initial values
form.resetForm();
```

### Key Features

- **Validation on Blur**: Validates fields when they lose focus
- **Touched Tracking**: Tracks which fields have been interacted with
- **Error Display**: Only shows errors for touched fields
- **Submission Handling**: Validates all fields before submission
- **No External Dependencies**: Pure React implementation

---

## useAsync

The `useAsync` hook manages async operation state and prevents race conditions.

### Return Value

```typescript
{
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T>;
}
```

### Basic Usage

```tsx
import { useAsync } from '@/lib/hooks';

export function DataList() {
  const { data, loading, error, execute } = useAsync(
    async () => {
      const response = await apiClient.getSchools();
      return response;
    },
    true // immediate = true (executes on mount)
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {data?.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Manual Execution

```tsx
export function DataFetcher() {
  const { data, loading, error, execute } = useAsync(
    async () => {
      const response = await apiClient.getSchools();
      return response;
    },
    false // immediate = false (manual execution)
  );

  const handleFetch = async () => {
    await execute();
  };

  return (
    <div>
      <button onClick={handleFetch} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
      {data && <div>{data.length} items loaded</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Refetching

```tsx
export function RefreshableList() {
  const { data, loading, error, execute } = useAsync(
    async () => {
      const response = await apiClient.getSchools();
      return response;
    },
    true
  );

  const handleRefresh = async () => {
    await execute();
  };

  return (
    <div>
      <button onClick={handleRefresh} disabled={loading}>
        Refresh
      </button>
      {/* Render data */}
    </div>
  );
}
```

### Key Features

- **Race Condition Prevention**: Only updates state for the most recent execution
- **Memory Leak Prevention**: Stops processing if component unmounts
- **Execution Counter**: Tracks execution order to prevent stale updates
- **Error Handling**: Captures and provides error messages

---

## useLocalStorage

The `useLocalStorage` hook syncs state with localStorage and handles JSON serialization.

### Return Value

```typescript
[value: T, setValue: (value: T | (val: T) => T) => void]
```

### Basic Usage

```tsx
import { useLocalStorage } from '@/lib/hooks';

export function UserPreferences() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>(
    'user_theme',
    'light'
  );

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
}
```

### Complex Types

```tsx
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

export function PreferencesPanel() {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    'user_preferences',
    {
      theme: 'light',
      language: 'en',
      notifications: true,
    }
  );

  const updateTheme = (newTheme: 'light' | 'dark') => {
    setPreferences((prev) => ({
      ...prev,
      theme: newTheme,
    }));
  };

  return (
    <div>
      <select
        value={preferences.theme}
        onChange={(e) => updateTheme(e.target.value as 'light' | 'dark')}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

### Cross-Tab Synchronization

```tsx
// Changes in one tab are automatically synced to other tabs
export function SyncedValue() {
  const [value, setValue] = useLocalStorage('shared_value', 0);

  // When this component mounts in another tab, it will see the latest value
  // and updates in this tab will be visible in other tabs

  return (
    <div>
      <p>Value: {value}</p>
      <button onClick={() => setValue((v) => v + 1)}>Increment</button>
    </div>
  );
}
```

### Key Features

- **JSON Serialization**: Automatically handles JSON serialization/deserialization
- **Cross-Tab Sync**: Syncs values across browser tabs/windows
- **SSR Safety**: Safe to use in Next.js apps (checks for `window` object)
- **Quota Handling**: Gracefully handles localStorage quota exceeded errors
- **Type Safety**: Full TypeScript support with generics

---

## Best Practices

### 1. Hook Dependencies

Always include hooks in dependency arrays when needed:

```tsx
useEffect(() => {
  checkAuth();
}, [checkAuth]); // Include checkAuth if it's from a hook
```

### 2. Error Handling

Always handle errors from async operations:

```tsx
const { login, error } = useAuth();

try {
  await login(email, password);
} catch (err) {
  // Handle error
}
```

### 3. Loading States

Show loading indicators while async operations are in progress:

```tsx
const { loading, data } = useAsync(fetchData, true);

if (loading) return <LoadingSpinner />;
return <div>{data}</div>;
```

### 4. Form Validation

Validate forms before submission:

```tsx
const form = useForm({
  // ... config
  validate: (values) => {
    // Return error object with field errors
  },
});
```

### 5. Memory Leaks

Hooks handle memory leak prevention automatically, but be aware of cleanup:

```tsx
// useAuth and useAsync handle their own cleanup
// useLocalStorage removes event listeners on unmount
// useForm cleans up refs on unmount
```

### 6. TypeScript Usage

Always provide type parameters for type safety:

```tsx
const { data } = useAsync<SchoolType[]>(fetchSchools, true);
const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
  'prefs',
  defaultPrefs
);
```

---

## Common Patterns

### Authentication Check + Redirect

```tsx
export function withAuth(Component: React.ComponentType) {
  return function ProtectedComponent(props: any) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, loading, router]);

    if (loading) return <LoadingSpinner />;
    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };
}
```

### Form with Server Action

```tsx
export function RegistrationForm() {
  const form = useForm({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      const result = await registerUser(values);
      if (result.error) throw new Error(result.error);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Data Refresh with Manual Trigger

```tsx
export function RefreshableDataList() {
  const { data, loading, error, execute } = useAsync(
    () => apiClient.getSchools(),
    true
  );

  return (
    <div>
      <button onClick={execute} disabled={loading}>
        Refresh
      </button>
      {data && <List items={data} />}
    </div>
  );
}
```

---

For more examples, see the test files in `/lib/hooks/__tests__/`.
