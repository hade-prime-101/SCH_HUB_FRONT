const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

const envDefaults = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://sch_hub:sch_hub_password@localhost:5432/sch_hub?schema=public',
  JWT_ACCESS_SECRET: 'test-access-secret-at-least-16-chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-16-chars',
  CORS_ORIGIN: '*',
};

for (const [key, value] of Object.entries(envDefaults)) {
  process.env[key] ??= value;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function normalizeApiPath(...parts) {
  const joined = parts
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');

  return joined.startsWith('/') ? joined || '/' : `/${joined}`;
}

function concretePath(routePath) {
  return routePath
    .replace(/:([A-Za-z0-9_]+)/g, (_match, name) => {
      if (name.toLowerCase().includes('token')) return 'test-token';
      return `${name}-test-id`;
    });
}

function parseMountedRouters() {
  const routesSource = read('backend/src/routes.ts');
  const importToFile = new Map();
  const mounts = new Map();

  for (const match of routesSource.matchAll(/import\s+\{\s*(\w+)\s*\}\s+from\s+'@\/(.+?)\.js';/g)) {
    importToFile.set(match[1], `backend/src/${match[2]}.ts`);
  }

  for (const match of routesSource.matchAll(/routes\.use\('([^']+)',\s*(\w+)\)/g)) {
    const [, mountPath, routerName] = match;
    const file = importToFile.get(routerName);
    if (file) mounts.set(file, mountPath);
  }

  return mounts;
}

function parseRouteFile(relativePath, mountPath) {
  const source = read(relativePath);
  const exportMatch = source.match(/export\s+const\s+(\w+)\s*=\s*Router\(\)/);
  if (!exportMatch) return [];

  const routerName = exportMatch[1];
  const endpointPattern = new RegExp(`${routerName}\\.(get|post|put|patch|delete)\\('([^']+)'`, 'g');
  const endpoints = [];

  for (const match of source.matchAll(endpointPattern)) {
    const [, method, routePath] = match;
    endpoints.push({
      method: method.toUpperCase(),
      path: normalizeApiPath('/api/v1', mountPath, routePath),
      source: relativePath,
    });
  }

  return endpoints;
}

function discoverEndpoints() {
  const mounts = parseMountedRouters();
  return [...mounts.entries()]
    .flatMap(([file, mountPath]) => parseRouteFile(file, mountPath))
    .sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
}

function expectEndpointInventory(endpoints) {
  expect(endpoints).toMatchInlineSnapshot(`
[
  "DELETE /api/v1/community/answers/:answerId",
  "DELETE /api/v1/community/faqs/:id",
  "DELETE /api/v1/community/groups/:id",
  "DELETE /api/v1/community/groups/:id/invites/:inviteId",
  "DELETE /api/v1/community/groups/:id/leave",
  "DELETE /api/v1/community/groups/:id/members/:userId",
  "DELETE /api/v1/community/posts/:id",
  "DELETE /api/v1/community/questions/:id",
  "DELETE /api/v1/marketplace/accommodation/:id",
  "DELETE /api/v1/marketplace/jobs/:id",
  "DELETE /api/v1/marketplace/listings/:id",
  "DELETE /api/v1/marketplace/roommates/:id",
  "DELETE /api/v1/marketplace/services/:id",
  "DELETE /api/v1/marketplace/shops/:id",
  "DELETE /api/v1/notifications/:id",
  "DELETE /api/v1/reminders/:id",
  "DELETE /api/v1/school/emergency-contacts/:id",
  "DELETE /api/v1/school/events/:id",
  "DELETE /api/v1/school/map-locations/:id",
  "DELETE /api/v1/school/timetable/:id",
  "DELETE /api/v1/study/materials/:id",
  "DELETE /api/v1/study/materials/:id/admin",
  "DELETE /api/v1/study/quizzes/:id",
  "DELETE /api/v1/super-admin/admins/:adminId",
  "DELETE /api/v1/super-admin/departments/:departmentId",
  "DELETE /api/v1/super-admin/faculties/:facultyId",
  "DELETE /api/v1/super-admin/map/schools/:schoolId/entrances/:entranceId",
  "DELETE /api/v1/super-admin/map/schools/:schoolId/features/:featureId",
  "DELETE /api/v1/super-admin/map/schools/:schoolId/features/:featureId/images",
  "DELETE /api/v1/users/me/sessions",
  "DELETE /api/v1/users/me/sessions/:sessionId",
  "GET /api/v1/ai/summaries",
  "GET /api/v1/ai/summaries/:materialId",
  "GET /api/v1/campus-map/categories",
  "GET /api/v1/campus-map/features",
  "GET /api/v1/campus-map/features/:id",
  "GET /api/v1/campus-map/features/:id/entrances",
  "GET /api/v1/campus-map/nearest",
  "GET /api/v1/campus-map/search",
  "GET /api/v1/campus-map/tiles/metadata",
  "GET /api/v1/cgpa/courses",
  "GET /api/v1/cgpa/records",
  "GET /api/v1/cgpa/records/current",
  "GET /api/v1/community/faqs",
  "GET /api/v1/community/feed",
  "GET /api/v1/community/groups/",
  "GET /api/v1/community/groups/:id",
  "GET /api/v1/community/groups/:id/challenges",
  "GET /api/v1/community/groups/:id/challenges/:challengeId/result",
  "GET /api/v1/community/groups/:id/invites",
  "GET /api/v1/community/groups/:id/messages",
  "GET /api/v1/community/groups/:id/quizzes/:quizId/leaderboard",
  "GET /api/v1/community/groups/all",
  "GET /api/v1/community/mentors",
  "GET /api/v1/community/mentors/me",
  "GET /api/v1/community/notices",
  "GET /api/v1/community/posts",
  "GET /api/v1/community/posts/:id",
  "GET /api/v1/community/questions",
  "GET /api/v1/community/questions/:id",
  "GET /api/v1/community/reports",
  "GET /api/v1/health/",
  "GET /api/v1/marketplace/accommodation",
  "GET /api/v1/marketplace/accommodation/:id",
  "GET /api/v1/marketplace/agents/me",
  "GET /api/v1/marketplace/agents/pending",
  "GET /api/v1/marketplace/jobs",
  "GET /api/v1/marketplace/jobs/:id",
  "GET /api/v1/marketplace/jobs/pending",
  "GET /api/v1/marketplace/listings",
  "GET /api/v1/marketplace/listings/:id",
  "GET /api/v1/marketplace/listings/pending",
  "GET /api/v1/marketplace/listings/saved",
  "GET /api/v1/marketplace/lost-found",
  "GET /api/v1/marketplace/reports",
  "GET /api/v1/marketplace/roommates",
  "GET /api/v1/marketplace/services",
  "GET /api/v1/marketplace/services/:id",
  "GET /api/v1/marketplace/services/pending",
  "GET /api/v1/marketplace/shops/:id",
  "GET /api/v1/notifications/",
  "GET /api/v1/notifications/settings",
  "GET /api/v1/planner/today",
  "GET /api/v1/planner/weekly",
  "GET /api/v1/school/emergency-contacts",
  "GET /api/v1/school/events",
  "GET /api/v1/school/events/:id",
  "GET /api/v1/school/events/:id/tickets",
  "GET /api/v1/school/events/:id/tickets/mine",
  "GET /api/v1/school/faculties/:id/departments",
  "GET /api/v1/school/map-config",
  "GET /api/v1/school/map-locations",
  "GET /api/v1/school/map-locations/:id",
  "GET /api/v1/school/map-locations/route",
  "GET /api/v1/school/schools",
  "GET /api/v1/school/schools/:id/faculties",
  "GET /api/v1/school/timetable",
  "GET /api/v1/study/analytics/admin",
  "GET /api/v1/study/analytics/me",
  "GET /api/v1/study/materials",
  "GET /api/v1/study/materials/:id",
  "GET /api/v1/study/materials/:id/download-url",
  "GET /api/v1/study/quizzes",
  "GET /api/v1/study/quizzes/:id",
  "GET /api/v1/study/quizzes/:id/attempts",
  "GET /api/v1/super-admin/admins",
  "GET /api/v1/super-admin/audit-logs",
  "GET /api/v1/super-admin/faculties/:facultyId/departments",
  "GET /api/v1/super-admin/schools",
  "GET /api/v1/super-admin/schools/:schoolId/faculties",
  "GET /api/v1/super-admin/stats",
  "GET /api/v1/users/",
  "GET /api/v1/users/:id",
  "GET /api/v1/users/:id/materials",
  "GET /api/v1/users/me",
  "GET /api/v1/users/me/bookmarks",
  "GET /api/v1/users/me/materials",
  "GET /api/v1/users/me/sessions",
  "GET /api/v1/users/search",
  "PATCH /api/v1/community/groups/:id",
  "PATCH /api/v1/community/groups/:id/challenges/:challengeId/accept",
  "PATCH /api/v1/community/groups/:id/challenges/:challengeId/decline",
  "PATCH /api/v1/community/groups/:id/members/:userId/role",
  "PATCH /api/v1/community/notices/:id/pin",
  "PATCH /api/v1/community/posts/:id/pin",
  "PATCH /api/v1/community/questions/:id/answers/:answerId/accept",
  "PATCH /api/v1/community/questions/:id/answers/:answerId/pin",
  "PATCH /api/v1/community/reports/:reportId/resolve",
  "PATCH /api/v1/marketplace/accommodation/:id",
  "PATCH /api/v1/marketplace/accommodation/:id/moderate",
  "PATCH /api/v1/marketplace/agents/:userId/review",
  "PATCH /api/v1/marketplace/jobs/:id",
  "PATCH /api/v1/marketplace/jobs/:id/approve",
  "PATCH /api/v1/marketplace/jobs/:id/reject",
  "PATCH /api/v1/marketplace/listings/:id",
  "PATCH /api/v1/marketplace/listings/:id/moderate",
  "PATCH /api/v1/marketplace/lost-found/:id/resolve",
  "PATCH /api/v1/marketplace/reports/:id/resolve",
  "PATCH /api/v1/marketplace/roommates/:id",
  "PATCH /api/v1/marketplace/services/:id",
  "PATCH /api/v1/marketplace/services/:id/moderate",
  "PATCH /api/v1/marketplace/shops/me",
  "PATCH /api/v1/notifications/:id/read",
  "PATCH /api/v1/notifications/read-all",
  "PATCH /api/v1/notifications/settings",
  "PATCH /api/v1/reminders/:id",
  "PATCH /api/v1/reminders/:id/complete",
  "PATCH /api/v1/school/emergency-contacts/:id",
  "PATCH /api/v1/school/events/:id",
  "PATCH /api/v1/school/events/:id/tickets/:ticketId/approve",
  "PATCH /api/v1/school/events/:id/tickets/:ticketId/reject",
  "PATCH /api/v1/school/map-locations/:id",
  "PATCH /api/v1/school/map-locations/bulk",
  "PATCH /api/v1/study/materials/:id/verify",
  "PATCH /api/v1/study/materials/:id/visibility",
  "PATCH /api/v1/study/quizzes/:id",
  "PATCH /api/v1/study/quizzes/:id/approve",
  "PATCH /api/v1/study/quizzes/:id/publish",
  "PATCH /api/v1/super-admin/admins/:adminId/deactivate",
  "PATCH /api/v1/super-admin/admins/:adminId/reactivate",
  "PATCH /api/v1/super-admin/admins/:adminId/reset-password",
  "PATCH /api/v1/super-admin/schools/:schoolId",
  "PATCH /api/v1/super-admin/users/:userId/block",
  "PATCH /api/v1/super-admin/users/:userId/unblock",
  "PATCH /api/v1/users/assign-role",
  "PATCH /api/v1/users/me/profile",
  "PATCH /api/v1/users/me/settings",
  "PATCH /api/v1/users/nominate-course-rep",
  "POST /api/v1/ai/summarize",
  "POST /api/v1/auth/forgot-password",
  "POST /api/v1/auth/login",
  "POST /api/v1/auth/logout",
  "POST /api/v1/auth/refresh",
  "POST /api/v1/auth/register",
  "POST /api/v1/auth/resend-otp",
  "POST /api/v1/auth/reset-password",
  "POST /api/v1/auth/verify-otp",
  "POST /api/v1/campus-map/route",
  "POST /api/v1/campus-map/route/progress",
  "POST /api/v1/cgpa/calculate",
  "POST /api/v1/cgpa/courses",
  "POST /api/v1/community/answers/:answerId/react",
  "POST /api/v1/community/answers/:answerId/upvote",
  "POST /api/v1/community/groups/",
  "POST /api/v1/community/groups/:id/ai/ask",
  "POST /api/v1/community/groups/:id/ai/summary",
  "POST /api/v1/community/groups/:id/challenges",
  "POST /api/v1/community/groups/:id/invites",
  "POST /api/v1/community/groups/:id/join",
  "POST /api/v1/community/groups/:id/messages",
  "POST /api/v1/community/groups/join/:token",
  "POST /api/v1/community/mentors/register",
  "POST /api/v1/community/notices",
  "POST /api/v1/community/posts",
  "POST /api/v1/community/posts/:id/comments",
  "POST /api/v1/community/posts/:id/react",
  "POST /api/v1/community/posts/:id/report",
  "POST /api/v1/community/posts/:id/upvote",
  "POST /api/v1/community/questions",
  "POST /api/v1/community/questions/:id/answers",
  "POST /api/v1/community/questions/:id/upvote",
  "POST /api/v1/marketplace/accommodation",
  "POST /api/v1/marketplace/agents/apply",
  "POST /api/v1/marketplace/jobs",
  "POST /api/v1/marketplace/listings",
  "POST /api/v1/marketplace/listings/:id/save",
  "POST /api/v1/marketplace/lost-found",
  "POST /api/v1/marketplace/report",
  "POST /api/v1/marketplace/roommates",
  "POST /api/v1/marketplace/sellers/:id/rate",
  "POST /api/v1/marketplace/services",
  "POST /api/v1/marketplace/shops",
  "POST /api/v1/marketplace/shops/:id/follow",
  "POST /api/v1/reminders/",
  "POST /api/v1/school/emergency-contacts",
  "POST /api/v1/school/events",
  "POST /api/v1/school/events/:id/image",
  "POST /api/v1/school/events/:id/remind",
  "POST /api/v1/school/events/:id/tickets",
  "POST /api/v1/school/map-locations",
  "POST /api/v1/school/timetable",
  "POST /api/v1/study/materials",
  "POST /api/v1/study/materials/:id/bookmark",
  "POST /api/v1/study/materials/:id/download",
  "POST /api/v1/study/materials/:id/rate",
  "POST /api/v1/study/materials/bulk",
  "POST /api/v1/study/materials/extract-preview",
  "POST /api/v1/study/quizzes",
  "POST /api/v1/study/quizzes/:id/attempt",
  "POST /api/v1/study/quizzes/generate",
  "POST /api/v1/super-admin/admins",
  "POST /api/v1/super-admin/faculties/:facultyId/departments",
  "POST /api/v1/super-admin/map/schools/:schoolId/features/:featureId/images",
  "POST /api/v1/super-admin/map/schools/:schoolId/import",
  "POST /api/v1/super-admin/schools",
  "POST /api/v1/super-admin/schools/:schoolId/faculties",
  "POST /api/v1/users/me/avatar",
  "POST /api/v1/users/me/fcm-token",
  "PUT /api/v1/school/timetable/:id",
  "PUT /api/v1/super-admin/map/schools/:schoolId/entrances",
  "PUT /api/v1/super-admin/map/schools/:schoolId/features",
]
`);
}

async function loadCompiledApp() {
  const appPath = path.join(backendRoot, 'dist/src/app.js');
  expect(fs.existsSync(appPath)).toBe(true);

  const { app } = await import(appPath);
  return app;
}

async function closeBackendResources() {
  const prismaPath = path.join(backendRoot, 'dist/src/config/prisma.js');
  if (!fs.existsSync(prismaPath)) return;

  const { prisma } = await import(prismaPath);
  await prisma.$disconnect();
}

function buildProbeBody(pathname) {
  if (pathname.includes('/route')) {
    return {
      from: { lat: 7.1, lng: 4.8 },
      to: { lat: 7.11, lng: 4.81 },
    };
  }

  if (pathname.includes('/calculate')) {
    return { courses: [{ unit: 3, grade: 'A' }] };
  }

  return {};
}

describe('API route coverage', () => {
  const endpoints = discoverEndpoints();
  let app;

  beforeAll(async () => {
    app = await loadCompiledApp();
  });

  afterAll(async () => {
    await closeBackendResources();
  });

  test('discovers every mounted Express endpoint from source route files', () => {
    expect(endpoints).toHaveLength(244);
    expect(new Set(endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)).size).toBe(endpoints.length);
    expect(endpoints.map((endpoint) => endpoint.source)).toEqual(
      expect.arrayContaining([
        'backend/src/modules/ai/ai.routes.ts',
        'backend/src/modules/auth/auth.routes.ts',
        'backend/src/modules/campus-map/campus-map.routes.ts',
        'backend/src/modules/cgpa/cgpa.routes.ts',
        'backend/src/modules/community/community.routes.ts',
        'backend/src/modules/health/health.routes.ts',
        'backend/src/modules/marketplace/marketplace.routes.ts',
        'backend/src/modules/notifications/notifications.routes.ts',
        'backend/src/modules/planner/planner.routes.ts',
        'backend/src/modules/reminders/reminders.routes.ts',
        'backend/src/modules/school/school.routes.ts',
        'backend/src/modules/study/study.routes.ts',
        'backend/src/modules/study-groups/study-groups.routes.ts',
        'backend/src/modules/super-admin/super-admin.routes.ts',
        'backend/src/modules/users/users.routes.ts',
      ]),
    );
  });

  test.each(endpoints)('$method $path is mounted on the compiled app', async ({ method, path: routePath }) => {
    const url = concretePath(routePath);
    const agent = request(app);
    let probe = agent[method.toLowerCase()](url).set('Accept', 'application/json');

    if (!['GET', 'DELETE'].includes(method)) {
      probe = probe.send(buildProbeBody(routePath));
    }

    const response = await probe;

    expect(response.status).not.toBe(404);
  });
});
