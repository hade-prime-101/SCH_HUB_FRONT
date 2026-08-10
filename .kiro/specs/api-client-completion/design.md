# Design Document: API Client Completion

## Overview

The API Client Completion feature provides the missing infrastructure layer for complete authentication flows and global error handling. This design establishes four interdependent systems: (1) an enhanced API Client that supports OTP, password recovery, and token refresh; (2) an Error Handler that classifies HTTP errors and formats them for UI consumption; (3) an Error Context provider for global error state management; and (4) a ProtectedRoute component system for role-based access control.

The feature bridges the gap between the existing authentication hook (`useAuth`) and UI components by providing:
- Standardized API response normalization
- HTTP status code classification with retry logic
- Centralized error management with toast notifications
- Route protection based on authentication and authorization state
- Role-specific dashboard routing

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Application Layer                     │
│  (UI Components: Login, Dashboard, Protected Routes)        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  useAuth     │  │ ProtectedRoute   │  │ErrorContext  │
│  Hook        │  │  Component   │  │  Provider    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                  ┌──────────────────┐
                  │   API Client     │
                  │  (Request/       │
                  │   Response Mgmt) │
                  └────────┬─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌───────────┐   ┌──────────────┐   ┌─────────────┐
  │ Interceptors │ Error Handler  │ Token Manager │
  │(Auth/Norm.)  │(Classification)│ (Storage/Ref.)│
  └───────────┘   └──────────────┘   └─────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                    ┌──────────────┐
                    │ Backend API  │
                    └──────────────┘
```

### Component Interactions

1. **API Client** acts as the HTTP communication layer, handling all backend requests
2. **Interceptors** normalize responses and handle token refresh on 401 errors
3. **Error Handler** classifies errors and formats them for UI consumption
4. **Error Context** provides global error state accessible throughout the app
5. **ProtectedRoute** enforces authentication and authorization at the routing level
6. **useAuth** hook manages user authentication state and coordinates with API Client

---

## Components and Interfaces

### 1. Enhanced API Client

**File:** `/lib/api-client.ts`

New methods to support additional authentication flows:

```typescript
interface ApiClient {
  // Existing methods
  login(email: string, password: string): Promise<{ data: AuthResponse }>;
  logout(): Promise<void>;
  checkAuth(): Promise<User | null>;
  refreshToken(): Promise<AuthResponse>;
  
  // New methods
  verifyOtp(otp: string): Promise<AuthResponse>;
  resendOtp(email: string): Promise<{ message: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(token: string, password: string): Promise<AuthResponse>;
}
```

**Key responsibilities:**
- Normalize all responses to standard shape
- Store tokens in localStorage on authentication endpoints
- Automatically include Authorization header with access token
- Implement 401 handling with token refresh and retry
- Classify errors and propagate to Error Handler

### 2. Response Normalization

**Shape for successful responses:**
```typescript
interface NormalizedSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}
```

**Shape for error responses:**
```typescript
interface NormalizedErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string>; // Field-level validation errors
}
```

**Normalization logic:**
- Extract response.data or response directly
- Wrap in success/failure envelope
- Extract field validation errors into errors object
- Provide sensible defaults for missing fields

### 3. Error Handler Utility

**File:** `/lib/error-handler.ts`

```typescript
interface ApiError {
  status: number;
  message: string;
  code: string;
  validationErrors?: Record<string, string>;
  isRetriable: boolean;
  retryCount: number;
  errorId: string;
}

class ErrorHandler {
  classifyError(response: Response): ApiError;
  formatError(error: ApiError): string;
  shouldRetry(error: ApiError): boolean;
  getBackoffDelay(retryCount: number): number;
}
```

**Status code classification matrix:**

| Status | Classification | Retriable | Action |
|--------|-----------------|-----------|--------|
| 400 | Validation Error | No | Extract field errors |
| 401 | Authentication Error | Yes (with token refresh) | Trigger logout if refresh fails |
| 403 | Authorization Error | No | Redirect to /unauthorized |
| 404 | Not Found | No | Display resource error |
| 408 | Timeout | Yes | Exponential backoff |
| 429 | Rate Limited | Yes | Exponential backoff |
| 5xx | Server Error | Yes | Exponential backoff |

**Exponential backoff sequence:** 2s → 4s → 8s → 16s → 32s (max 3 retries)

### 4. Error Context Provider

**File:** `/lib/context/ErrorContext.tsx`

```typescript
interface ErrorNotification extends ApiError {
  id: string;
}

interface ErrorContextValue {
  errors: ErrorNotification[];
  addError(error: Omit<ApiError, 'errorId'>): string; // Returns error ID
  removeError(errorId: string): void;
  clearErrors(): void;
}
```

**Features:**
- Maintains array of error notifications
- Auto-generates unique error IDs (UUID v4)
- Provides add/remove/clear operations
- No automatic dismissal (handled by Toast component)

### 5. ProtectedRoute Component

**File:** `/components/navigation/ProtectedRoute.tsx`

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallbackPath?: string;
}

interface RouteConfig {
  path: string;
  allowedRoles: string[];
  isPublic: boolean;
  requiresAuth: boolean;
}
```

**Behavior matrix:**

| Auth State | Has Role | Action |
|-----------|----------|--------|
| Loading | - | Render loading indicator |
| False | - | Redirect to /login |
| True | Yes | Render component |
| True | No | Redirect to fallbackPath or /unauthorized |

**Role mapping:**
- 'student' → `/student` dashboard
- 'admin' → `/admin` dashboard  
- 'super-admin' → `/super-admin` dashboard

### 6. Token Manager

**File:** `/lib/token-manager.ts`

```typescript
interface TokenManager {
  storeTokens(token: string, refreshToken: string): void;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  clearTokens(): void;
  isTokenExpired(token: string): boolean;
}
```

**Implementation details:**
- Uses localStorage for persistence
- Handles SSR by checking typeof window
- Silently fails on quota exceeded
- Decodes JWT to check expiration

---

## Data Models

### API Error Type

```typescript
interface ApiError {
  status: number;              // HTTP status code
  message: string;             // User-friendly error message
  code: string;                // Machine-readable error code
  validationErrors?: {         // Field-level validation errors
    [fieldName: string]: string;
  };
  isRetriable: boolean;        // Can this error be retried?
  retryCount: number;          // Current retry attempt (0-3)
  maxRetries: number;          // Maximum allowed retries
  errorId: string;             // Unique ID for tracking
  rawError?: unknown;          // Original error for debugging
}
```

### Normalized Response

```typescript
type NormalizedResponse<T> = 
  | {
      success: true;
      data: T;
      meta?: Record<string, unknown>;
    }
  | {
      success: false;
      message: string;
      code: string;
      errors?: Record<string, string>;
    };
```

### Authentication Response

```typescript
interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  dashboardRedirect: string; // e.g., "/student", "/admin"
}

interface User {
  id: string;
  email: string;
  roles: string[];
  school?: string;
  faculty?: string;
  department?: string;
}
```

---

## Error Handling Strategy

### Classification Flow

```
HTTP Response
    │
    ├─ Status Code Check
    │   ├─ 400 → Validation Error
    │   ├─ 401 → Authentication Error
    │   ├─ 403 → Authorization Error
    │   ├─ 404 → Not Found
    │   ├─ 408 → Timeout (Retriable)
    │   ├─ 429 → Rate Limited (Retriable)
    │   └─ 5xx → Server Error (Retriable)
    │
    ├─ Message Formatting
    │   ├─ Extract validation errors for 400
    │   ├─ Transform technical messages to user-friendly
    │   └─ Preserve field mapping
    │
    └─ Context Distribution
        ├─ Add to Error_Context
        ├─ Generate unique error ID
        └─ Trigger Toast notification
```

### Retry Logic

```
API Request
    │
    ├─ Succeeds
    │   └─ Return response
    │
    └─ Fails
        │
        ├─ Check if retriable
        │   └─ No
        │       └─ Add to Error_Context
        │
        └─ Yes
            │
            ├─ For 401
            │   ├─ Attempt token refresh
            │   ├─ Success
            │   │   └─ Retry original request with new token
            │   └─ Failure
            │       └─ Logout and redirect to login
            │
            ├─ For 429, 408, 5xx
            │   ├─ Calculate exponential backoff (2^n seconds, max 32s)
            │   ├─ Wait for delay
            │   ├─ Retry up to 3 times
            │   └─ After max retries, add to Error_Context
            │
            └─ For other errors
                └─ Add to Error_Context
```

### Error Message Formatting

```typescript
// Validation error format
{
  fieldName1: "This field is required",
  fieldName2: "Must be a valid email"
}

// General error format
"An error occurred. Please try again."

// Formatted for logging
"ApiError [400] (VALIDATION_ERROR): Bad Request
  - fieldName: This field is required
  - email: Must be a valid email
  Raw error: ..."
```

---

## Testing Strategy

Given the integration-heavy nature of this feature, testing focuses on **example-based integration tests** and **unit tests for pure functions**, rather than property-based tests.

### Unit Tests (Pure Functions)

**Error Classification:**
- Test each HTTP status code maps to correct classification
- Test retry eligibility for each status code
- Test exponential backoff calculation (2, 4, 8, 16, 32)

**Error Formatting:**
- Test validation error extraction from 400 responses
- Test user-friendly message generation
- Test sensitive data filtering (no tokens/passwords in logs)

**Response Normalization:**
- Test success response wrapping to standard shape
- Test error response extraction and normalization
- Test field-level error object creation

**Token Management:**
- Test token storage and retrieval
- Test JWT expiration detection
- Test clear operation removes all tokens

### Integration Tests

**API Client with Endpoints:**
- Test POST /auth/verify-otp with valid OTP → returns AuthResponse
- Test POST /auth/verify-otp with invalid OTP → returns 400 validation error
- Test POST /auth/resend-otp → triggers token storage
- Test POST /auth/forgot-password with valid email → returns success message
- Test POST /auth/forgot-password with invalid email → returns 404 error
- Test POST /auth/reset-password → returns AuthResponse and updates tokens
- Test GET /auth/me with expired token → triggers refresh flow

**Token Refresh on 401:**
- Test API request with expired token → automatically refreshes
- Test token refresh failure → logs out and redirects to login
- Test successful refresh → retries original request with new token

**Error Context Integration:**
- Test addError() generates unique error IDs
- Test removeError() removes error from array
- Test clearErrors() empties error array

**ProtectedRoute Component:**
- Test unauthenticated user redirects to /login
- Test authenticated user without required role redirects to /unauthorized
- Test authenticated user with correct role renders component
- Test loading state shows loading indicator during auth check
- Test dashboard redirect follows dashboardRedirect field

**Token Persistence:**
- Test login endpoint stores tokens in localStorage
- Test verifyOtp stores tokens in localStorage
- Test resetPassword stores tokens in localStorage
- Test subsequent requests include Authorization header
- Test logout clears all tokens from storage

### Example Test Scenarios

**Login with OTP Flow:**
1. User submits email/password via login form
2. Backend returns OTP required response
3. User enters OTP code
4. verifyOtp() called → returns AuthResponse
5. Tokens stored → useAuth state updated → redirect to dashboard

**Password Recovery Flow:**
1. User clicks "Forgot Password"
2. forgotPassword(email) called → returns success
3. User clicks reset link in email
4. User enters new password
5. resetPassword(token, password) called → returns AuthResponse
6. Tokens stored → user logged in → redirect to dashboard

**401 Token Refresh Flow:**
1. API request made with valid token
2. Token expires between requests
3. Request fails with 401
4. Token refresh attempted with refresh token
5. New tokens stored
6. Original request retried with new token
7. Success response returned

**Error Display Flow:**
1. API request fails with validation error (400)
2. Error classified and formatted
3. addError() called on Error_Context
4. Toast component detects new error
5. Toast displays field-level errors
6. User dismisses or toast auto-dismisses after 5 seconds
7. removeError() called on Error_Context

---

## Integration Points

### With useAuth Hook

The enhanced API Client supports the existing `useAuth` hook with new methods:

```typescript
// In useAuth.login()
const response = await apiClient.login(email, password);
storeToken(response.data.token);
storeRefreshToken(response.data.refreshToken);

// In new OTP flow
const otpResponse = await apiClient.verifyOtp(otpCode);
storeToken(otpResponse.token);
storeRefreshToken(otpResponse.refreshToken);
```

### With Next.js Routing

ProtectedRoute wraps components in layout or page files:

```typescript
// app/dashboard/layout.tsx
<ProtectedRoute allowedRoles={['student']}>
  <StudentDashboard />
</ProtectedRoute>
```

### With Error Display

Error_Context integrates with a Toast component:

```typescript
// In a Toast component
const { errors } = useContext(ErrorContext);

return (
  <div>
    {errors.map(error => (
      <Toast key={error.errorId} error={error} />
    ))}
  </div>
);
```

### With Dashboard Navigation

Dashboard redirect uses the `dashboardRedirect` field:

```typescript
// After successful login/OTP verification
const { dashboardRedirect } = authResponse;
router.push(dashboardRedirect); // e.g., "/student"
```

---

## State Management Strategy

### Error Storage

Errors are stored in Error_Context as an array:

```typescript
const [errors, setErrors] = useState<ErrorNotification[]>([]);
```

### Error Lifecycle

1. **Addition:** API error occurs → ErrorHandler classifies → addError() called
2. **Storage:** Error added to array with unique ID
3. **Display:** Toast component renders based on error array
4. **Removal:** User dismisses toast → removeError(id) called
5. **Auto-dismissal:** After 5 seconds, Toast automatically calls removeError()

### Token Storage

Tokens persist across page reloads:

```typescript
// Login
localStorage.setItem('auth_token', token);
localStorage.setItem('refresh_token', refreshToken);

// Subsequent requests
const token = localStorage.getItem('auth_token');
headers['Authorization'] = `Bearer ${token}`;

// Logout
localStorage.removeItem('auth_token');
localStorage.removeItem('refresh_token');
```

---

## Design Patterns

### 1. Interceptor Pattern

API Client uses interceptors for request/response handling:

```typescript
private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
  // Request interceptor: Add auth header
  headers['Authorization'] = `Bearer ${this.getAuthToken()}`;
  
  const response = await fetch(url, { ...options, headers });
  
  // Response interceptor: Handle 401
  if (response.status === 401) {
    // Attempt token refresh
    // Retry request with new token
  }
  
  // Response normalizer: Wrap in standard shape
  return normalizeResponse(data);
}
```

### 2. Provider Pattern

Error_Context uses Provider pattern for global state:

```typescript
<ErrorProvider>
  <Application />
</ErrorProvider>
```

Allows any component to access errors without prop drilling:

```typescript
const { errors, addError, removeError } = useContext(ErrorContext);
```

### 3. HOC Pattern (Higher-Order Component)

ProtectedRoute wraps components to enforce access control:

```typescript
<ProtectedRoute allowedRoles={['student']}>
  <StudentDashboard />
</ProtectedRoute>
```

Internally checks auth state and conditionally renders.

### 4. Factory Pattern

ErrorHandler creates ApiError objects:

```typescript
function createApiError(response: Response): ApiError {
  const status = response.status;
  return {
    status,
    code: statusToCode(status),
    message: statusToUserMessage(status),
    isRetriable: isRetriable(status),
    errorId: generateUUID(),
    retryCount: 0,
  };
}
```

---

## File Structure

```
lib/
├── api-client.ts                    # Enhanced HTTP client
├── error-handler.ts                 # Error classification & formatting
├── token-manager.ts                 # Token persistence & refresh
└── context/
    └── ErrorContext.tsx             # Error state provider
    
components/
├── navigation/
│   └── ProtectedRoute.tsx           # Route protection component
│   
└── ui/
    ├── Toast.tsx                    # Error notification display
    └── ErrorMessage.tsx             # Field error display
```

---

## Implementation Order

1. **Phase 1: API Client Enhancement**
   - Add verifyOtp, resendOtp, forgotPassword, resetPassword methods
   - Implement response normalization
   - Add token storage after auth endpoints

2. **Phase 2: Error Handling**
   - Implement ErrorHandler with status classification
   - Add exponential backoff calculation
   - Implement error formatting utilities

3. **Phase 3: Global Error State**
   - Create ErrorContext provider
   - Implement addError/removeError functions
   - Set up error ID generation

4. **Phase 4: Route Protection**
   - Create ProtectedRoute component
   - Integrate with useAuth hook
   - Implement role-based access control

5. **Phase 5: Token Refresh Flow**
   - Implement 401 handling in API Client
   - Add retry logic with backoff
   - Integrate with Error_Context

6. **Phase 6: UI Integration**
   - Create Toast component for error display
   - Create field error display component
   - Integrate with Error_Context

---

## Design Decisions and Rationale

### Decision 1: Response Normalization at API Client Level
**Rationale:** Normalizing responses centrally ensures all consumers (useAuth, components) receive consistent data shapes, reducing error handling complexity across the app.

### Decision 2: Separate Error Handler Module
**Rationale:** Extracting error classification logic into a separate module enables testing pure functions independently and allows code reuse across different error contexts.

### Decision 3: Global Error Context Over Prop Drilling
**Rationale:** Error Context avoids passing error callbacks through many component layers, making code cleaner and enabling components to independently trigger error notifications.

### Decision 4: Exponential Backoff for Retries
**Rationale:** Exponential backoff (2, 4, 8, 16, 32 seconds) provides progressive delays that reduce server load during issues while giving time for transient problems to resolve.

### Decision 5: Role-Based Dashboard Redirect
**Rationale:** Using dashboardRedirect from backend response centralizes routing logic and allows backend to control user paths, enabling gradual rollout and A/B testing.

### Decision 6: ProtectedRoute as HOC
**Rationale:** HOC pattern keeps auth logic declarative and colocated with route definitions, making route structure self-documenting and easier to refactor.

---

## Error Scenarios Handled

1. **Network failure** → Retry with backoff → Timeout error → Add to Error_Context
2. **Validation error (400)** → Extract field errors → Display per-field feedback
3. **Expired token (401)** → Refresh with refresh token → Retry request → Success or logout
4. **Permission denied (403)** → Redirect to /unauthorized
5. **Not found (404)** → Display resource-not-found error
6. **Rate limited (429)** → Retry with exponential backoff → Timeout → Add to Error_Context
7. **Server error (5xx)** → Retry with exponential backoff → Max retries → Add to Error_Context

---

## Security Considerations

1. **Token Storage:** Tokens stored in localStorage (accessible to XSS). Consider moving to secure HTTP-only cookies in future.
2. **Error Messages:** Sensitive data (tokens, passwords) filtered from logged errors.
3. **CSRF Protection:** API client should include CSRF tokens if backend requires.
4. **Role Verification:** Role-based access control happens on backend; ProtectedRoute is UI-level protection only.
5. **Redirect Validation:** dashboardRedirect path should be validated against known safe paths.

