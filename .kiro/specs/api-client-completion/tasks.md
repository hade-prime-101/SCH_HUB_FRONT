# Implementation Plan: API Client Completion

## Overview

This implementation plan breaks down the API Client Completion feature into six sequential phases that establish a complete authentication and error handling infrastructure. The phased approach allows parallel work within waves while maintaining clear dependencies: Phase 1 adds missing auth endpoints, Phase 2 builds error classification, Phase 3 centralizes error state, Phase 4 protects routes, Phase 5 integrates token refresh, and Phase 6 wires UI components. Each task builds on prior work with incremental validation through testing.

---

## Tasks

- [ ] 1. Phase 1: API Client Enhancement
  - [x] 1.1 Add verifyOtp method to API Client
    - Implement `verifyOtp(otp: string): Promise<AuthResponse>` method
    - Make POST request to `/auth/verify-otp` endpoint with OTP payload
    - Extract response data and normalize to standard response shape
    - Return AuthResponse with user, token, refreshToken, and dashboardRedirect
    - _Requirements: 1, 5, 6_
  
  - [x] 1.2 Add resendOtp method to API Client
    - Implement `resendOtp(email: string): Promise<{ message: string }>` method
    - Make POST request to `/auth/resend-otp` endpoint with email payload
    - Return success message for display to user
    - _Requirements: 2, 6_
  
  - [x] 1.3 Add forgotPassword method to API Client
    - Implement `forgotPassword(email: string): Promise<{ message: string }>` method
    - Make POST request to `/auth/forgot-password` endpoint with email payload
    - Return success message for display to user
    - _Requirements: 3, 6_
  
  - [x] 1.4 Add resetPassword method to API Client
    - Implement `resetPassword(token: string, password: string): Promise<AuthResponse>` method
    - Make POST request to `/auth/reset-password` endpoint with token and password payload
    - Extract response data and return AuthResponse
    - _Requirements: 4, 5, 6_
  
  - [ ] 1.5 Implement response normalization in API Client
    - Create `normalizeResponse()` utility function
    - Wrap successful responses in `{ success: true, data: <payload>, meta?: <metadata> }`
    - Extract field-level validation errors into errors object for 400 responses
    - Provide sensible defaults for missing fields
    - _Requirements: 6_
  
  - [ ] 1.6 Add token storage after authentication endpoints
    - Create `storeTokens(token: string, refreshToken: string)` function
    - Store tokens in localStorage with keys 'auth_token' and 'refresh_token'
    - Handle SSR scenarios by checking `typeof window`
    - Silently handle quota exceeded errors
    - _Requirements: 5_
  
  - [ ] 1.7 Add Authorization header injection to all requests
    - Create request interceptor that adds Bearer token from localStorage
    - Include Authorization header on all API requests except public endpoints
    - Handle missing token gracefully (continue without header)
    - _Requirements: 5_
  
  - [ ]* 1.8 Write unit tests for API Client methods
    - Test verifyOtp with valid OTP code
    - Test verifyOtp with invalid OTP code
    - Test resendOtp endpoint call and response
    - Test forgotPassword endpoint call and response
    - Test resetPassword endpoint call and response
    - Test response normalization for success cases
    - Test response normalization for error cases
    - Test token storage and retrieval
    - _Requirements: 1, 2, 3, 4, 5, 6_

- [ ] 2. Phase 2: Error Handling Infrastructure
  - [x] 2.1 Create ErrorHandler utility class with status classification
    - Implement `classifyError(response: Response): ApiError` method
    - Map HTTP 400 → Validation Error with field extraction
    - Map HTTP 401 → Authentication Error (retriable with token refresh)
    - Map HTTP 403 → Authorization Error (not retriable)
    - Map HTTP 404 → Not Found Error (not retriable)
    - Map HTTP 408 → Timeout Error (retriable with backoff)
    - Map HTTP 429 → Rate Limit Error (retriable with backoff)
    - Map HTTP 5xx → Server Error (retriable with backoff)
    - Generate unique error ID (UUID v4) for each error
    - _Requirements: 7_
  
  - [ ] 2.2 Implement exponential backoff calculation
    - Create `getBackoffDelay(retryCount: number): number` function
    - Calculate delays: 2s → 4s → 8s → 16s → 32s (max)
    - Ensure retry count does not exceed 3
    - Return delay in milliseconds
    - _Requirements: 10_
  
  - [x] 2.3 Implement error message formatting for UI
    - Create `formatErrorForUI(error: ApiError): string` function
    - For 400 errors: extract field-specific error messages
    - For general errors: format as single user-friendly string
    - Transform technical messages to user-facing language
    - Filter out sensitive data (tokens, passwords)
    - _Requirements: 8_
  
  - [ ] 2.4 Implement error pretty printer for logging
    - Create `formatErrorForLogging(error: ApiError): string` function
    - Include HTTP status code in output
    - Include error code and message in output
    - Display field-level errors in readable format (one per line with indentation)
    - Exclude sensitive user data from output
    - _Requirements: 17_
  
  - [x] 2.5 Create ApiError data model and validation
    - Define ApiError type with: status, message, code, validationErrors, isRetriable, retryCount, errorId
    - Create factory function to instantiate ApiError from Response
    - Add validation to ensure required fields are present
    - _Requirements: 7, 8_
  
  - [ ]* 2.6 Write unit tests for error classification
    - Test 400 response classification as validation error
    - Test 401 response classification as authentication error
    - Test 403 response classification as authorization error
    - Test 404 response classification as not found
    - Test 408 response classification as timeout (retriable)
    - Test 429 response classification as rate limit (retriable)
    - Test 5xx response classification as server error (retriable)
    - Test field-level error extraction from 400 responses
    - _Requirements: 7_
  
  - [ ]* 2.7 Write unit tests for backoff calculation
    - Test first retry (0) returns 2000ms
    - Test second retry (1) returns 4000ms
    - Test third retry (2) returns 8000ms
    - Test max retry count prevents exceeding 3
    - _Requirements: 10_
  
  - [ ]* 2.8 Write unit tests for error formatting
    - Test validation error formatting extracts field errors correctly
    - Test general error formatting returns user-friendly message
    - Test sensitive data filtering (tokens not in output)
    - Test field-level error formatting with multiple errors
    - _Requirements: 8, 17_

- [ ] 3. Checkpoint - Error handling infrastructure in place
  - Ensure all error handler unit tests pass
  - Verify classification matches design table (Req 7)
  - Verify backoff delays match specification (Req 10)
  - Ask the user if questions arise.

- [ ] 4. Phase 3: Global Error State Management
  - [ ] 4.1 Create error types file with ApiError and ErrorNotification interfaces
    - Define ApiError type with all required fields
    - Define ErrorNotification extending ApiError with unique id field
    - Create type guards for error validation
    - Export for use throughout application
    - _Requirements: 9_
  
  - [ ] 4.2 Create ErrorContext provider with state and functions
    - Implement React Context for error management
    - Create `useError()` hook for context consumption
    - Implement `addError()` function that generates unique error IDs
    - Implement `removeError()` function that removes by errorId
    - Implement `clearErrors()` function that empties error array
    - Maintain errors array state
    - _Requirements: 9_
  
  - [ ] 4.3 Create ErrorProvider component wrapper
    - Implement ErrorProvider component that wraps Context.Provider
    - Pass context value with errors array and functions
    - Export provider for use in app root
    - _Requirements: 9_
  
  - [ ]* 4.4 Write unit tests for Error Context
    - Test addError generates unique IDs
    - Test addError adds error to array
    - Test removeError removes correct error by ID
    - Test removeError does not affect other errors
    - Test clearErrors empties array
    - Test multiple errors can be stored simultaneously
    - _Requirements: 9_

- [ ] 5. Phase 4: Route Protection and Access Control
  - [ ] 5.1 Create ProtectedRoute component with authentication check
    - Implement ProtectedRoute component that accepts children and allowedRoles
    - Check authentication status via useAuth hook
    - Render loading indicator while auth status is being determined
    - Redirect to /login if user is not authenticated
    - Store attempted route for post-login redirect (intent storage)
    - _Requirements: 11, 14_
  
  - [ ] 5.2 Implement role-based access control in ProtectedRoute
    - Check user roles against allowedRoles list
    - If user lacks required role, redirect to fallback path based on user's role
    - Use dashboardRedirect from AuthResponse as primary fallback
    - Fall back to /unauthorized if no role-specific path available
    - _Requirements: 11, 12_
  
  - [ ] 5.3 Create RouteConfig definitions for all routes
    - Define route configuration for /student (allowedRoles: ['student'])
    - Define route configuration for /admin (allowedRoles: ['admin'])
    - Define route configuration for /super-admin (allowedRoles: ['super-admin'])
    - Define public routes: /login, /register, /forgot-password, /reset-password
    - Define /unauthorized route for access denied
    - _Requirements: 13_
  
  - [ ] 5.4 Create route structure for role-specific dashboards
    - Create /app/student/layout.tsx wrapper with ProtectedRoute
    - Create /app/admin/layout.tsx wrapper with ProtectedRoute
    - Create /app/super-admin/layout.tsx wrapper with ProtectedRoute
    - Create /app/unauthorized/page.tsx for access denied display
    - _Requirements: 12, 13_
  
  - [ ]* 5.5 Write integration tests for ProtectedRoute component
    - Test unauthenticated user redirects to /login
    - Test authenticated user with correct role renders component
    - Test authenticated user without required role redirects to /unauthorized
    - Test loading state displays loading indicator
    - Test intent storage captures attempted route
    - Test post-login redirect to captured intent route
    - _Requirements: 11, 14_

- [ ] 6. Phase 5: Token Refresh Flow Integration
  - [ ] 6.1 Implement 401 handling in API Client with token refresh
    - Check response status for 401 (Unauthorized)
    - If 401, attempt token refresh using refresh token
    - Call refresh endpoint with refresh token from localStorage
    - Store new tokens on successful refresh
    - Retry original request with new access token
    - _Requirements: 15_
  
  - [ ] 6.2 Implement token refresh retry logic with exponential backoff
    - Add retry logic for 429, 408, and 5xx errors
    - Use exponential backoff calculation from ErrorHandler
    - Limit retries to maximum of 3 attempts
    - Log retry attempts for debugging
    - Propagate error to Error_Context after max retries exhausted
    - _Requirements: 10, 15_
  
  - [ ] 6.3 Handle failed token refresh with logout redirect
    - If token refresh fails (401, 403, network error), do NOT retry original request
    - Clear all tokens from localStorage
    - Dispatch logout action to useAuth hook
    - Redirect user to /login with message: "Session expired, please log in again"
    - Add error to Error_Context for user notification
    - _Requirements: 15_
  
  - [ ] 6.4 Integrate ErrorHandler with API Client
    - Import ErrorHandler in API Client
    - Use classifyError() to categorize all error responses
    - Use formatErrorForUI() for user-facing error messages
    - Use shouldRetry() to determine retry eligibility
    - Propagate formatted errors to Error_Context
    - _Requirements: 7, 8, 10, 15_
  
  - [ ]* 6.5 Write integration tests for token refresh flow
    - Test 401 response triggers token refresh attempt
    - Test successful token refresh retries original request
    - Test failed token refresh logs out user
    - Test original request succeeds after token refresh
    - Test 429 error is retried with exponential backoff
    - Test 5xx error is retried with exponential backoff
    - Test max retries (3) prevents infinite attempts
    - _Requirements: 10, 15_
  
  - [ ]* 6.6 Write integration tests for OTP flows
    - Test verifyOtp endpoint returns AuthResponse
    - Test verifyOtp stores tokens in localStorage
    - Test verifyOtp invalid code returns validation error
    - Test resendOtp endpoint call and response
    - Test resendOtp rate limit returns 429 error
    - _Requirements: 1, 2_
  
  - [ ]* 6.7 Write integration tests for password recovery flows
    - Test forgotPassword endpoint returns success message
    - Test forgotPassword with unregistered email returns 404
    - Test resetPassword endpoint returns AuthResponse
    - Test resetPassword stores tokens in localStorage
    - Test resetPassword with invalid token returns 400 error
    - Test resetPassword with failed password validation returns field errors
    - _Requirements: 3, 4_

- [ ] 7. Checkpoint - Core API and error infrastructure complete
  - Ensure all integration tests for token refresh pass
  - Ensure OTP flow tests pass
  - Ensure password recovery flow tests pass
  - Verify token refresh on 401 works correctly
  - Ask the user if questions arise.

- [ ] 8. Phase 6: UI Integration and Error Display
  - [ ] 8.1 Create Toast component for error notification display
    - Create Toast component that accepts error object as prop
    - Display error message prominently
    - For validation errors, display field names and associated messages
    - For general errors, display single message
    - Include close button for manual dismissal
    - _Requirements: 16_
  
  - [ ] 8.2 Implement auto-dismiss functionality for Toast
    - Auto-dismiss Toast after 5 seconds
    - Cancel auto-dismiss if user hovers over Toast
    - Resume auto-dismiss if user stops hovering
    - Trigger removeError() on Error_Context when dismissed
    - _Requirements: 16_
  
  - [ ] 8.3 Create ErrorMessage component for field-level errors
    - Create component that displays validation errors per field
    - Show field label and corresponding error message
    - Use consistent styling for error indicators
    - Export for use in forms throughout application
    - _Requirements: 16, 8_
  
  - [ ] 8.4 Integrate Error_Context with Toast component system
    - Create ToastContainer component that subscribes to Error_Context
    - Render individual Toast for each error in error array
    - Pass removeError callback to Toast components
    - Display multiple toasts simultaneously for multiple errors
    - _Requirements: 16, 9_
  
  - [ ] 8.5 Wire ToastContainer into application root
    - Add ToastContainer to app/layout.tsx
    - Wrap with ErrorProvider to ensure context available
    - Position toasts in viewport (top-right or bottom-right)
    - Ensure z-index allows toasts to appear above other content
    - _Requirements: 16, 9_
  
  - [ ]* 8.6 Write integration test for error display with Toast
    - Test error added to Error_Context renders Toast
    - Test Toast displays validation errors with field names
    - Test Toast displays general errors as single message
    - Test Toast auto-dismisses after 5 seconds
    - Test manual close button calls removeError()
    - _Requirements: 16_
  
  - [ ]* 8.7 Write integration test for field error display
    - Test ErrorMessage component displays field error
    - Test multiple field errors display correctly
    - Test error styling is consistent with design system
    - _Requirements: 16, 8_

- [ ] 9. Final Checkpoint - All features complete and integrated
  - Ensure all UI integration tests pass
  - Verify error display works end-to-end
  - Verify token refresh and OTP flows work with error handling
  - Verify route protection prevents unauthorized access
  - Ask the user if questions arise.

---

## Notes

### Implementation Approach

- **Phase 1-2 (Waves 0-2):** Foundation layers (API methods, error classification) can be developed in parallel since they don't depend on each other
- **Phase 3 (Waves 3-4):** Error context depends on error types from Phase 2 but is independent of other systems
- **Phase 4 (Waves 5-6):** Route protection depends on useAuth but can be wired independently
- **Phase 5 (Waves 7-9):** Token refresh integration requires all prior phases complete
- **Phase 6 (Waves 10-11):** UI integration can progress in parallel with Phase 5 since they touch different concerns

### Testing Strategy

- **Unit tests (optional with \*):** Pure function tests for error classification, backoff calculation, formatting
- **Integration tests (optional with \*):** Multi-component tests for token refresh, OTP flows, route protection, error display
- **Checkpoints:** Validate work at phase boundaries before proceeding

### Task Dependency Notes

- Task 1.6 (token storage) depends on 1.1-1.4 (methods that return auth responses)
- Task 1.7 (Authorization header) depends on 1.6 (token storage)
- Task 2.1-2.4 can be developed in parallel
- Task 4.2-4.3 depend on 4.1 (types)
- Task 5.1-5.4 can be developed in parallel
- Task 6.1-6.4 depend on Phase 1, 2, and 4 completion
- Task 8.1-8.5 can be developed in parallel
- Task 8.5 depends on 8.1-8.4 completion

### Code Quality Standards

- All code must use TypeScript with strict null checks
- All API methods must handle network errors gracefully
- All error messages must be user-friendly (no technical jargon)
- All localStorage operations must handle quota exceeded gracefully
- All components must handle loading and error states
- All tests must use the existing Vitest framework

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "2.1", "2.3", "2.5"] },
    { "id": 1, "tasks": ["1.5", "1.6", "2.2", "2.4", "4.1"] },
    { "id": 2, "tasks": ["1.7", "1.8", "2.6", "2.7", "2.8", "4.2"] },
    { "id": 3, "tasks": ["4.3", "4.4"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["5.5", "6.5", "6.6", "6.7"] },
    { "id": 7, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 8, "tasks": ["8.6", "8.7"] }
  ]
}
```

---

## Workflow Completion

This implementation plan is now ready for execution. You can begin implementing tasks by:

1. Opening this `tasks.md` file
2. Clicking "Start task" next to task items to execute them
3. Following the task sequence shown in the dependency graph
4. Completing checkpoint tasks to validate progress at phase boundaries

All requirements (1-17) have been mapped to specific implementation tasks. The 6-phase approach ensures a logical progression from API infrastructure through error handling, state management, route protection, token management, and finally UI integration. Testing sub-tasks (marked with `*`) are optional but recommended for comprehensive validation.
