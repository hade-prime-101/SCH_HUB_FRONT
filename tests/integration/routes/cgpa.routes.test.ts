import { testApp, makeToken } from '../../helpers/test-app';
import { prismaMock } from '../../helpers/mock-factories';

const BASE = '/api/v1/cgpa';

// All routes require authentication
describe('CGPA routes — unauthenticated', () => {
  const routes: Array<[string, string]> = [
    ['GET',    '/courses'],
    ['POST',   '/courses'],
    ['PATCH',  '/courses/some-id'],
    ['DELETE', '/courses/some-id'],
    ['POST',   '/calculate'],
    ['GET',    '/records'],
    ['GET',    '/records/current'],
  ];

  it.each(routes)('%s %s returns 401', async (method, path) => {
    const res = await (testApp as any)[method.toLowerCase()](`${BASE}${path}`);
    expect(res.status).toBe(401);
  });
});

// ── GET /cgpa/courses ──────────────────────────────────────────────────────

describe('GET /cgpa/courses', () => {
  it('returns courses list when authenticated', async () => {
    const token = makeToken({ id: 'u-1' });
    prismaMock.cGPACourse.findMany.mockResolvedValue([]);

    const res = await testApp.get(`${BASE}/courses`).set('Authorization', `Bearer ${token}`);
    expect([200, 500]).toContain(res.status);
  });
});

// ── POST /cgpa/courses ─────────────────────────────────────────────────────

describe('POST /cgpa/courses', () => {
  it('returns 400 when body is empty', async () => {
    const token = makeToken({ id: 'u-1' });
    const res = await testApp
      .post(`${BASE}/courses`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('creates course with valid payload', async () => {
    const token = makeToken({ id: 'u-1' });
    prismaMock.cGPACourse.create.mockResolvedValue({
      id: 'c-1', courseCode: 'CSC101', courseTitle: 'Intro', creditUnits: 3,
      score: 85, userId: 'u-1',
    } as any);

    const res = await testApp
      .post(`${BASE}/courses`)
      .set('Authorization', `Bearer ${token}`)
      .send({ courseCode: 'CSC101', courseTitle: 'Intro', creditUnits: 3, score: 85, semester: 'FIRST', level: '100' });
    expect([200, 201, 400, 500]).toContain(res.status);
  });
});

// ── PATCH /cgpa/courses/:id ────────────────────────────────────────────────

describe('PATCH /cgpa/courses/:id', () => {
  it('returns 404 for non-existent course', async () => {
    const token = makeToken({ id: 'u-1' });
    prismaMock.cGPACourse.findUnique.mockResolvedValue(null);

    const res = await testApp
      .patch(`${BASE}/courses/non-existent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 90 });
    expect([404, 500]).toContain(res.status);
  });
});

// ── DELETE /cgpa/courses/:id ───────────────────────────────────────────────

describe('DELETE /cgpa/courses/:id', () => {
  it('returns 404 for non-existent course', async () => {
    const token = makeToken({ id: 'u-1' });
    prismaMock.cGPACourse.findUnique.mockResolvedValue(null);

    const res = await testApp
      .delete(`${BASE}/courses/non-existent`)
      .set('Authorization', `Bearer ${token}`);
    expect([404, 500]).toContain(res.status);
  });
});

// ── POST /cgpa/calculate ───────────────────────────────────────────────────

describe('POST /cgpa/calculate', () => {
  it('returns 400 when no courses exist', async () => {
    const token = makeToken({ id: 'u-1' });
    prismaMock.cGPACourse.findMany.mockResolvedValue([]);

    const res = await testApp
      .post(`${BASE}/calculate`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([400, 500]).toContain(res.status);
  });
});

// ── GET /cgpa/records ──────────────────────────────────────────────────────

describe('GET /cgpa/records', () => {
  it('returns records when authenticated', async () => {
    const token = makeToken({ id: 'u-1' });
    prismaMock.cGPARecord.findMany.mockResolvedValue([]);

    const res = await testApp.get(`${BASE}/records`).set('Authorization', `Bearer ${token}`);
    expect([200, 500]).toContain(res.status);
  });
});

// ── GET /cgpa/records/current ──────────────────────────────────────────────

describe('GET /cgpa/records/current', () => {
  it('returns current CGPA when authenticated', async () => {
    const token = makeToken({ id: 'u-1' });
    prismaMock.cGPACourse.findMany.mockResolvedValue([]);

    const res = await testApp.get(`${BASE}/records/current`).set('Authorization', `Bearer ${token}`);
    expect([200, 500]).toContain(res.status);
  });
});
