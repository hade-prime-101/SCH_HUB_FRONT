# Phase 2: Authentication & Modular Architecture - Requirements

## Overview

Phase 2 extends the modular architecture established in Phase 1 by implementing authentication infrastructure (login page refactoring, auth hooks, form validators) and storage utilities. This phase prioritizes code reusability, consistency with Phase 1 patterns, and team scalability.

**Timeline:** 2-3 weeks  
**Team Scope:** 2-3 developers  
**Dependencies:** Phase 1 complete (api-client, types, shared components)

---

## Requirements

### 1. Login Page Refactoring (Parity with Register Page)

**1.1** Refactor `/app/login/page.tsx` to use modular imports
- Import API client from `@/lib/api-client`
- Import types from `@/types/auth`
- Import shared components from `@/components/shared` (SearchInput, ErrorMessage)
- Import UI components from `@/components/ui` (LoadingSkeleton)
- Remove all inline API URLs and hardcoded logic
- Acceptance Criteria:
  - No hardcoded API URLs in component
  - All imports use `@/` absolute paths
  - Component uses `apiClient` for all API calls

**1.2** Create reusable `LoginForm` component
- File: `/components/shared/LoginForm.tsx`
- Props: `onSubmit`, `isLoading`, `error`
- Display email + password inputs with react-icons
- Add "Remember me" checkbox (future auth token persistence)
- Show password toggle icon
- Display error message if login fails
- Loading state on submit button
- Acceptance Criteria:
  - Component accepts login data and calls onSubmit
  - Handles form validation
  - Shows error state clearly

**1.3** Create reusable `PasswordInput` component
- File: `/components/ui/PasswordInput.tsx`
- Props: `value`, `onChange`, `placeholder`, `error`
- Toggle password visibility with eye icon
- Show password strength indicator (optional)
- Display validation errors
- Acceptance Criteria:
  - Shows/hides password on icon click
  - Integrates with form validation
  - Accessible with proper labels

**1.4** Update login page to use new components
- Use `LoginForm` component for form UI
- Use `PasswordInput` for password field
- Use `ErrorMessage` for error display
- Use `LoadingSkeleton` during auth check
- Acceptance Criteria:
  - Login page is clean and composable
  - No UI duplication with register page

---

### 2. Authentication Hooks (`/lib/hooks/`)

**2.1** Create `useAuth` hook
- File: `/lib/hooks/useAuth.ts`
- Returns: `{ user, loading, error, login, logout, isAuthenticated }`
- Manages authentication state globally
- Handles session restoration from localStorage/cookies
- Syncs with backend auth state
- Acceptance Criteria:
  - Provides authenticated user info
  - Handles login/logout state transitions
  - Restores session on page reload

**2.2** Create `useForm` hook
- File: `/lib/hooks/useForm.ts`
- Props: `initialValues`, `onSubmit`, `validate`
- Returns: `{ values, errors, touched, handleChange, handleSubmit, setFieldValue }`
- Manages form state without third-party library
- Minimal bundle size addition
- Supports custom validation
- Acceptance Criteria:
  - Handles form value updates
  - Validates on blur
  - Provides submit handler
  - Works with multiple fields

**2.3** Create `useAsync` hook
- File: `/lib/hooks/useAsync.ts`
- Props: `asyncFunction`, `immediate` (default: true)
- Returns: `{ data, loading, error, execute }`
- Manages async operation state
- Prevents race conditions with cleanup
- Acceptance Criteria:
  - Handles loading state
  - Captures errors
  - Prevents memory leaks on unmount

**2.4** Create `useLocalStorage` hook
- File: `/lib/hooks/useLocalStorage.ts`
- Props: `key`, `initialValue`
- Returns: `[value, setValue]` (like useState)
- Syncs state with localStorage
- Handles JSON serialization
- Acceptance Criteria:
  - Persists value to localStorage
  - Syncs across tabs
  - Handles JSON serialization

---

### 3. Form Validators (`/lib/validators/`)

**3.1** Create email validator
- File: `/lib/validators/email.ts`
- Function: `validateEmail(email: string): { valid: boolean; error?: string }`
- RFC 5322 compatible regex or library
- Return user-friendly error messages
- Acceptance Criteria:
  - Validates standard email formats
  - Rejects invalid emails
  - Returns clear error messages

**3.2** Create password validator
- File: `/lib/validators/password.ts`
- Function: `validatePassword(password: string): { valid: boolean; errors: string[] }`
- Check: min 8 chars, 1 uppercase, 1 number, 1 special char
- Return list of failed validations
- Acceptance Criteria:
  - Enforces security requirements
  - Returns list of failures (not just valid/invalid)
  - Customizable rules via options

**3.3** Create generic form validator
- File: `/lib/validators/form.ts`
- Function: `createFormValidator(schema): validationFunction`
- Compose validators for multiple fields
- Returns errors object: `{ field1: "error", field2: "error" }`
- Acceptance Criteria:
  - Validates multiple fields
  - Returns all errors at once
  - Easy to compose validators

**3.4** Create field-level validators
- File: `/lib/validators/fields.ts`
- Functions: `validateRequired`, `validateMinLength`, `validatePattern`, etc.
- Build block validators for composing validation logic
- Acceptance Criteria:
  - Reusable across forms
  - Composable validators
  - Clear error messages

---

### 4. Storage Utilities (`/lib/storage/`)

**4.1** Create localStorage abstraction
- File: `/lib/storage/localStorage.ts`
- Functions: `getItem`, `setItem`, `removeItem`, `clear`
- Typed access: `getItem<T>(key): T | null`
- Handle JSON serialization/deserialization
- Handle quota exceeded errors
- Acceptance Criteria:
  - Type-safe storage access
  - Automatic JSON handling
  - Error handling for quota

**4.2** Create sessionStorage abstraction
- File: `/lib/storage/sessionStorage.ts`
- Same interface as localStorage
- Separate from localStorage for in-session data
- Acceptance Criteria:
  - Type-safe session storage
  - Clear API

**4.3** Create cookie utilities
- File: `/lib/storage/cookies.ts`
- Functions: `getCookie`, `setCookie`, `deleteCookie`
- Handle authentication tokens
- Support maxAge, secure, httpOnly options
- Acceptance Criteria:
  - Secure cookie management
  - Auth token support
  - Options handling

---

### 5. API Client Extensions

**5.1** Extend `/lib/api-client.ts` with auth methods
- Method: `loginWithEmail(email, password): Promise<AuthResponse>`
- Method: `logout(): Promise<void>`
- Method: `checkAuth(): Promise<User | null>`
- Method: `refreshToken(): Promise<AuthResponse>`
- Acceptance Criteria:
  - All auth endpoints available
  - Proper error handling
  - Token refresh support

**5.2** Add request interceptor for auth tokens
- Automatically include auth token in request headers
- Handle 401 responses (token expired)
- Refresh token on 401, retry request
- Acceptance Criteria:
  - Auth token automatically sent
  - 401 handling transparent to callers
  - Token refresh automatic

---

### 6. Auth Types (`/types/auth.ts`)

**6.1** Extend auth types
- `AuthResponse { user, token, refreshToken }`
- `User { id, email, roles, school, faculty, department }`
- `LoginCredentials { email, password }`
- `FormErrors { [field]: string }`
- Acceptance Criteria:
  - Complete auth domain types
  - Reusable across app

---

### 7. Integration & Testing

**7.1** Write tests for auth hooks
- Test `useAuth` hook initialization
- Test `useForm` hook value updates
- Test `useAsync` hook lifecycle
- Test `useLocalStorage` persistence
- Acceptance Criteria:
  - All hooks tested
  - Edge cases covered
  - Cleanup verified

**7.2** Write tests for validators
- Test email validator with valid/invalid emails
- Test password validator with weak/strong passwords
- Test form validator with multiple fields
- Test error message generation
- Acceptance Criteria:
  - All validators tested
  - Error messages verified
  - Edge cases covered

**7.3** Write tests for storage utilities
- Test localStorage read/write/delete
- Test sessionStorage isolation
- Test cookie creation/reading/deletion
- Test JSON serialization
- Test quota exceeded handling
- Acceptance Criteria:
  - All storage types tested
  - JSON handling verified
  - Error handling tested

**7.4** Integration test: Login flow
- Test complete login flow
- Test error states
- Test session persistence
- Test logout
- Test token refresh
- Acceptance Criteria:
  - Full flow works end-to-end
  - Error states handled
  - Session restored correctly

---

### 8. Documentation

**8.1** Create hook usage guide
- File: `/docs/HOOKS_GUIDE.md`
- Show examples for each hook
- Explain use cases
- Provide best practices
- Acceptance Criteria:
  - Clear examples
  - Use case documentation
  - Best practices explained

**8.2** Create validator usage guide
- File: `/docs/VALIDATORS_GUIDE.md`
- Show validator examples
- Show composition patterns
- Show error handling
- Acceptance Criteria:
  - Clear examples
  - Composition documented
  - Error patterns shown

**8.3** Create storage utilities guide
- File: `/docs/STORAGE_GUIDE.md`
- Show storage API usage
- Security considerations
- Cookie handling
- Acceptance Criteria:
  - Clear examples
  - Security guidelines
  - API documented

**8.4** Update main architecture guide
- File: `/MODULAR_STRUCTURE_GUIDE.md`
- Add Phase 2 patterns
- Add new folders explanation
- Update import patterns
- Acceptance Criteria:
  - Guide includes Phase 2
  - New patterns documented
  - Examples provided

---

## File Structure

```
/lib
  /hooks                          ← NEW
    useAuth.ts
    useForm.ts
    useAsync.ts
    useLocalStorage.ts
    index.ts
  /validators                     ← NEW
    email.ts
    password.ts
    form.ts
    fields.ts
    index.ts
  /storage                        ← NEW
    localStorage.ts
    sessionStorage.ts
    cookies.ts
    index.ts
  api-client.ts                   ← EXTENDED
  biometrics.ts

/components/shared
  LoginForm.tsx                   ← NEW
  SelectionList.tsx
  SearchInput.tsx
  ProgressDots.tsx

/components/ui
  PasswordInput.tsx               ← NEW
  ErrorMessage.tsx
  LoadingSkeleton.tsx

/app/login
  page.tsx                        ← REFACTORED

/types
  auth.ts                         ← EXTENDED

/docs
  HOOKS_GUIDE.md                  ← NEW
  VALIDATORS_GUIDE.md             ← NEW
  STORAGE_GUIDE.md                ← NEW
  MODULAR_STRUCTURE_GUIDE.md      ← UPDATED
```

---

## Design Patterns

### Hooks Pattern
All hooks follow React Hook best practices:
- Memoized callbacks
- Proper dependency arrays
- Cleanup functions where needed
- Custom hook naming (useXxx)

### Validator Pattern
All validators are pure functions:
- No side effects
- Composable
- Reusable
- Clear error messages

### Storage Pattern
All storage follows abstraction pattern:
- Type-safe access
- Consistent error handling
- JSON serialization built-in
- Quota exceeded handling

---

## Non-Functional Requirements

**Performance:**
- No regression from Phase 1
- Validators should be pure functions (no async)
- Storage should be O(1) operations
- Hooks should memoize callbacks

**Security:**
- Passwords never logged
- Auth tokens stored securely
- HTTPS enforced for auth
- CSRF tokens if needed

**Testing:**
- >85% code coverage for hooks
- >85% code coverage for validators
- >85% code coverage for storage
- Integration tests for full auth flow

---

## Success Criteria

✅ All files created with proper structure  
✅ Login page refactored to use modular imports  
✅ All hooks implemented and tested  
✅ All validators implemented and tested  
✅ All storage utilities implemented and tested  
✅ API client extended with auth methods  
✅ Full login flow works end-to-end  
✅ Documentation complete  
✅ >85% test coverage  
✅ No breaking changes to Phase 1
