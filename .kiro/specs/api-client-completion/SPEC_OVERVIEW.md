# API Client Completion - Spec Overview

## Feature Name
**api-client-completion**

## Purpose
Establish the missing 15% infrastructure layer needed before UI development can proceed. This spec defines the complete API communication layer including all authentication flows, error handling, and route protection.

## Four Strategic Areas

### 1. Complete API Client Methods (Requirements 1-5)
Expands the API client with missing authentication endpoints:
- **OTP Verification** (Req 1): Verify one-time passwords for multi-factor authentication
- **OTP Resend** (Req 2): Request new OTP codes when original expires
- **Forgot Password** (Req 3): Initiate password recovery flow
- **Reset Password** (Req 4): Complete password recovery with new password
- **Token Persistence** (Req 5): Ensure all auth endpoints properly store tokens for session continuity

**Implementation Focus**: Extend `apiClient` with new endpoint methods following existing patterns

---

### 2. Response Normalization & Error Handling (Requirements 6-10)
Standardizes all API responses and implements comprehensive error classification:
- **Response Normalization** (Req 6): All responses follow consistent success/error format
- **HTTP Status Classification** (Req 7): Map status codes to error types (400=validation, 401=auth, 403=forbidden, 404=not found, 409=conflict, 429=rate limit, 5xx=server error)
- **Error Message Formatting** (Req 8): Transform raw API errors into user-friendly UI-ready messages
- **Error Context Provider** (Req 9): Global error state management via React context
- **Retry Logic** (Req 10): Automatic retry with exponential backoff for transient errors (429, 5xx, 408)

**Implementation Focus**: Create new `Error_Handler` utility and `Error_Context` provider

---

### 3. Global Error Handling Strategy (Requirements 8-10, 16-17)
Implements error display and debugging infrastructure:
- Standardized error message formatting for each error type
- Global error context for cross-component error dispatch
- Integration with toast notifications for user feedback
- Pretty printer for error logging and debugging
- Automatic dismissal of notifications after 5 seconds

**Implementation Focus**: Error handler utilities, context provider, and toast integration

---

### 4. Route Protection & Navigation (Requirements 11-15)
Implements access control and role-based routing:
- **ProtectedRoute Component** (Req 11): Prevents unauthorized access, shows loading state during auth verification
- **Dashboard Routing** (Req 12): Extracts `dashboardRedirect` from auth response for role-specific navigation
- **Route Structure** (Req 13): Defines `/student`, `/admin`, `/super-admin` paths with `/login`, `/register`, `/forgot-password` as public
- **Unauthenticated Prevention** (Req 14): Blocks unauthenticated users from protected routes, redirects to login with intent to return after auth
- **Token Refresh on Error** (Req 15): Automatically refreshes tokens on 401 before failing requests

**Implementation Focus**: Create `ProtectedRoute` wrapper component and routing configuration

---

## Key Design Decisions

### 1. Error Classification Strategy
- **Validation Errors (400)**: Extract field-level errors for form display
- **Auth Errors (401/403)**: Trigger logout and redirect to login
- **Rate Limit (429)**: Mark as retriable with user-facing message
- **Server Errors (5xx)**: Log full error, show generic message, mark as retriable
- **Other 4xx**: Show as non-retriable errors

### 2. Token Management
- Access tokens stored in `localStorage` with key `auth_token`
- Refresh tokens stored in `localStorage` with key `refresh_token`
- Automatic token refresh on 401 before failing requests
- Only retry original request after successful token refresh
- Failed token refresh triggers logout

### 3. Error Display
- Toast notifications automatically dismiss after 5 seconds
- Validation errors show field names with corresponding messages
- General errors show as single message
- Multiple errors display as separate toasts simultaneously

### 4. Route Protection
- `ProtectedRoute` checks authentication status before rendering
- Loading state displayed during auth verification
- Attempted routes stored for post-login navigation
- Role-based access checking with unauthorized route fallback
- Unauthenticated users redirected to `/login`

---

## Testing Strategy

### Property-Based Tests
Recommended for requirements testing complex transformation logic:
- Response normalization (round-trip property)
- HTTP status classification (metamorphic property)
- Error message formatting (invariant property)
- Retry logic (idempotence property)
- Error pretty printing (round-trip property)

### Integration Tests
Recommended for endpoint and flow testing:
- OTP verification flow with success/failure scenarios
- Password reset flow with token expiration
- Token refresh on 401 error
- Route protection with authenticated/unauthenticated users
- Dashboard redirect based on user roles
- Error context dispatch and display

---

## File Structure (Post-Implementation)

```
lib/
├── api-client.ts                 (extended with new endpoints)
├── error/
│   ├── errorHandler.ts          (HTTP status classification, error formatting)
│   ├── errorContext.tsx         (React context provider)
│   └── errorTypes.ts            (Type definitions for errors)
├── hooks/
│   ├── useError.ts             (hook for using Error_Context)
│   └── useAuth.ts              (existing, no changes needed)
└── navigation/
    ├── ProtectedRoute.tsx       (route guard component)
    └── routeConfig.ts           (route definitions and role mappings)

components/
├── error/
│   └── ErrorToast.tsx           (toast notification component for errors)
└── navigation/
    └── RouteGuard.tsx           (alternative implementation if needed)

types/
├── auth.ts                       (existing, extend with error types)
└── api.ts                        (response and error type definitions)
```

---

## Success Criteria

After implementation, the system will have:

✅ All 5 authentication endpoints functional (login, verify-otp, resend-otp, forgot-password, reset-password)
✅ Standardized error classification for all HTTP status codes
✅ Automatic token refresh on expiration with 401 error handling
✅ Global error context for cross-component error display
✅ Toast notifications for all error types
✅ ProtectedRoute component preventing unauthorized access
✅ Role-based routing with dashboard redirect
✅ Comprehensive property-based and integration tests
✅ Error logging and debugging utilities
✅ Complete TypeScript type safety for all error scenarios

---

## Next Steps

1. **Phase 1 Complete**: Requirements defined with EARS patterns
2. **Phase 2 Next**: Design phase will create architecture and component specifications
3. **Phase 3 Final**: Task list for implementation with estimated effort per task

