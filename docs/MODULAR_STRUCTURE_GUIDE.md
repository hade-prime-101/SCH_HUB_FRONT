# 🏗️ SCH Hub - Modular Architecture Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      PAGE COMPONENT                         │
│                  (/app/register/page.tsx)                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
        ▼           ▼           ▼              ▼
    ┌────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐
    │  Types │ │ API     │ │Shared  │ │   UI    │
    │        │ │ Client  │ │Comps   │ │ Comps   │
    │@/types │ │@/lib    │ │@/comp. │ │@/comp.  │
    │/auth   │ │/api-    │ │/shared │ │/ui      │
    └────────┘ │ client  │ └────────┘ └─────────┘
               └─────────┘
                    │
                    ▼
            ┌──────────────────┐
            │  ENVIRONMENT     │
            │   (.env)         │
            │ API_URL, etc     │
            └──────────────────┘
```

---

## Folder Structure with Examples

### `/types`
**Purpose:** Centralized type definitions

```
types/
├── auth.ts              ← Exports: SchoolType, FacultyType, DepartmentType
├── icons.ts             ← Icon type mappings
└── images.ts            ← Image type mappings

Future files:
├── marketplace.ts       ← ListingType, ShopType, etc
├── community.ts         ← PostType, CommentType, etc
└── user.ts              ← UserType, ProfileType, etc
```

**When to create a new file:**
- When adding a new domain/feature (auth, marketplace, community)
- When related types are numerous
- When types are shared across multiple pages

---

### `/lib`
**Purpose:** Reusable utility functions and services

```
lib/
├── api-client.ts        ← Centralized API calls
├── biometrics.ts        ← Biometric utilities
└── (future)

Future files:
├── validators.ts        ← Email, password, etc validators
├── storage.ts           ← LocalStorage, SessionStorage helpers
├── auth.ts              ← Auth utilities
└── hooks/
    ├── useAuth.ts       ← Auth state hook
    ├── useFetch.ts      ← Data fetching hook
    └── useForm.ts       ← Form state management
```

---

### `/components/ui`
**Purpose:** Low-level, reusable UI components

```
components/ui/
├── ErrorMessage.tsx     ← Error alert display
├── LoadingSkeleton.tsx   ← Loading placeholder
├── (future)

Future files:
├── Button.tsx           ← Reusable button
├── Input.tsx            ← Reusable input
├── Modal.tsx            ← Modal component
├── Card.tsx             ← Card wrapper
└── Badge.tsx            ← Badge component
```

**Characteristics:**
- Pure presentational components
- No business logic
- Accept all data via props
- Highly reusable

---

### `/components/shared`
**Purpose:** Feature-specific components used across pages

```
components/shared/
├── ProgressDots.tsx     ← Registration progress
├── SearchInput.tsx      ← Reusable search field
├── SelectionList.tsx    ← Reusable list selector
├── (future)

Future files:
├── LoginForm.tsx        ← Reusable login form
├── MarketplaceCard.tsx  ← Marketplace item card
├── PostCard.tsx         ← Community post card
├── CommentThread.tsx    ← Comment display
└── Header.tsx           ← App header
```

**Characteristics:**
- Feature-specific logic
- Handles loading/error states
- Composable with UI components
- Reused in multiple pages

---

## Data Flow Example

### Registration Flow

```
User opens /register
        ↓
Page renders
    ├─ Imports apiClient from @/lib/api-client
    ├─ Imports ProgressDots from @/components/shared
    ├─ Imports SelectionList from @/components/shared
    ├─ Imports types from @/types/auth
    └─ Imports ErrorMessage from @/components/ui
        ↓
useEffect triggers
    ├─ apiClient.getSchools() is called
    └─ Returns: SchoolType[]
        ↓
Schools displayed in SelectionList
    ├─ User selects a school
    └─ Triggers apiClient.getFaculties(schoolId)
        ↓
Faculties displayed in SelectionList
    ├─ User selects a faculty
    └─ Triggers apiClient.getDepartments(facultyId)
        ↓
Departments displayed in SelectionList
    ├─ User selects a department
    └─ ProgressDots advances
        ↓
User fills form details
    └─ Submits registration
        ↓
apiClient.register() is called
    ├─ Success: Redirect to dashboard
    └─ Error: ErrorMessage displayed
```

---

## Key Concepts

### 1. Single Responsibility
Each module does ONE thing:
- `api-client.ts` → API calls only
- `ProgressDots.tsx` → Progress display only
- `SelectionList.tsx` → List selection only

### 2. Props-Based Communication
Components receive data via props, not global state:
```typescript
<SelectionList 
  items={schools}
  selectedId={selected?.id}
  onSelect={handleSelect}
  filterQuery={query}
  isLoading={loading}
/>
```

### 3. Composition
Build complex UIs from simple components:
```typescript
<div>
  <ProgressDots currentStep="school" />
  <SearchInput value={q} onChange={setQ} />
  {error && <ErrorMessage message={error} />}
  {loading ? <LoadingSkeleton /> : <SelectionList ... />}
</div>
```

### 4. Environment-Based Configuration
API URLs from environment:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;
// Different per environment: dev, staging, production
```

---

## Usage Examples

### Example 1: Add New Type
```typescript
// types/marketplace.ts
export interface ListingType {
  id: string;
  title: string;
  price: number;
  category: string;
}
```

### Example 2: Add New API Method
```typescript
// lib/api-client.ts
async getListings(category: string): Promise<ListingType[]> {
  return this.request(`/marketplace/listings?category=${category}`);
}
```

### Example 3: Create Reusable Component
```typescript
// components/shared/ListingCard.tsx
import { ListingType } from "@/types/marketplace";

interface ListingCardProps {
  listing: ListingType;
  onSelect: (id: string) => void;
}

export function ListingCard({ listing, onSelect }: ListingCardProps) {
  return (
    <div onClick={() => onSelect(listing.id)}>
      <h3>{listing.title}</h3>
      <p>₦{listing.price}</p>
    </div>
  );
}
```

### Example 4: Use in Page
```typescript
// app/marketplace/page.tsx
import { apiClient } from "@/lib/api-client";
import { ListingCard } from "@/components/shared/ListingCard";
import type { ListingType } from "@/types/marketplace";

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingType[]>([]);
  
  useEffect(() => {
    apiClient.getListings("BOOKS").then(setListings);
  }, []);
  
  return (
    <div>
      {listings.map(listing => (
        <ListingCard key={listing.id} listing={listing} onSelect={...} />
      ))}
    </div>
  );
}
```

---

## Testing Strategy

With modular structure, testing becomes easier:

```typescript
// __tests__/components/shared/SelectionList.test.tsx
test("highlights selected item", () => {
  render(
    <SelectionList
      items={mockItems}
      selectedId="2"
      onSelect={jest.fn()}
      filterQuery=""
      isLoading={false}
    />
  );
  
  expect(screen.getByText("Selected Item")).toHaveClass("bg-indigo-50");
});

// __tests__/lib/api-client.test.tsx
test("getSchools returns array", async () => {
  const schools = await apiClient.getSchools();
  expect(Array.isArray(schools)).toBe(true);
});
```

---

## Performance Considerations

### Code Splitting
Shared components are only loaded once:
```typescript
// Loaded once, used everywhere
import { SelectionList } from "@/components/shared/SelectionList";
```

### Lazy Loading
Can lazy-load heavy components:
```typescript
const HeavyComponent = dynamic(
  () => import("@/components/shared/HeavyComponent"),
  { loading: () => <LoadingSkeleton /> }
);
```

### API Caching
Future improvement - cache API responses:
```typescript
private cache = new Map();

async getSchools(): Promise<SchoolType[]> {
  if (this.cache.has('schools')) {
    return this.cache.get('schools');
  }
  const data = await this.request('/school/schools');
  this.cache.set('schools', data);
  return data;
}
```

---

## Migration Path

### Phase 1: Current ✅
- Register page refactored
- API client created
- Core types defined
- UI components created

### Phase 2: Next
- Refactor login page
- Create auth hooks
- Add form validators

### Phase 3: Future
- Marketplace features
- Community features
- Admin dashboard
- Mobile optimization

---

## Resources

📖 **Documentation:**
- `/docs/PROJECT_STRUCTURE.md` - Detailed architecture
- `/docs/QUICK_START.md` - Common patterns
- `/docs/REFACTOR_SUMMARY.md` - What changed

💡 **Examples:**
- `/app/register/page.tsx` - Best practice example
- `/components/shared/SelectionList.tsx` - Component pattern
- `/lib/api-client.ts` - API service pattern

---

## Common Issues & Solutions

### Issue: "Module not found"
**Solution:** Use `@/` absolute imports
```typescript
// ❌ Don't
import { apiClient } from "../../lib/api-client";

// ✅ Do
import { apiClient } from "@/lib/api-client";
```

### Issue: Props drilling
**Solution:** Create a shared component to handle it
```typescript
// ❌ Don't pass same props through 5 components
<A prop={x}><B prop={x}><C prop={x}></C></B></A>

// ✅ Do create wrapper component
<CombinedComponent prop={x} />
```

### Issue: API URL hardcoded
**Solution:** Use environment variable
```typescript
// ❌ Don't
const url = "http://localhost:3000/api";

// ✅ Do
const url = process.env.NEXT_PUBLIC_API_URL;
```

---

## Checklist for New Features

- [ ] Created types in `/types/[feature].ts`
- [ ] Added API methods in `/lib/api-client.ts`
- [ ] Created shared components in `/components/shared/`
- [ ] Used reusable UI components from `/components/ui/`
- [ ] Used environment variables for configuration
- [ ] No hardcoded values in components
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Used `@/` absolute imports
- [ ] Followed naming conventions



---

## Phase 2: Authentication & Modular Architecture

### New Additions

#### `/lib/hooks`
Custom React hooks for state management and side effects.

```
lib/hooks/
├── useAuth.ts           ← Authentication state management
├── useForm.ts           ← Form state and validation
├── useAsync.ts          ← Async operation state
├── useLocalStorage.ts   ← localStorage persistence
└── index.ts             ← Export all hooks
```

**Examples:**

```typescript
// useAuth - Manage login/logout state
const { user, isAuthenticated, login, logout } = useAuth();

// useForm - Manage form state with validation
const form = useForm({
  initialValues: { email: '', password: '' },
  validate: (values) => ({ /* errors */ }),
  onSubmit: async (values) => { /* submit */ }
});

// useAsync - Handle async operations
const { data, loading, error, execute } = useAsync(
  () => apiClient.getSchools(),
  true // immediate execution
);

// useLocalStorage - Persist to localStorage
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

#### `/lib/validators`
Reusable validation functions for forms.

```
lib/validators/
├── email.ts             ← Email format validation
├── password.ts          ← Password strength validation
├── fields.ts            ← Generic field validators
├── form.ts              ← Multi-field form validators
└── index.ts             ← Export all validators
```

**Examples:**

```typescript
// Email validation
const result = validateEmail('user@example.com');
if (!result.valid) console.log(result.error);

// Password validation with strength
const result = validatePassword('MyPass123!');
console.log(result.strength); // 'strong'

// Field-level validators
const error = validateRequired('email', 'Email');
if (error) console.log(error);

// Form validation with schema
const errors = validateForm(values, {
  email: validateEmail,
  password: validatePassword
});
```

#### `/lib/storage`
Abstraction layer for browser storage mechanisms.

```
lib/storage/
├── localStorage.ts      ← Persistent storage
├── sessionStorage.ts    ← Session-only storage
├── cookies.ts           ← Secure cookie management
└── index.ts             ← Export all managers
```

**Examples:**

```typescript
// localStorage - Persistent
localStorageManager.setItem('preferences', prefs);
const prefs = localStorageManager.getItem('preferences');

// sessionStorage - Session-only
sessionStorageManager.setItem('form_draft', formData);

// cookies - Secure tokens
cookieManager.setCookie('auth_token', token, {
  secure: true,
  httpOnly: true,
  maxAge: 3600
});
```

#### `/components/shared/LoginForm.tsx`
Reusable login form component.

```typescript
<LoginForm
  onSubmit={(email, password) => handleLogin(email, password)}
  isLoading={loading}
  error={error}
/>
```

#### `/components/ui/PasswordInput.tsx`
Password input with visibility toggle and strength indicator.

```typescript
<PasswordInput
  value={password}
  onChange={setPassword}
  error={error}
/>
```

### Data Flow: Authentication

```
User visits /login
      ↓
LoginForm component renders
├─ Imports useAuth hook
├─ Imports LoginForm component
└─ Imports PasswordInput component
      ↓
User submits form
      ↓
LoginForm calls onSubmit callback
      ↓
useAuth's login() method called
├─ Validates email format
├─ Calls apiClient.login(email, password)
├─ Stores token and refreshToken
├─ Updates authentication state
└─ Returns authenticated user
      ↓
Page redirects to /dashboard
      ↓
useAuth hook on dashboard checks session
├─ Restores user from localStorage
├─ Token included in all API requests
└─ 401 responses trigger auto-refresh
```

### Update: `/lib/api-client.ts`

Extended with authentication methods:

```typescript
// New methods
apiClient.login(email, password): Promise<AuthResponse>
apiClient.logout(): Promise<void>
apiClient.checkAuth(): Promise<User | null>
apiClient.refreshToken(): Promise<AuthResponse>

// Request interceptor
- Adds auth token to all requests
- Handles 401 responses
- Refreshes token and retries automatically
```

### Update: Protected Routes

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading]);
  
  if (loading) return <LoadingSkeleton />;
  if (!isAuthenticated) return null;
  
  return <Dashboard />;
}
```

### Import Patterns: Phase 2

```typescript
// Hooks
import { useAuth, useForm, useAsync, useLocalStorage } from '@/lib/hooks';

// Validators
import { validateEmail, validatePassword, validateForm } from '@/lib/validators';

// Storage
import { localStorageManager, sessionStorageManager, cookieManager } from '@/lib/storage';

// Components
import { LoginForm } from '@/components/shared/LoginForm';
import { PasswordInput } from '@/components/ui/PasswordInput';

// Types
import { User, AuthResponse, LoginCredentials } from '@/types/auth';

// API
import { apiClient } from '@/lib/api-client';
```

### File Structure: Phase 2

```
lib/
├── api-client.ts        (UPDATED - auth methods)
├── biometrics.ts
├── hooks/               (NEW)
│   ├── useAuth.ts
│   ├── useForm.ts
│   ├── useAsync.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── validators/          (NEW)
│   ├── email.ts
│   ├── password.ts
│   ├── fields.ts
│   ├── form.ts
│   └── index.ts
└── storage/             (NEW)
    ├── localStorage.ts
    ├── sessionStorage.ts
    ├── cookies.ts
    └── index.ts

components/
├── shared/
│   ├── LoginForm.tsx    (NEW)
│   ├── ProgressDots.tsx
│   ├── SearchInput.tsx
│   └── SelectionList.tsx
└── ui/
    ├── PasswordInput.tsx (NEW)
    ├── ErrorMessage.tsx
    ├── LoadingSkeleton.tsx
    └── button.tsx

types/
└── auth.ts              (UPDATED - new types)

docs/
├── HOOKS_GUIDE.md       (NEW)
├── VALIDATORS_GUIDE.md  (NEW)
├── STORAGE_GUIDE.md     (NEW)
├── AUTH_INTEGRATION_GUIDE.md (NEW)
└── MODULAR_STRUCTURE_GUIDE.md (UPDATED)
```

### Best Practices: Phase 2

1. **Always use hooks for state management**
   ```typescript
   // ✅ Use hooks
   const { user, login } = useAuth();
   const form = useForm({ /* config */ });
   
   // ❌ Avoid lifting state manually
   const [user, setUser] = useState(null);
   ```

2. **Validate early, display errors late**
   ```typescript
   // ✅ Validate on blur, show on touched
   if (form.touched.email && form.errors.email) {
     showError(form.errors.email);
   }
   
   // ❌ Show errors immediately
   showError(form.errors.email);
   ```

3. **Use schema-based validation**
   ```typescript
   // ✅ Create reusable validator
   const loginValidator = createFormValidator({
     email: validateEmail,
     password: validatePassword
   });
   
   // ❌ Hardcode validation in components
   if (!email.includes('@')) { /* error */ }
   ```

4. **Type all storage access**
   ```typescript
   // ✅ Type-safe retrieval
   const prefs = localStorageManager.getItem<UserPreferences>('prefs');
   
   // ❌ Risky cast
   const prefs = localStorageManager.getItem('prefs') as any;
   ```

5. **Protect sensitive routes**
   ```typescript
   // ✅ Check auth in useEffect
   useEffect(() => {
     if (!isAuthenticated) router.push('/login');
   }, [isAuthenticated]);
   
   // ❌ No protection
   // render protected content directly
   ```

### Testing: Phase 2

```typescript
// Test validators
describe('validateEmail', () => {
  it('accepts valid emails', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
  });
});

// Test hooks
describe('useAuth', () => {
  it('restores session from localStorage', () => {
    // Mock localStorage with token
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
  });
});

// Test form validation
describe('LoginForm', () => {
  it('validates email on blur', async () => {
    const { getByLabelText, getByText } = render(<LoginForm {...props} />);
    const input = getByLabelText('Email');
    fireEvent.blur(input);
    expect(getByText('Invalid email')).toBeInTheDocument();
  });
});
```

### Documentation: Phase 2

See new guides for detailed usage:
- `/docs/HOOKS_GUIDE.md` - Hook examples and patterns
- `/docs/VALIDATORS_GUIDE.md` - Validation composition
- `/docs/STORAGE_GUIDE.md` - Storage security
- `/docs/AUTH_INTEGRATION_GUIDE.md` - End-to-end auth flow

### Migration Timeline

**Day 1-2:** Create folder structure, types, and hooks
**Day 3:** Implement validators and storage utilities
**Day 4:** Extend API client with auth methods
**Day 5:** Create LoginForm and PasswordInput components
**Day 6:** Update login page, create protected routes
**Day 7:** Testing and documentation

