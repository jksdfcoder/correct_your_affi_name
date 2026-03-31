import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  wrapForWord,
  generateRichTextBlob,
  copyRichTextToClipboard,
} from '@/lib/export/rich-text';

describe('rich-text exporter', () => {
  describe('wrapForWord', () => {
    it('adds Word namespace declarations', () => {
      const html = '<p>Test content</p>';
      const wrapped = wrapForWord(html);

      expect(wrapped).toContain('xmlns:o=');
      expect(wrapped).toContain('urn:schemas-microsoft-com:office:office');
      expect(wrapped).toContain('xmlns:w=');
      expect(wrapped).toContain('urn:schemas-microsoft-com:office:word');
    });

    it('adds sup styling for superscripts', () => {
      const html = '<p>Test<sup>1</sup></p>';
      const wrapped = wrapForWord(html);

      expect(wrapped).toContain('sup {');
      expect(wrapped).toContain('vertical-align: super');
      expect(wrapped).toContain('font-size: smaller');
    });

    it('preserves original HTML content', () => {
      const html = '<p>San Zhang<sup>1,2,*</sup>, Si Li<sup>3</sup></p>';
      const wrapped = wrapForWord(html);

      expect(wrapped).toContain('San Zhang');
      expect(wrapped).toContain('<sup>1,2,*</sup>');
      expect(wrapped).toContain('Si Li');
      expect(wrapped).toContain('<sup>3</sup>');
    });

    it('wraps content in html/head/body structure', () => {
      const html = '<p>Content</p>';
      const wrapped = wrapForWord(html);

      expect(wrapped).toMatch(/<html[^>]*>/);
      expect(wrapped).toContain('<head>');
      expect(wrapped).toContain('<meta charset="utf-8">');
      expect(wrapped).toContain('<body>');
      expect(wrapped).toContain('</body>');
      expect(wrapped).toContain('</html>');
    });
  });

  describe('generateRichTextBlob', () => {
    it('returns Blob with text/html MIME type', () => {
      const html = '<p>Test content</p>';
      const blob = generateRichTextBlob(html);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/html');
    });

    it('returns Blob with size greater than 0', () => {
      const html = '<p>Test content</p>';
      const blob = generateRichTextBlob(html);

      expect(blob.size).toBeGreaterThan(0);
    });

    it('wraps content for Word compatibility', () => {
      const html = '<p>Test</p>';
      const blob = generateRichTextBlob(html);

      // Blob size should be larger than original HTML due to wrapping
      expect(blob.size).toBeGreaterThan(html.length);
    });
  });

  describe('copyRichTextToClipboard', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', {
        clipboard: {
          write: vi.fn(),
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('calls clipboard.write with correct ClipboardItem', async () => {
      const mockWrite = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        clipboard: { write: mockWrite },
      });
      vi.stubGlobal('ClipboardItem', class MockClipboardItem {
        constructor(public data: Record<string, Blob>) {}
      });

      const html = '<p>Test</p>';
      const result = await copyRichTextToClipboard(html);

      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('returns false when clipboard API fails', async () => {
      const mockWrite = vi.fn().mockRejectedValue(new Error('Permission denied'));
      vi.stubGlobal('navigator', {
        clipboard: { write: mockWrite },
      });
      vi.stubGlobal('ClipboardItem', class MockClipboardItem {
        constructor(public data: Record<string, Blob>) {}
      });

      // Suppress console.warn during test
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const html = '<p>Test</p>';
      const result = await copyRichTextToClipboard(html);

      expect(result).toBe(false);
    });

    it('returns false when clipboard API is not available', async () => {
      vi.stubGlobal('navigator', {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const html = '<p>Test</p>';
      const result = await copyRichTextToClipboard(html);

      expect(result).toBe(false);
    });
  });
});
