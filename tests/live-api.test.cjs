'use strict';

// Must be set before the server reads NODE_ENV (affects rate limiter)
process.env.NODE_ENV = 'test';

const fs   = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot    = path.resolve(backendRoot, '..');

// ── Load .env so DATABASE_URL / JWT secrets are available ──────────────────
try {
  require('dotenv').config({ path: path.join(backendRoot, '.env') });
} catch { /* dotenv optional */ }

const BASE_URL = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

// ── Test-user credentials (created fresh in beforeAll) ─────────────────────
const TEST_EMAIL    = `e2e-super-${Date.now()}@schub.test`;
const TEST_PASSWORD = 'E2ePassword123!';
const TEST_MATRIC   = `E2E${Date.now()}`;

// ── Route discovery (same parser as routes.test.cjs) ──────────────────────

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function normalizeApiPath(...parts) {
  const joined = parts.filter(Boolean).join('/').replace(/\/+/g, '/').replace(/\/$/, '');
  return joined.startsWith('/') ? joined || '/' : `/${joined}`;
}

function concretePath(routePath) {
  return routePath.replace(/:([A-Za-z0-9_]+)/g, (_m, name) =>
    name.toLowerCase().includes('token') ? 'live-test-token' : `${name}-live-test-id`
  );
}

function parseMountedRouters() {
  const src = read('backend/src/routes.ts');
  const importToFile = new Map();
  const mounts = new Map();
  for (const m of src.matchAll(/import\s+\{\s*(\w+)\s*\}\s+from\s+'@\/(.+?)\.js';/g))
    importToFile.set(m[1], `backend/src/${m[2]}.ts`);
  for (const m of src.matchAll(/routes\.use\('([^']+)',\s*(\w+)\)/g)) {
    const file = importToFile.get(m[2]);
    if (file) mounts.set(file, m[1]);
  }
  return mounts;
}

function parseRouteFile(rel, mountPath) {
  const src = read(rel);
  const ex  = src.match(/export\s+const\s+(\w+)\s*=\s*Router\(\)/);
  if (!ex) return [];
  const re = new RegExp(`${ex[1]}\\.(get|post|put|patch|delete)\\('([^']+)'`, 'g');
  const out = [];
  for (const m of src.matchAll(re))
    out.push({ method: m[1].toUpperCase(), path: normalizeApiPath('/api/v1', mountPath, m[2]), source: rel });
  return out;
}

function discoverEndpoints() {
  const mounts = parseMountedRouters();
  return [...mounts.entries()]
    .flatMap(([f, mp]) => parseRouteFile(f, mp))
    .sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
}

// ── Helpers ────────────────────────────────────────────────────────────────

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function queryFor(routePath) {
  if (routePath.includes('/school/map-locations/route')) return { fromLat: '7.616', fromLng: '4.735', toLat: '7.617', toLng: '4.736' };
  if (routePath.includes('/campus-map/nearest'))         return { lat: '7.616', lng: '4.735' };
  if (routePath.includes('/campus-map/search'))          return { q: 'library' };
  return {};
}

function bodyFor(method, routePath) {
  if (method === 'GET' || method === 'DELETE') return undefined;

  // ── Auth ────────────────────────────────────────────────────────────────
  if (routePath.includes('/auth/register')) {
    const n = Date.now();
    return { fullName: 'Live Test User', email: `live-${n}@schub.test`, password: TEST_PASSWORD, confirmPassword: TEST_PASSWORD,
      matricNumber: `LT${n}`, level: '100',
      schoolId:     process.env.E2E_SCHOOL_ID     ?? 'school-live-test-id',
      facultyId:    process.env.E2E_FACULTY_ID    ?? 'faculty-live-test-id',
      departmentId: process.env.E2E_DEPARTMENT_ID ?? 'department-live-test-id' };
  }
  if (routePath.includes('/auth/login'))          return { email: TEST_EMAIL, password: TEST_PASSWORD };
  if (routePath.includes('/auth/refresh'))        return { refreshToken: 'refresh-token-live-test' };
  if (routePath.includes('/auth/logout'))         return { refreshToken: 'refresh-token-live-test' };
  if (routePath.includes('/forgot-password'))     return { email: TEST_EMAIL };
  if (routePath.includes('/verify-otp'))          return { email: TEST_EMAIL, otp: '000000', type: 'EMAIL_VERIFICATION' };
  if (routePath.includes('/reset-password'))      return { email: TEST_EMAIL, otp: '000000', password: TEST_PASSWORD, confirmPassword: TEST_PASSWORD };
  if (routePath.includes('/resend-otp'))          return { email: TEST_EMAIL, type: 'EMAIL_VERIFICATION' };

  // ── CGPA ────────────────────────────────────────────────────────────────
  if (routePath.includes('/cgpa/calculate'))      return { semester: 'FIRST', session: '2025/2026' };
  if (routePath.includes('/cgpa/courses'))        return { courseCode: 'CSC101', courseTitle: 'Live Test Course', creditUnit: 3, score: 75, semester: 'FIRST', session: '2025/2026' };

  // ── Reminders ───────────────────────────────────────────────────────────
  if (routePath.includes('/reminders'))           return { title: 'Live Test Reminder', dueDate: futureDate(180), notifyAt: futureDate(60), priority: 'MEDIUM', category: 'OTHER' };

  // ── Community ───────────────────────────────────────────────────────────
  if (routePath.includes('/community/faqs'))      return { question: 'Live test FAQ?', answer: 'Live test answer.', category: 'general', order: 0 };
  if ((routePath.includes('/community/notices') || routePath.includes('/community/posts')) && routePath.includes('/pin'))
    return { isPinned: true };
  if (routePath.includes('/community/notices') || routePath.includes('/community/posts'))
    return { content: 'Live test post content', section: 'NOTICE_BOARD', priority: 'GENERAL', isAnonymous: false };
  if (routePath.includes('/community/questions') && !routePath.includes('/answers') && !routePath.includes('/upvote'))
    return { title: 'Live test question?', content: 'This is a live test question body.', type: 'COURSE_HELP', courseTag: 'CSC101', isAnonymous: false };
  if (routePath.includes('/answers') && routePath.includes('/react'))   return { type: 'HELPFUL', targetType: 'answer' };
  if (routePath.includes('/answers') && routePath.includes('/upvote'))  return { targetType: 'answer' };
  if (routePath.includes('/questions') && routePath.includes('/upvote')) return { targetType: 'question' };
  if (routePath.includes('/posts') && routePath.includes('/upvote'))    return { targetType: 'post' };
  if (routePath.includes('/posts') && routePath.includes('/react'))     return { type: 'LIKE', targetType: 'post' };
  if (routePath.includes('/posts') && routePath.includes('/report'))    return { reason: 'SPAM', targetType: 'post' };
  if (routePath.includes('/posts') && routePath.includes('/comments'))  return { content: 'Live test comment' };
  if (routePath.includes('/comments') && routePath.includes('/upvote')) return { targetType: 'comment' };
  if (routePath.includes('/questions') && routePath.includes('/answers')) return { content: 'Live test answer content that is long enough.' };
  if (routePath.includes('/mentors/register'))    return { courseCode: 'CSC101' };

  // ── Study groups ────────────────────────────────────────────────────────
  if (routePath.includes('/community/groups') && routePath.includes('/ai/ask'))     return { question: 'What is this about?' };
  if (routePath.includes('/community/groups') && routePath.includes('/ai/summary')) return { materialId: 'material-live-test-id' };
  if (routePath.includes('/community/groups') && routePath.includes('/challenges')) return { receiverGroupId: 'group-live-test-id', quizId: 'quiz-live-test-id', expiresInHours: 24 };
  if (routePath.includes('/community/groups') && routePath.includes('/invites'))    return { maxUses: 1, expiresInHours: 24 };
  if (routePath.includes('/community/groups') && routePath.includes('/messages'))   return { content: 'Live test message content' };
  if (routePath.includes('/community/groups') && routePath.includes('/members') && routePath.includes('/role')) return { role: 'MEMBER' };
  if (routePath.match(/\/community\/groups\/[^/]+\/join$/))                         return {};
  if (routePath.includes('/community/groups/join/'))                                return {};
  if (routePath.match(/\/community\/groups$/) || routePath.match(/\/community\/groups\/$/))
    return { name: 'Live Test Group', description: 'Live test group.', type: 'GENERAL', isPrivate: false };
  if (routePath.includes('/community/groups') && !routePath.includes('/challenges') && !routePath.includes('/accept') && !routePath.includes('/decline'))
    return { name: 'Updated Live Test Group' };

  // ── Marketplace ─────────────────────────────────────────────────────────
  if (routePath.includes('/marketplace/listings') && !routePath.includes('/save'))
    return { title: 'Live Test Listing', description: 'Automated live test listing description.', price: 1000, category: 'OTHER', condition: 'GOOD', images: ['https://example.com/img.jpg'], location: 'Campus', whatsapp: '+2348000000000' };
  if (routePath.includes('/marketplace/listings') && routePath.includes('/save')) return {};
  if (routePath.includes('/marketplace/shops') && !routePath.includes('/follow')) return { name: 'Live Test Shop', description: 'Automated live test shop.' };
  if (routePath.includes('/marketplace/shops') && routePath.includes('/follow'))  return {};
  if (routePath.includes('/marketplace/sellers'))    return { rating: 5, comment: 'Live test rating' };
  if (routePath.includes('/marketplace/lost-found')) return { type: 'LOST', title: 'Live Test Item', description: 'Automated live test lost item.', location: 'Campus', contactInfo: '+2348000000000' };
  if (routePath.includes('/marketplace/accommodation'))
    return { title: 'Live Test Room', description: 'Automated live test accommodation description.', type: 'SINGLE_ROOM', price: 100000, period: 'year', location: 'Campus', images: [], whatsapp: '+2348000000000' };
  if (routePath.includes('/marketplace/roommates'))
    return { description: 'Automated live test roommate request description.', budget: 100000, preferredArea: 'Campus', gender: 'any', level: '100', whatsapp: '+2348000000000' };
  if (routePath.includes('/marketplace/services'))
    return { title: 'Live Test Service', description: 'Automated live test service description.', category: 'OTHER', price: 1000, images: [], whatsapp: '+2348000000000' };
  if (routePath.includes('/marketplace/jobs') && routePath.includes('/reject')) return { rejectionReason: 'Automated live test rejection reason.' };
  if (routePath.includes('/marketplace/jobs'))
    return { title: 'Live Test Job', description: 'Automated live test job description.', type: 'CAMPUS_JOB', pay: 'Negotiable', location: 'Campus', whatsapp: '+2348000000000' };

  // ── School ───────────────────────────────────────────────────────────────
  if (routePath.includes('/school/timetable'))
    return { timetableType: 'PERSONAL', courseCode: 'CSC101', courseTitle: 'Live Test Class', venue: 'Test Hall', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', type: 'LECTURE' };
  if (routePath.includes('/school/events') && routePath.includes('/tickets') && !routePath.includes('/approve') && !routePath.includes('/reject'))
    return { receiptUrl: 'https://example.com/receipt.jpg', receiptKey: 'live-test-receipt' };
  if (routePath.includes('/school/events') && routePath.includes('/remind'))  return { notifyAt: futureDate(30) };
  if (routePath.includes('/school/events') && !routePath.includes('/tickets') && !routePath.includes('/image') && !routePath.includes('/remind'))
    return { title: 'Live Test Event', description: 'Automated live test event.', datetime: futureDate(1440), location: 'Campus' };
  if (routePath.includes('/school/map-locations') && routePath.includes('/bulk'))
    return { updates: [{ id: 'map-location-live-test-id', name: 'Live Test Location' }] };
  if (routePath.includes('/school/map-locations'))
    return { name: 'Live Test Location', type: 'BUILDING', latitude: 7.616, longitude: 4.735, tags: ['test'] };
  if (routePath.includes('/school/emergency-contacts'))
    return { name: 'Live Test Contact', role: 'Test Role', phone: '+2348000000000', category: 'OTHER', order: 0 };

  // ── Campus map ───────────────────────────────────────────────────────────
  if (routePath.includes('/campus-map/route/progress')) return { routeId: 'live-test-route', user: { lat: 7.616, lng: 4.735 }, route: { type: 'LineString', coordinates: [[4.735, 7.616], [4.736, 7.617]] } };
  if (routePath.includes('/campus-map/route'))          return { from: { lat: 7.616, lng: 4.735 }, to: { lat: 7.617, lng: 4.736 } };

  // ── Study ────────────────────────────────────────────────────────────────
  // File-upload endpoints: send empty body — will get 400 but NOT 404 or 500
  if (routePath.includes('/study/materials/extract-preview')) return undefined;
  if (routePath.includes('/study/materials/bulk'))            return undefined;
  if (routePath.includes('/study/materials') && !routePath.includes('/visibility') && !routePath.includes('/verify') && !routePath.includes('/rate') && !routePath.includes('/bookmark') && !routePath.includes('/download') && !routePath.includes('/bulk') && !routePath.includes('/extract-preview'))
    return undefined; // POST /study/materials is also a file upload
  if (routePath.includes('/study/materials') && routePath.includes('/visibility')) return { visibility: 'PUBLIC' };
  if (routePath.includes('/study/materials') && routePath.includes('/verify'))     return { isVerified: true };
  if (routePath.includes('/study/materials') && routePath.includes('/rate'))       return { rating: 5 };
  if (routePath.includes('/study/materials') && routePath.includes('/bookmark'))   return {};
  if (routePath.includes('/study/materials') && routePath.includes('/download'))   return {};
  if (routePath.includes('/study/quizzes') && routePath.includes('/attempt'))      return { answers: [], timeTaken: 0 };
  if (routePath.includes('/study/quizzes') && routePath.includes('/approve'))       return { approvals: [{ questionId: 'question-live-test-id', approved: true }] };
  if (routePath.includes('/study/quizzes') && routePath.includes('/publish'))       return { isDraft: false };
  if (routePath.includes('/study/quizzes/generate'))
    return { materialId: 'material-live-test-id', questionCount: 5, departmentId: process.env.E2E_DEPARTMENT_ID ?? 'department-live-test-id' };
  if (routePath.includes('/study/quizzes'))
    return { title: 'Live Test Quiz', courseCode: 'CSC101', description: 'Automated live test quiz.', level: '100', timeLimit: 60,
      departmentId: process.env.E2E_DEPARTMENT_ID ?? 'department-live-test-id',
      questions: [{ question: '2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: 1, explanation: 'Basic math.', order: 0 }] };

  // ── Notifications ────────────────────────────────────────────────────────
  if (routePath.includes('/notifications/settings')) return { pushNotifications: true };
  if (routePath.includes('/read-all') || routePath.includes('/read')) return {};

  // ── Users ────────────────────────────────────────────────────────────────
  if (routePath.includes('/users/me/avatar'))   return undefined; // file upload
  if (routePath.includes('/users/me/profile'))  return { bio: 'Live test bio' };
  if (routePath.includes('/users/me/settings')) return { darkMode: false };
  if (routePath.includes('/users/me/fcm-token')) return { fcmToken: 'live-test-fcm-token-value' };
  if (routePath.includes('/assign-role'))       return { userId: 'user-live-test-id', role: 'STUDENT' };
  if (routePath.includes('/nominate-course-rep')) return { userId: 'user-live-test-id' };

  // ── Super-admin ──────────────────────────────────────────────────────────
  if (routePath.includes('/super-admin/admins') && routePath.includes('/reset-password'))
    return { newPassword: TEST_PASSWORD };
  if (routePath.includes('/super-admin/admins'))
    return { fullName: 'Live Test Admin', email: `live-admin-${Date.now()}@schub.test`, password: TEST_PASSWORD, role: 'SCHOOL_ADMIN', schoolId: process.env.E2E_SCHOOL_ID ?? 'school-live-test-id' };
  if (routePath.includes('/super-admin/schools') && !routePath.includes('/faculties'))
    return { name: 'Live Test School', shortCode: `LT${Date.now().toString().slice(-6)}`, location: 'Test City' };
  if (routePath.includes('/super-admin/schools') && routePath.includes('/faculties'))
    return { name: 'Live Test Faculty' };
  if (routePath.includes('/super-admin/faculties') && routePath.includes('/departments'))
    return { name: 'Live Test Department', shortCode: `LD${Date.now().toString().slice(-4)}` };
  if (routePath.includes('/super-admin/map') && routePath.includes('/entrances'))
    return { id: `entrance-${Date.now()}`, geometry: { type: 'Point', coordinates: [4.735, 7.616] }, kind: 'MAIN' };
  if (routePath.includes('/super-admin/map') && routePath.includes('/features') && !routePath.includes('/images'))
    return { id: `feature-${Date.now()}`, name: 'Live Test Feature', category: 'BUILDING', geometry: { type: 'Point', coordinates: [4.735, 7.616] } };
  if (routePath.includes('/super-admin/map') && routePath.includes('/images'))
    return undefined; // file upload
  if (routePath.includes('/super-admin/map') && routePath.includes('/import'))
    return { features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [4.735, 7.616] }, properties: { name: 'Live Test Import' } }] };

  // ── AI ───────────────────────────────────────────────────────────────────
  if (routePath.includes('/ai/summarize')) return { materialId: 'material-live-test-id' };

  return {};
}

// ── HTTP helper ────────────────────────────────────────────────────────────

async function req({ token, method, path: routePath }) {
  const url = new URL(concretePath(routePath), BASE_URL);
  for (const [k, v] of Object.entries(queryFor(routePath))) url.searchParams.set(k, v);

  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const body = bodyFor(method, routePath);
  let fetchBody;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), { method, headers, body: fetchBody });
  const text = await res.text().catch(() => '');
  return { status: res.status, body: text.slice(0, 500), url: url.toString() };
}

// ── Auto-provision SUPER_ADMIN test user ───────────────────────────────────

async function provisionTestUser() {
  // 1. Fetch a real school/faculty/department from the running server
  const schoolsRes = await fetch(`${BASE_URL}/api/v1/school/schools`).catch(() => null);
  if (!schoolsRes?.ok) throw new Error(`Cannot reach server at ${BASE_URL} — is it running?`);
  const schoolsBody = await schoolsRes.json();
  const school = schoolsBody?.data?.[0];
  if (!school) throw new Error('No schools found in DB — run: npm run prisma:seed --workspace backend');

  const facultiesRes  = await fetch(`${BASE_URL}/api/v1/school/schools/${school.id}/faculties`);
  const facultiesBody = await facultiesRes.json();
  const faculty = facultiesBody?.data?.[0];
  if (!faculty) throw new Error('No faculties found');

  const deptsRes  = await fetch(`${BASE_URL}/api/v1/school/faculties/${faculty.id}/departments`);
  const deptsBody = await deptsRes.json();
  const dept = deptsBody?.data?.[0];
  if (!dept) throw new Error('No departments found');

  process.env.E2E_SCHOOL_ID     = school.id;
  process.env.E2E_FACULTY_ID    = faculty.id;
  process.env.E2E_DEPARTMENT_ID = dept.id;

  // 2. Register a new user
  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'E2E Super Admin',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
      matricNumber: TEST_MATRIC,
      level: '100',
      schoolId: school.id,
      facultyId: faculty.id,
      departmentId: dept.id,
    }),
  });
  const regBody = await regRes.json().catch(() => ({}));
  if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regBody)}`);

  const userId = regBody?.data?.user?.id;
  if (!userId) throw new Error('Register did not return user id');

  // 3. Promote + verify directly in DB using Prisma in this process
  //    DATABASE_URL is already loaded from .env above
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'SUPER_ADMIN', isVerified: true },
    });
  } finally {
    await prisma.$disconnect();
  }

  // 4. Login to get token
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginBody)}`);

  const token = loginBody?.data?.accessToken ?? loginBody?.accessToken;
  if (!token) throw new Error(`No accessToken in login response: ${JSON.stringify(loginBody)}`);
  return token;
}

// ── Jest suite ─────────────────────────────────────────────────────────────

describe('live API full endpoint coverage', () => {
  const endpoints = discoverEndpoints();
  let token;

  beforeAll(async () => {
    token = await provisionTestUser();
  }, 30000);

  test('endpoint inventory is complete', () => {
    expect(endpoints.length).toBeGreaterThan(0);
    // Every discovered endpoint should be unique
    const keys = endpoints.map((e) => `${e.method} ${e.path}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test.each(endpoints)(
    '$method $path',
    async ({ method, path: routePath }) => {
      const result = await req({ token, method, path: routePath });

      // Must not be a 404 "route not found" — that means route is not mounted
      const isNotFound = result.status === 404 && /route not found/i.test(result.body);
      expect(isNotFound).toBe(false);

      // Must not be a server crash
      expect(result.status).not.toBe(500);
      expect(result.status).not.toBe(502);
      expect(result.status).not.toBe(503);

      // Acceptable statuses: 200-299 success, 400/422 validation, 401/403 auth/authz,
      // 404 resource-not-found (not route-not-found), 409 conflict, 429 rate limit
      expect(result.status).toBeGreaterThanOrEqual(200);
      expect(result.status).toBeLessThan(500);
    },
    15000
  );
});
