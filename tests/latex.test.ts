import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  renderToLatex,
  escapeLatex,
  getLatexSymbol,
  copyLatexToClipboard,
} from '@/lib/export/latex';
import type { NumberedOutput, NumberedAuthor, NumberedAffiliation, TemplateConfig, Author, Institution } from '@/types';

const defaultConfig: TemplateConfig = {
  preset: 'nature',
  superscriptStyle: 'numeric',
  includeFaculty: true,
  includeDepartment: true,
  includeZipcode: false,
  includeLab: true,
  includeHospital: true,
  separator: ',',
  hkSuffix: 'Hong Kong SAR, China',
  coFirstSymbol: '†',
  correspondingSymbol: '*',
  coFirstFootnote: 'These authors contributed equally to this work.',
};

function createTestOutput(): NumberedOutput {
  const author1: Author = {
    id: 'a1',
    name: 'San Zhang',
    email: 'san@hku.hk',
    affiliationIds: ['inst1', 'inst2'],
    isCorresponding: true,
    isCoFirst: false,
    order: 0,
  };

  const author2: Author = {
    id: 'a2',
    name: 'Si Li',
    affiliationIds: ['inst3'],
    isCorresponding: false,
    isCoFirst: true,
    order: 1,
  };

  const inst1: Institution = {
    id: 'inst1',
    source: 'hku',
    components: {
      department: 'Department of Medicine',
      university: 'The University of Hong Kong',
      city: 'Hong Kong',
      country: 'Hong Kong',
    },
  };

  const inst2: Institution = {
    id: 'inst2',
    source: 'hku',
    components: {
      lab: 'State Key Laboratory',
      university: 'The University of Hong Kong',
      city: 'Hong Kong',
      country: 'Hong Kong',
    },
  };

  const inst3: Institution = {
    id: 'inst3',
    source: 'ror',
    components: {
      department: 'Department of Computer Science',
      university: 'Tsinghua University',
      city: 'Beijing',
      country: 'China',
    },
  };

  const numberedAuthors: NumberedAuthor[] = [
    { author: author1, superscripts: ['1', '2'], symbols: ['*'] },
    { author: author2, superscripts: ['3'], symbols: ['†'] },
  ];

  const numberedAffiliations: NumberedAffiliation[] = [
    { number: '1', institution: inst1, displayText: 'Department of Medicine, The University of Hong Kong, Hong Kong SAR, China' },
    { number: '2', institution: inst2, displayText: 'State Key Laboratory, The University of Hong Kong, Hong Kong SAR, China' },
    { number: '3', institution: inst3, displayText: 'Department of Computer Science, Tsinghua University, Beijing, China' },
  ];

  return {
    authors: numberedAuthors,
    affiliations: numberedAffiliations,
    footnotes: [
      { symbol: '†', text: 'These authors contributed equally to this work.' },
      { symbol: '*', text: 'Corresponding author. Email: san@hku.hk' },
    ],
  };
}

describe('latex exporter', () => {
  describe('renderToLatex', () => {
    it('includes usepackage{authblk}', () => {
      const output = createTestOutput();
      const latex = renderToLatex(output, defaultConfig);

      expect(latex).toContain('\\usepackage{authblk}');
    });

    it('renders authors with affiliation numbers', () => {
      const output = createTestOutput();
      const latex = renderToLatex(output, defaultConfig);

      expect(latex).toContain('\\author[1,2]');
      expect(latex).toContain('{San Zhang');
      expect(latex).toContain('\\author[3]');
      expect(latex).toContain('{Si Li');
    });

    it('renders co-first author with dagger symbol', () => {
      const output = createTestOutput();
      const latex = renderToLatex(output, defaultConfig);

      expect(latex).toContain('$\\dagger$');
    });

    it('renders corresponding author with asterisk', () => {
      const output = createTestOutput();
      const latex = renderToLatex(output, defaultConfig);

      // Corresponding author symbol
      expect(latex).toContain('\\textsuperscript{*}');
    });

    it('renders affiliations with \\affil command', () => {
      const output = createTestOutput();
      const latex = renderToLatex(output, defaultConfig);

      expect(latex).toContain('\\affil[1]{Department of Medicine');
      expect(latex).toContain('\\affil[2]{State Key Laboratory');
      expect(latex).toContain('\\affil[3]{Department of Computer Science');
    });

    it('includes footnotes as comments', () => {
      const output = createTestOutput();
      const latex = renderToLatex(output, defaultConfig);

      expect(latex).toContain('% Footnotes:');
      expect(latex).toContain('% \\textsuperscript{');
      expect(latex).toContain('These authors contributed equally');
      expect(latex).toContain('Corresponding author');
    });

    it('returns empty string for empty output', () => {
      const emptyOutput: NumberedOutput = {
        authors: [],
        affiliations: [],
        footnotes: [],
      };
      const latex = renderToLatex(emptyOutput, defaultConfig);

      expect(latex).toBe('');
    });
  });

  describe('escapeLatex', () => {
    it('escapes ampersand', () => {
      expect(escapeLatex('R&D Department')).toBe('R\\&D Department');
    });

    it('escapes percent', () => {
      expect(escapeLatex('100% accurate')).toBe('100\\% accurate');
    });

    it('escapes dollar sign', () => {
      expect(escapeLatex('Cost: $100')).toBe('Cost: \\$100');
    });

    it('escapes hash', () => {
      expect(escapeLatex('Item #1')).toBe('Item \\#1');
    });

    it('escapes underscore', () => {
      expect(escapeLatex('name_value')).toBe('name\\_value');
    });

    it('escapes curly braces', () => {
      expect(escapeLatex('{value}')).toBe('\\{value\\}');
    });

    it('escapes tilde', () => {
      expect(escapeLatex('~test')).toBe('\\textasciitilde{}test');
    });

    it('escapes caret', () => {
      expect(escapeLatex('x^2')).toBe('x\\textasciicircum{}2');
    });

    it('leaves normal text unchanged', () => {
      expect(escapeLatex('The University of Hong Kong')).toBe('The University of Hong Kong');
    });

    it('escapes multiple special characters', () => {
      expect(escapeLatex('R&D 100% cost: $50 #1')).toBe('R\\&D 100\\% cost: \\$50 \\#1');
    });
  });

  describe('getLatexSymbol', () => {
    it('maps dagger symbol', () => {
      expect(getLatexSymbol('†')).toBe('$\\dagger$');
    });

    it('maps double dagger symbol', () => {
      expect(getLatexSymbol('‡')).toBe('$\\ddagger$');
    });

    it('preserves asterisk', () => {
      expect(getLatexSymbol('*')).toBe('*');
    });

    it('maps section symbol', () => {
      expect(getLatexSymbol('§')).toBe('\\S');
    });

    it('returns original for unknown symbols', () => {
      expect(getLatexSymbol('?')).toBe('?');
    });
  });

  describe('copyLatexToClipboard', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: vi.fn(),
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('calls clipboard.writeText with latex content', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        clipboard: { writeText: mockWriteText },
      });

      const latex = '\\usepackage{authblk}';
      const result = await copyLatexToClipboard(latex);

      expect(mockWriteText).toHaveBeenCalledWith(latex);
      expect(result).toBe(true);
    });

    it('returns false when clipboard API fails', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Failed'));
      vi.stubGlobal('navigator', {
        clipboard: { writeText: mockWriteText },
      });
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await copyLatexToClipboard('test');

      expect(result).toBe(false);
    });
  });
});
