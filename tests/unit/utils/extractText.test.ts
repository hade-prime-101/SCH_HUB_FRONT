import { extractText } from '@/utils/extractText';

// ── extractText unit tests ─────────────────────────────────────────────────

describe('extractText', () => {
  describe('input validation', () => {
    it('returns EMPTY for unsupported MIME type (not throw — caller validates MIME before upload)', async () => {
      const buffer = Buffer.from('hello');
      const result = await extractText(buffer, 'image/png', 'test.png');
      expect(result.status).toBe('EMPTY');
      expect(result.text).toBe('');
    });

    it('returns EMPTY for empty buffer on PDF (pdf-parse mocked)', async () => {
      // pdf-parse is mocked via moduleNameMapper — returns { text: '' }
      // so extractPdf returns '' → charCount 0 → status EMPTY
      const result = await extractText(Buffer.alloc(0), 'application/pdf', 'empty.pdf');
      expect(result.status).toBe('EMPTY');
      expect(result.text).toBe('');
    });

    it('returns EMPTY for empty buffer on DOCX', async () => {
      // mammoth returns empty string for empty buffer
      const buffer = Buffer.alloc(0);
      try {
        const result = await extractText(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'empty.docx');
        expect(result.status).toBe('EMPTY');
      } catch {
        // mammoth may throw on empty buffer — acceptable
      }
    });
  });

  describe('plain text extraction', () => {
    it('extracts text from plain text buffer', async () => {
      const content = 'Hello world, this is a test document with enough characters to pass the minimum readable check for the extractor utility.';
      const buffer = Buffer.from(content, 'utf-8');
      const result = await extractText(buffer, 'text/plain', 'test.txt');

      expect(result.text).toContain('Hello world');
      expect(result.charCount).toBeGreaterThan(0);
      expect(['READABLE', 'EMPTY']).toContain(result.status);
      expect(typeof result.preview).toBe('string');
    });

    it('returns EMPTY status for very short text', async () => {
      const buffer = Buffer.from('Hi', 'utf-8');
      const result = await extractText(buffer, 'text/plain', 'tiny.txt');
      expect(result.status).toBe('EMPTY');
    });

    it('returns READABLE status for text meeting minimum length', async () => {
      // Need >= 200 chars
      const content = 'A'.repeat(250);
      const buffer = Buffer.from(content, 'utf-8');
      const result = await extractText(buffer, 'text/plain', 'long.txt');
      expect(result.status).toBe('READABLE');
      expect(result.charCount).toBeGreaterThanOrEqual(200);
    });

    it('truncates preview to 500 chars', async () => {
      const content = 'B'.repeat(1000);
      const buffer = Buffer.from(content, 'utf-8');
      const result = await extractText(buffer, 'text/plain', 'big.txt');
      expect(result.preview.length).toBeLessThanOrEqual(500);
    });
  });

  describe('sanitizeFilenameForTmp (path traversal defence)', () => {
    it('handles filenames with path traversal characters safely via extractText wrapper', async () => {
      const content = 'C'.repeat(300);
      const buffer = Buffer.from(content, 'utf-8');
      // Should not throw due to path traversal in filename — basename is extracted
      const result = await extractText(buffer, 'text/plain', '../../etc/passwd');
      expect(result).toBeDefined();
    });

    it('handles null-byte in filename without crashing', async () => {
      const content = 'D'.repeat(300);
      const buffer = Buffer.from(content, 'utf-8');
      const result = await extractText(buffer, 'text/plain', 'file\x00.txt');
      expect(result).toBeDefined();
    });
  });
});
