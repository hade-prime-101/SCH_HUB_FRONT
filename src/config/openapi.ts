import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Must be called once before any .openapi() usage
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ── Reusable response schemas ─────────────────────────────────────────────

const ErrorResponse = registry.register('ErrorResponse', z.object({
  success: z.literal(false),
  message: z.string(),
  requestId: z.string().optional(),
}));

const SuccessResponse = (data: z.ZodTypeAny, name: string) =>
  registry.register(name, z.object({
    success: z.literal(true),
    message: z.string(),
    data,
  }));

// ── Security scheme ───────────────────────────────────────────────────────

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const bearerAuth = [{ bearerAuth: [] }];

// ── Auth schemas ──────────────────────────────────────────────────────────

const RegisterBody = registry.register('RegisterBody', z.object({
  fullName: z.string().min(2).openapi({ example: 'John Doe' }),
  email: z.string().email().openapi({ example: 'john@university.edu' }),
  password: z.string().min(8).openapi({ example: 'SecurePass1!' }),
  confirmPassword: z.string().openapi({ example: 'SecurePass1!' }),
  matricNumber: z.string().min(3).openapi({ example: 'CSC/2021/001' }),
  level: z.enum(['100', '200', '300', '400', '500', '600']).openapi({ example: '200' }),
  schoolId: z.string().openapi({ example: 'clx...' }),
  facultyId: z.string().openapi({ example: 'clx...' }),
  departmentId: z.string().openapi({ example: 'clx...' }),
  phone: z.string().optional().openapi({ example: '+2348012345678' }),
}));

const LoginBody = registry.register('LoginBody', z.object({
  email: z.string().email().openapi({ example: 'john@university.edu' }),
  password: z.string().min(1).openapi({ example: 'SecurePass1!' }),
}));

const TokenPair = registry.register('TokenPair', z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    fullName: z.string(),
    role: z.string(),
  }),
}));

// ── Auth paths ────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post', path: '/auth/register', tags: ['Auth'],
  summary: 'Register a new student account',
  request: { body: { content: { 'application/json': { schema: RegisterBody } } } },
  responses: {
    201: { description: 'Account created', content: { 'application/json': { schema: SuccessResponse(TokenPair, 'RegisterResponse') } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponse } } },
    409: { description: 'Email already registered', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/auth/login', tags: ['Auth'],
  summary: 'Login with email and password',
  request: { body: { content: { 'application/json': { schema: LoginBody } } } },
  responses: {
    200: { description: 'Login successful', content: { 'application/json': { schema: SuccessResponse(TokenPair, 'LoginResponse') } } },
    401: { description: 'Invalid credentials', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/auth/refresh', tags: ['Auth'],
  summary: 'Refresh access token',
  request: { body: { content: { 'application/json': { schema: z.object({ refreshToken: z.string() }) } } } },
  responses: {
    200: { description: 'New token pair', content: { 'application/json': { schema: SuccessResponse(TokenPair, 'RefreshResponse') } } },
    401: { description: 'Invalid or expired refresh token', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/auth/logout', tags: ['Auth'],
  summary: 'Logout and invalidate refresh token',
  security: bearerAuth,
  request: { body: { content: { 'application/json': { schema: z.object({ refreshToken: z.string() }) } } } },
  responses: {
    200: { description: 'Logged out' },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'get', path: '/auth/me', tags: ['Auth'],
  summary: 'Get current authenticated user',
  security: bearerAuth,
  responses: {
    200: { description: 'Current user profile' },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/auth/forgot-password', tags: ['Auth'],
  summary: 'Request a password reset OTP',
  request: { body: { content: { 'application/json': { schema: z.object({ email: z.string().email() }) } } } },
  responses: {
    200: { description: 'OTP sent if account exists (anti-enumeration)' },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/auth/verify-otp', tags: ['Auth'],
  summary: 'Verify email or password-reset OTP',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            otp: z.string().length(6),
            type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'OTP verified' },
    400: { description: 'Invalid or expired OTP', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/auth/reset-password', tags: ['Auth'],
  summary: 'Reset password using OTP',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            otp: z.string().length(6),
            password: z.string().min(8),
            confirmPassword: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Password reset successful' },
    400: { description: 'Invalid OTP or passwords do not match', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/auth/resend-otp', tags: ['Auth'],
  summary: 'Resend email verification OTP',
  request: { body: { content: { 'application/json': { schema: z.object({ email: z.string().email() }) } } } },
  responses: {
    200: { description: 'OTP resent if account exists' },
    400: { description: 'Already verified or invalid email', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

// ── Users paths ───────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/users/me', tags: ['Users'],
  summary: 'Get own profile',
  security: bearerAuth,
  responses: {
    200: { description: 'User profile' },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'patch', path: '/users/me/profile', tags: ['Users'],
  summary: 'Update own profile',
  security: bearerAuth,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            fullName: z.string().min(2).max(100).optional(),
            phone: z.string().nullable().optional(),
            bio: z.string().max(500).nullable().optional(),
            level: z.enum(['100', '200', '300', '400', '500', '600']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Profile updated' },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'patch', path: '/users/me/settings', tags: ['Users'],
  summary: 'Update user app settings',
  security: bearerAuth,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            darkMode: z.boolean().optional(),
            lowDataMode: z.boolean().optional(),
            notificationsEnabled: z.boolean().optional(),
            emailNotifications: z.boolean().optional(),
            pushNotifications: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Settings updated' },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/users/me/fcm-token', tags: ['Users'],
  summary: 'Register FCM push notification token',
  security: bearerAuth,
  request: { body: { content: { 'application/json': { schema: z.object({ fcmToken: z.string().min(10) }) } } } },
  responses: {
    200: { description: 'Token registered' },
    400: { description: 'Missing token', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

// ── Notifications paths ───────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/notifications', tags: ['Notifications'],
  summary: 'List notifications (paginated)',
  security: bearerAuth,
  request: { query: z.object({ page: z.coerce.number().default(1), limit: z.coerce.number().default(30) }) },
  responses: {
    200: { description: 'Notification list' },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'patch', path: '/notifications/read-all', tags: ['Notifications'],
  summary: 'Mark all notifications as read',
  security: bearerAuth,
  responses: { 200: { description: 'All marked read' }, 401: { description: 'Unauthorized' } },
});

registry.registerPath({
  method: 'patch', path: '/notifications/{id}/read', tags: ['Notifications'],
  summary: 'Mark a single notification as read',
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Marked read' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/notifications/{id}', tags: ['Notifications'],
  summary: 'Delete a notification',
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'get', path: '/notifications/settings', tags: ['Notifications'],
  summary: 'Get notification preferences',
  security: bearerAuth,
  responses: { 200: { description: 'Settings object' }, 401: { description: 'Unauthorized' } },
});

registry.registerPath({
  method: 'patch', path: '/notifications/settings', tags: ['Notifications'],
  summary: 'Update notification preferences',
  security: bearerAuth,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            pushNotifications: z.boolean().optional(),
            reminderPush: z.boolean().optional(),
            eventPush: z.boolean().optional(),
            quietHoursEnabled: z.boolean().optional(),
            quietHoursStart: z.string().optional(),
            quietHoursEnd: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: { 200: { description: 'Settings updated' }, 401: { description: 'Unauthorized' } },
});

// ── CGPA paths ────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/cgpa/courses', tags: ['CGPA'],
  summary: 'List all courses for the authenticated student',
  security: bearerAuth,
  request: { query: z.object({ semester: z.enum(['FIRST', 'SECOND']).optional(), session: z.string().optional() }) },
  responses: { 200: { description: 'Course list' }, 401: { description: 'Unauthorized' } },
});

registry.registerPath({
  method: 'post', path: '/cgpa/courses', tags: ['CGPA'],
  summary: 'Add a course',
  security: bearerAuth,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            courseCode: z.string().openapi({ example: 'CSC301' }),
            courseTitle: z.string().openapi({ example: 'Data Structures' }),
            creditUnit: z.number().int().min(1).max(6).openapi({ example: 3 }),
            score: z.number().min(0).max(100).optional().openapi({ example: 75 }),
            semester: z.enum(['FIRST', 'SECOND']).openapi({ example: 'FIRST' }),
            session: z.string().openapi({ example: '2023/2024' }),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Course created' },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'patch', path: '/cgpa/courses/{id}', tags: ['CGPA'],
  summary: 'Update a course',
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Updated' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/cgpa/courses/{id}', tags: ['CGPA'],
  summary: 'Delete a course',
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/cgpa/calculate', tags: ['CGPA'],
  summary: 'Calculate and save GPA for a semester',
  security: bearerAuth,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            semester: z.enum(['FIRST', 'SECOND']),
            session: z.string().openapi({ example: '2023/2024' }),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'GPA result with classification' },
    400: { description: 'No graded courses found', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'get', path: '/cgpa/records', tags: ['CGPA'],
  summary: 'Get all saved CGPA records',
  security: bearerAuth,
  responses: { 200: { description: 'CGPA records list' } },
});

registry.registerPath({
  method: 'get', path: '/cgpa/records/current', tags: ['CGPA'],
  summary: 'Get current cumulative CGPA across all semesters',
  security: bearerAuth,
  responses: { 200: { description: 'Current CGPA and classification' } },
});

// ── Health path ───────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/health', tags: ['Health'],
  summary: 'Health check — DB, queues, uptime',
  responses: {
    200: { description: 'All systems operational' },
    503: { description: 'Service degraded', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

// ── Study paths ───────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/study/materials', tags: ['Study'],
  summary: 'List study materials (paginated, filtered)',
  security: bearerAuth,
  request: {
    query: z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      search: z.string().optional(),
      type: z.string().optional(),
      courseCode: z.string().optional(),
      level: z.string().optional(),
    }),
  },
  responses: { 200: { description: 'Materials list' }, 401: { description: 'Unauthorized' } },
});

registry.registerPath({
  method: 'get', path: '/study/materials/{id}', tags: ['Study'],
  summary: 'Get a single material',
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Material detail' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/study/materials/{id}/bookmark', tags: ['Study'],
  summary: 'Toggle bookmark on a material',
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: '{ bookmarked: boolean }' } },
});

registry.registerPath({
  method: 'get', path: '/study/quizzes', tags: ['Study'],
  summary: 'List quizzes',
  security: bearerAuth,
  responses: { 200: { description: 'Quiz list' } },
});

registry.registerPath({
  method: 'post', path: '/study/quizzes/{id}/attempt', tags: ['Study'],
  summary: 'Submit a quiz attempt',
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Graded attempt result' },
    403: { description: 'Quiz not approved', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

// ── AI paths ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post', path: '/ai/summary/{materialId}', tags: ['AI'],
  summary: 'Request AI summary for a PDF material',
  security: bearerAuth,
  request: { params: z.object({ materialId: z.string() }) },
  responses: {
    200: { description: 'Summary queued or cached' },
    400: { description: 'Not a PDF', content: { 'application/json': { schema: ErrorResponse } } },
    429: { description: 'Daily limit reached', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'get', path: '/ai/summary/{materialId}', tags: ['AI'],
  summary: 'Get AI summary status and content',
  security: bearerAuth,
  request: { params: z.object({ materialId: z.string() }) },
  responses: {
    200: { description: 'Summary object with tabs (summary, keyPoints, examFocus, beginner, quiz)' },
    404: { description: 'No summary found', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

// ── Spec generator ────────────────────────────────────────────────────────

export function buildOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'SCH_HUB API',
      version: '1.0.0',
      description: 'Backend API for SCH_HUB — the all-in-one student platform.',
      contact: { name: 'SCH_HUB Team' },
    },
    servers: [
      { url: '/api/v1', description: 'Current server' },
    ],
  });
}
