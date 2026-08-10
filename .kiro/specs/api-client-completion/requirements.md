# Requirements Document: API Client Completion

## Introduction

The API Client Completion feature establishes the missing 15% infrastructure layer needed before full UI development can commence. The system currently has solid authentication hooks and form utilities, but lacks critical API communication capabilities for password recovery, OTP verification, error handling standardization, and route protection. This spec defines requirements for completing the API client layer to support all authentication flows and implement global error handling with proper route guards for role-based access control.

---

## Glossary

- **API_Client**: The centralized HTTP communication module that handles all requests to the backend API
- **AuthResponse**: The standard response shape returned by authentication endpoints containing user data, access tokens, and refresh tokens
- **Error_Handler**: The system component responsible for classifying, normalizing, and propagating HTTP errors for UI consumption
- **Error_Context**: The React context provider that makes error state and error dismissal functions available throughout the application
- **OTP**: One-Time Password used for multi-factor authentication or account verification
- **Route_Guard**: A protective wrapper component that prevents access to routes based on authentication and authorization status
- **Role**: A user classification (student, admin, super-admin) that determines which routes and features are accessible
- **DashboardRedirect**: A backend response field that indicates which dashboard path a user should be redirected to after authentication
- **Token_Refresh**: The process of using a refresh token to obtain a new access token without re-authenticating
- **Validation_Error**: An error response from the backend containing field-level errors for form submission (HTTP 400)
- **Auth_Error**: An error response indicating the user lacks proper authentication or authorization (HTTP 401, 403)
- **Toast_Notification**: A temporary, non-intrusive UI message displayed to the user without requiring interaction

---

## Requirements

### Requirement 1: OTP Verification Endpoint

**User Story:** As an authenticated user, I want to verify a one-time password, so that I can complete multi-factor authentication during login or sensitive operations.

#### Acceptance Criteria

1. WHEN a POST request is made to `/auth/verify-otp` with a valid OTP code, THE API_Client SHALL send the OTP to the backend and parse the response into an AuthResponse object
2. WHEN the OTP verification succeeds, THE API_Client SHALL extract the access token and refresh token from the response and store them in localStorage
3. THE API_Client SHALL return an AuthResponse containing the updated User object, access token, and refresh token
4. WHEN the OTP verification fails with an invalid code, THE Error_Handler SHALL classify the response as a validation error and return field-level error details
5. WHEN the OTP verification fails due to expiration or rate limiting, THE Error_Handler SHALL classify the response with the appropriate HTTP status code and return a descriptive error message

**Type:** EARS Core - Event-Driven
**Component Owner:** API_Client

---

### Requirement 2: OTP Resend Endpoint

**User Story:** As a user awaiting OTP verification, I want to request a new OTP code, so that I can complete verification if the original code expires or is lost.

#### Acceptance Criteria

1. WHEN a POST request is made to `/auth/resend-otp` with a valid email address, THE API_Client SHALL send the resend request to the backend
2. WHEN the resend succeeds, THE API_Client SHALL return a response indicating the OTP has been sent
3. WHEN the resend request is rate-limited or fails due to too many attempts, THE Error_Handler SHALL classify the response as HTTP 429 (Too Many Requests) and return a message indicating the user should wait before retrying
4. WHEN the resend fails with an invalid email, THE Error_Handler SHALL classify the response as HTTP 400 (Bad Request) with a validation error message

**Type:** EARS Core - Event-Driven
**Component Owner:** API_Client

---

### Requirement 3: Forgot Password Endpoint

**User Story:** As a user who has forgotten my password, I want to initiate a password recovery process, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a POST request is made to `/auth/forgot-password` with a valid email address, THE API_Client SHALL send the request to the backend
2. WHEN the request succeeds, THE API_Client SHALL return a response indicating a password reset link has been sent to the email
3. WHEN the request fails due to an email not being registered, THE Error_Handler SHALL classify the response as HTTP 404 (Not Found) and return a message indicating the email is not associated with an account
4. WHEN the request is rate-limited, THE Error_Handler SHALL classify the response as HTTP 429 and return a message indicating the user should wait before retrying

**Type:** EARS Core - Event-Driven
**Component Owner:** API_Client

---

### Requirement 4: Password Reset Endpoint

**User Story:** As a user with a valid password reset token, I want to set a new password, so that I can restore access to my account.

#### Acceptance Criteria

1. WHEN a POST request is made to `/auth/reset-password` with a valid reset token and new password, THE API_Client SHALL send the request to the backend
2. WHEN the password reset succeeds, THE API_Client SHALL return an AuthResponse containing updated user data and new tokens for automatic re-authentication
3. WHEN the reset token is invalid or expired, THE Error_Handler SHALL classify the response as HTTP 400 (Bad Request) and return a message indicating the reset link is invalid or has expired
4. WHEN the password does not meet requirements, THE Error_Handler SHALL classify the response as HTTP 400 with field-level validation errors for the password field

**Type:** EARS Core - Event-Driven
**Component Owner:** API_Client

---

### Requirement 5: Auth Token Persistence After API Responses

**User Story:** As a developer, I want all authentication endpoints to properly persist tokens for session continuity, so that authenticated requests automatically include valid credentials.

#### Acceptance Criteria

1. WHEN any authentication endpoint (login, verify-otp, reset-password) returns an AuthResponse, THE API_Client SHALL extract both the access token and refresh token and store them in localStorage with keys 'auth_token' and 'refresh_token'
2. WHEN subsequent API requests are made, THE API_Client SHALL automatically include the stored access token in the Authorization header as a Bearer token
3. WHEN the stored access token is expired and a refresh token is available, THE API_Client SHALL automatically attempt to refresh the token before failing the request
4. WHEN token storage fails due to localStorage being unavailable, THE API_Client SHALL log the error and continue without persisting tokens (for SSR scenarios)

**Type:** EARS Core - Ubiquitous
**Component Owner:** API_Client

---

### Requirement 6: Response Normalization

**User Story:** As an API consumer, I want all responses to follow a consistent format, so that I can uniformly handle success and error scenarios throughout the application.

#### Acceptance Criteria

1. WHEN a successful API response is received, THE API_Client SHALL normalize the response to the shape: `{ success: true, data: <payload>, meta?: <metadata> }`
2. WHEN an error API response is received, THE API_Client SHALL normalize the response to the shape: `{ success: false, message: <error_message>, code: <error_code>, errors?: <field_errors> }`
3. WHEN the backend returns field-level validation errors, THE API_Client SHALL extract them into an `errors` object with field names as keys and error messages as values
4. WHEN the backend response is missing expected fields, THE Error_Handler SHALL provide sensible defaults or throw a structured error for debugging

**Type:** EARS Core - Ubiquitous
**Component Owner:** API_Client

---

### Requirement 7: HTTP Status Code Classification

**User Story:** As an error handler, I want to differentiate between error types based on HTTP status codes, so that I can apply appropriate recovery or UI strategies.

#### Acceptance Criteria

1. WHEN an HTTP 400 (Bad Request) response is received, THE Error_Handler SHALL classify it as a validation error and extract field-level error details for form-level display
2. WHEN an HTTP 401 (Unauthorized) response is received, THE Error_Handler SHALL classify it as an authentication error and trigger a logout and redirect to login
3. WHEN an HTTP 403 (Forbidden) response is received, THE Error_Handler SHALL classify it as an authorization error and display a message indicating the user lacks permission
4. WHEN an HTTP 404 (Not Found) response is received, THE Error_Handler SHALL classify it as a resource-not-found error and return a descriptive message
5. WHEN an HTTP 409 (Conflict) response is received, THE Error_Handler SHALL classify it as a conflict error (e.g., duplicate email) and return a descriptive message
6. WHEN an HTTP 429 (Too Many Requests) response is received, THE Error_Handler SHALL classify it as a rate-limit error and return a message indicating the user should retry after a delay
7. WHEN an HTTP 5xx (Server Error) response is received, THE Error_Handler SHALL classify it as a server error and return a generic message while logging the full error for debugging

**Type:** EARS Core - Event-Driven
**Component Owner:** Error_Handler

---

### Requirement 8: Error Message Formatting for UI Consumption

**User Story:** As a UI component, I want error messages formatted consistently, so that I can display them without additional transformation.

#### Acceptance Criteria

1. WHEN a validation error occurs, THE Error_Handler SHALL extract field-specific error messages and format them as: `{ fieldName: "error message" }`
2. WHEN a general error occurs without field context, THE Error_Handler SHALL format the message as a single string suitable for toast notification display
3. WHEN multiple errors are present (both validation and general), THE Error_Handler SHALL separate them into `validationErrors` and `generalError` properties
4. WHEN an error message contains technical details unsuitable for users, THE Error_Handler SHALL transform it into a user-friendly message while logging the technical details

**Type:** EARS Core - Ubiquitous
**Component Owner:** Error_Handler

---

### Requirement 9: Global Error Context Provider

**User Story:** As a frontend developer, I want a centralized error context, so that I can dispatch error notifications from any component without prop drilling.

#### Acceptance Criteria

1. THE Error_Context SHALL provide an `errors` state containing current error notifications
2. THE Error_Context SHALL provide an `addError` function that accepts an error object with `message`, `code`, and optional `fieldErrors` properties
3. THE Error_Context SHALL provide a `removeError` function that accepts an error ID and removes it from the notification queue
4. WHEN an error is added to the Error_Context, THE provider SHALL automatically generate a unique error ID for tracking
5. WHEN using the Error_Context, components SHALL be able to subscribe to error state changes without re-rendering unrelated components

**Type:** EARS Core - Ubiquitous
**Component Owner:** Error_Context

---

### Requirement 10: Error-Specific Retry Logic

**User Story:** As an error handler, I want to implement retry strategies for transient errors, so that temporary issues don't result in failed operations.

#### Acceptance Criteria

1. WHEN an HTTP 429 (rate-limit) error occurs, THE Error_Handler SHALL support marking the error as retriable and provide a retry function
2. WHEN an HTTP 5xx error occurs, THE Error_Handler SHALL support marking the error as retriable with exponential backoff (2s, 4s, 8s, max 32s)
3. WHEN an HTTP 408 (Request Timeout) error occurs, THE Error_Handler SHALL support marking the error as retriable with exponential backoff
4. WHEN other error statuses occur (4xx except 408, 429), THE Error_Handler SHALL NOT mark the error as retriable
5. WHEN a retry is attempted, THE Error_Handler SHALL increment a retry count and ensure the count does not exceed 3 attempts

**Type:** EARS Core - Event-Driven
**Component Owner:** Error_Handler

---

### Requirement 11: ProtectedRoute Component for Access Control

**User Story:** As a route guard, I want to prevent unauthorized access to protected routes, so that unauthenticated or unauthorized users cannot access restricted content.

#### Acceptance Criteria

1. WHEN a ProtectedRoute component is rendered, THE Route_Guard SHALL check if the user is authenticated via the useAuth hook
2. IF the user is not authenticated, THE Route_Guard SHALL redirect to the `/login` route
3. WHEN a user is authenticated but lacks the required role, THE Route_Guard SHALL check the user's roles against an allowed roles list
4. IF the user lacks the required role, THE Route_Guard SHALL redirect to an appropriate fallback route based on the user's actual role
5. WHEN a user is authenticated and authorized, THE Route_Guard SHALL render the protected component normally
6. WHILE the authentication status is being verified (loading state), THE Route_Guard SHALL render a loading indicator

**Type:** EARS Core - Complex (WHERE allowed_roles, WHILE loading, WHEN unauthenticated/unauthorized)
**Component Owner:** Route_Guard

---

### Requirement 12: Dashboard Routing Based on Backend Redirect Response

**User Story:** As an authentication system, I want to redirect authenticated users to role-specific dashboards, so that each user reaches their appropriate interface on login.

#### Acceptance Criteria

1. WHEN a user successfully authenticates, THE API_Client SHALL extract the `dashboardRedirect` field from the AuthResponse
2. THE `dashboardRedirect` field SHALL contain a path string indicating the appropriate dashboard (e.g., `/student`, `/admin`, `/super-admin`)
3. WHEN the authentication succeeds, THE login handler SHALL use the dashboardRedirect value to navigate the user to their role-appropriate dashboard
4. IF the `dashboardRedirect` field is missing or invalid, THE login handler SHALL default to a safe fallback path based on the user's roles array
5. WHEN a user manually visits the root `/` path while authenticated, THE application SHALL redirect them to their dashboard based on the dashboardRedirect stored in session

**Type:** EARS Core - Event-Driven
**Component Owner:** API_Client, Route_Guard

---

### Requirement 13: Route Structure and Paths

**User Story:** As a navigation system, I want to define role-specific route paths, so that each user type has a dedicated interface and cannot access routes outside their scope.

#### Acceptance Criteria

1. THE application SHALL define a `/student` route accessible only to users with the "student" role
2. THE application SHALL define an `/admin` route accessible only to users with the "admin" role
3. THE application SHALL define a `/super-admin` route accessible only to users with the "super-admin" role
4. THE application SHALL define public routes: `/login`, `/register`, `/forgot-password` that are accessible to unauthenticated users
5. THE application SHALL define an `/unauthorized` route that displays an appropriate message when users attempt to access routes outside their role's scope
6. THE application SHALL define a fallback 404 route that displays a "page not found" message

**Type:** EARS Core - WHERE optional_configuration
**Component Owner:** Route_Guard

---

### Requirement 14: Unauthenticated User Route Prevention

**User Story:** As a security system, I want to prevent unauthenticated users from accessing protected routes, so that sensitive endpoints and data remain inaccessible to non-authenticated users.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a protected route, THE Route_Guard SHALL prevent navigation and redirect to `/login`
2. WHEN the redirect to `/login` occurs, THE application SHALL store the attempted route as a redirect target
3. AFTER the user successfully logs in, THE application SHALL redirect them to the stored target route (if applicable) or their dashboard (if no target was stored)
4. WHEN an unauthenticated user directly accesses a protected route via URL, THE server-side redirect (if using SSR) SHALL respond with a 302 redirect to `/login`

**Type:** EARS Core - IF unauthenticated_access_attempted
**Component Owner:** Route_Guard

---

### Requirement 15: Token Refresh on API Error

**User Story:** As an API client, I want to automatically refresh tokens on 401 responses, so that brief token expiration doesn't interrupt user workflows.

#### Acceptance Criteria

1. WHEN an API request receives an HTTP 401 (Unauthorized) response, THE API_Client SHALL check if a refresh token exists
2. IF a refresh token exists, THE API_Client SHALL attempt to refresh the access token using the refresh endpoint
3. WHEN token refresh succeeds, THE API_Client SHALL store the new tokens and retry the original request with the new access token
4. WHEN token refresh fails (401, 403, or network error), THE API_Client SHALL not retry the original request and shall trigger a logout and redirect to login
5. WHEN the original request is retried after token refresh, THE API_Client SHALL include the new access token in the Authorization header

**Type:** EARS Core - IF http_401_received
**Component Owner:** API_Client

---

### Requirement 16: Error Context Integration with Toast Notifications

**User Story:** As a UI layer, I want errors from the Error_Context to automatically display as toast notifications, so that users receive immediate feedback without component-level error handling.

#### Acceptance Criteria

1. WHEN an error is added to the Error_Context, A Toast_Notification component SHALL automatically render displaying the error message
2. THE Toast_Notification SHALL display validation errors in a format showing field names and their corresponding error messages
3. THE Toast_Notification SHALL display general errors as a single message
4. WHEN a Toast_Notification is displayed, IT SHALL automatically dismiss after 5 seconds OR when the user manually closes it
5. WHEN multiple errors are present, EACH error SHALL have its own Toast_Notification displayed simultaneously

**Type:** EARS Core - Event-Driven
**Component Owner:** Error_Context, UI_Layer

---

### Requirement 17: Pretty Printer for Error Responses

**User Story:** As a developer, I want to format error responses consistently for logging and debugging, so that I can easily diagnose API integration issues.

#### Acceptance Criteria

1. THE Error_Handler SHALL provide a `formatError` function that accepts an error object and returns a formatted string
2. THE formatted error string SHALL include: HTTP status code, error message, error code, and any field-level validation errors
3. WHEN field-level errors exist, THE formatted string SHALL display them in a readable list format
4. THE Error_Handler SHALL ensure formatted errors are suitable for logging to console or error tracking services
5. THE Error_Handler SHALL NOT include sensitive user data (tokens, passwords) in formatted error messages

**Type:** EARS Core - Ubiquitous
**Component Owner:** Error_Handler

---

## Property-Based Testing Considerations

The following requirements are suited for property-based testing:

- **Requirement 6 (Response Normalization)**: Round-trip property - all API responses should normalize and denormalize consistently
- **Requirement 7 (HTTP Status Classification)**: Metamorphic property - classification function should consistently map status codes to error types
- **Requirement 8 (Error Message Formatting)**: Invariant property - formatted messages should always contain original message content and follow structure rules
- **Requirement 10 (Retry Logic)**: Idempotence property - retry counts should increment predictably without exceeding max attempts
- **Requirement 17 (Pretty Printer)**: Round-trip property - formatted errors should preserve all original error information

The following requirements are better suited for integration/example tests:

- **Requirement 1-5 (Endpoint Methods)**: Integration tests with representative examples of OTP, forgot-password, reset-password flows
- **Requirement 11-14 (Route Protection)**: Integration/E2E tests with example authenticated/unauthenticated user scenarios
- **Requirement 15 (Token Refresh)**: Integration tests simulating 401 responses and token refresh behavior
- **Requirement 16 (Error Context Integration)**: Component tests with example error scenarios

