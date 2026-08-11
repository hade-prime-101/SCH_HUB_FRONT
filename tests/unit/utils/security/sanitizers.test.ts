/**
 * Security sanitizer tests.
 *
 * These tests verify input sanitisation behaviours that protect against
 * XSS (CWE-79/80), log injection (CWE-117), and path traversal (CWE-22).
 *
 * The sanitizers are private helpers inside their modules, so we test their
 * effects through the public API surface rather than calling them directly.
 */

import { notificationTopic } from '@/modules/notifications/notifications.service';
import { extractText } from '@/utils/extractText';

// ── notificationTopic — topic name sanitization ───────────────────────────

describe('Security: notificationTopic() sanitization (CWE-79)', () => {
  it('replaces spaces with dashes', () => {
    const topic = notificationTopic('school', 'my school');
    expect(topic).not.toContain(' ');
  });

  it('replaces < > with dashes (XSS prevention)', () => {
    const topic = notificationTopic('school', '<script>');
    expect(topic).not.toContain('<');
    expect(topic).not.toContain('>');
  });

  it('replaces & with dash', () => {
    const topic = notificationTopic('school', 'a&b');
    expect(topic).not.toContain('&');
  });

  it('keeps alphanumeric, hyphen, underscore, tilde, dot, percent', () => {
    const id = 'valid-id_1.2~3%20';
    const topic = notificationTopic('school', id);
    expect(topic).toBe(`school-${id}`);
  });

  it('does not produce empty string for all-special-char ID', () => {
    const topic = notificationTopic('school', '!!!');
    expect(topic.length).toBeGreaterThan(0);
    expect(topic.startsWith('school-')).toBe(true);
  });
});

// ── extractText — path traversal sanitization (CWE-22) ───────────────────

describe('Security: extractText filename sanitization (CWE-22)', () => {
  const textBuf = Buffer.from('X'.repeat(300), 'utf-8');

  it('does not throw on path traversal filename', async () => {
    await expect(
      extractText(textBuf, 'text/plain', '../../../etc/passwd'),
    ).resolves.toBeDefined();
  });

  it('does not throw on URL-encoded path traversal', async () => {
    await expect(
      extractText(textBuf, 'text/plain', '..%2F..%2Fetc%2Fpasswd'),
    ).resolves.toBeDefined();
  });

  it('does not throw on null-byte injection in filename', async () => {
    await expect(
      extractText(textBuf, 'text/plain', 'file\x00.txt'),
    ).resolves.toBeDefined();
  });

  it('does not throw on ANSI escape in filename', async () => {
    await expect(
      extractText(textBuf, 'text/plain', '\x1B[31mmalicious\x1B[0m.txt'),
    ).resolves.toBeDefined();
  });

  it('does not throw on Unicode homoglyph filename', async () => {
    await expect(
      extractText(textBuf, 'text/plain', 'ｅｖｉｌ.txt'),
    ).resolves.toBeDefined();
  });
});

// ── Unsupported MIME type guard ───────────────────────────────────────────

describe('Security: extractText MIME type guard', () => {
  // extractText returns EMPTY (not throw) for unsupported MIME types —
  // the caller is responsible for rejecting files before calling extractText.
  // extractTextOrReject (the stricter variant) throws on unreadable results.

  it('returns EMPTY status for executable MIME type', async () => {
    const result = await extractText(Buffer.from('data'), 'application/x-executable', 'evil.exe');
    expect(result.status).toBe('EMPTY');
    expect(result.text).toBe('');
  });

  it('returns EMPTY status for image MIME type', async () => {
    const result = await extractText(Buffer.from('data'), 'image/jpeg', 'photo.jpg');
    expect(result.status).toBe('EMPTY');
  });

  it('returns EMPTY status for video MIME type', async () => {
    const result = await extractText(Buffer.from('data'), 'video/mp4', 'clip.mp4');
    expect(result.status).toBe('EMPTY');
  });
});
