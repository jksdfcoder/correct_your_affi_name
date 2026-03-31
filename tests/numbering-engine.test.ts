import { describe, it, expect } from 'vitest';
import {
  computeNumbering,
  renderAffiliationText,
  getNextSuperscript,
} from '@/lib/numbering-engine';
import type { Author, Institution, TemplateConfig } from '@/types';

// Default template config for testing
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

// Helper to create test institutions
function createInstitution(id: string, overrides: Partial<Institution['components']> = {}): Institution {
  return {
    id,
    source: 'hku',
    components: {
      university: 'The University of Hong Kong',
      city: 'Hong Kong',
      country: 'Hong Kong SAR, China',
      ...overrides,
    },
  };
}

// Helper to create test authors
function createAuthor(
  id: string,
  name: string,
  affiliationIds: string[],
  opts: { isCoFirst?: boolean; isCorresponding?: boolean; email?: string; order?: number } = {}
): Author {
  return {
    id,
    name,
    affiliationIds,
    isCoFirst: opts.isCoFirst ?? false,
    isCorresponding: opts.isCorresponding ?? false,
    email: opts.email,
    order: opts.order ?? 0,
  };
}

describe('Numbering Engine', () => {
  describe('getNextSuperscript', () => {
    it('numeric: returns 1, 2, 3...', () => {
      expect(getNextSuperscript(0, 'numeric')).toBe('1');
      expect(getNextSuperscript(1, 'numeric')).toBe('2');
      expect(getNextSuperscript(9, 'numeric')).toBe('10');
    });

    it('alphabetic: returns a, b, c... aa, ab...', () => {
      expect(getNextSuperscript(0, 'alphabetic')).toBe('a');
      expect(getNextSuperscript(25, 'alphabetic')).toBe('z');
      expect(getNextSuperscript(26, 'alphabetic')).toBe('aa');
      expect(getNextSuperscript(27, 'alphabetic')).toBe('ab');
    });

    it('symbol: returns *, †, ‡...', () => {
      expect(getNextSuperscript(0, 'symbol')).toBe('*');
      expect(getNextSuperscript(1, 'symbol')).toBe('†');
      expect(getNextSuperscript(2, 'symbol')).toBe('‡');
    });
  });

  describe('computeNumbering', () => {
    it('basic numbering: 2 authors, 3 institutions', () => {
      const inst1 = createInstitution('inst1', { department: 'Dept A' });
      const inst2 = createInstitution('inst2', { department: 'Dept B' });
      const inst3 = createInstitution('inst3', { department: 'Dept C' });

      const institutions = new Map([
        ['inst1', inst1],
        ['inst2', inst2],
        ['inst3', inst3],
      ]);

      const authors = [
        createAuthor('a1', 'Alice', ['inst1', 'inst2'], { order: 0 }),
        createAuthor('a2', 'Bob', ['inst3'], { order: 1 }),
      ];

      const result = computeNumbering(authors, institutions, defaultConfig);

      expect(result.authors).toHaveLength(2);
      expect(result.affiliations).toHaveLength(3);
      expect(result.authors[0].superscripts).toEqual(['1', '2']);
      expect(result.authors[1].superscripts).toEqual(['3']);
    });

    it('shared institution gets same number for both authors', () => {
      const inst1 = createInstitution('inst1');
      const inst2 = createInstitution('inst2');
      const inst3 = createInstitution('inst3');

      const institutions = new Map([
        ['inst1', inst1],
        ['inst2', inst2],
        ['inst3', inst3],
      ]);

      // Author A: inst1, inst2
      // Author B: inst2, inst3
      // inst2 should get the same number for both
      const authors = [
        createAuthor('a1', 'Alice', ['inst1', 'inst2'], { order: 0 }),
        createAuthor('a2', 'Bob', ['inst2', 'inst3'], { order: 1 }),
      ];

      const result = computeNumbering(authors, institutions, defaultConfig);

      expect(result.affiliations).toHaveLength(3);
      // inst1 -> 1, inst2 -> 2, inst3 -> 3
      expect(result.authors[0].superscripts).toEqual(['1', '2']);
      expect(result.authors[1].superscripts).toEqual(['2', '3']);
    });

    it('alphabetic style: assigns a, b, c', () => {
      const inst1 = createInstitution('inst1');
      const inst2 = createInstitution('inst2');

      const institutions = new Map([
        ['inst1', inst1],
        ['inst2', inst2],
      ]);

      const authors = [createAuthor('a1', 'Alice', ['inst1', 'inst2'])];

      const config = { ...defaultConfig, superscriptStyle: 'alphabetic' as const };
      const result = computeNumbering(authors, institutions, config);

      expect(result.authors[0].superscripts).toEqual(['a', 'b']);
    });

    it('co-first author: both get † symbol, footnote generated', () => {
      const inst1 = createInstitution('inst1');
      const institutions = new Map([['inst1', inst1]]);

      const authors = [
        createAuthor('a1', 'Alice', ['inst1'], { isCoFirst: true, order: 0 }),
        createAuthor('a2', 'Bob', ['inst1'], { isCoFirst: true, order: 1 }),
      ];

      const result = computeNumbering(authors, institutions, defaultConfig);

      expect(result.authors[0].symbols).toContain('†');
      expect(result.authors[1].symbols).toContain('†');
      expect(result.footnotes.some(f => f.symbol === '†')).toBe(true);
    });

    it('corresponding author: gets * symbol, email footnote generated', () => {
      const inst1 = createInstitution('inst1');
      const institutions = new Map([['inst1', inst1]]);

      const authors = [
        createAuthor('a1', 'Alice', ['inst1'], { isCorresponding: true, email: 'alice@hku.hk' }),
      ];

      const result = computeNumbering(authors, institutions, defaultConfig);

      expect(result.authors[0].symbols).toContain('*');
      expect(result.footnotes.some(f => f.text.includes('alice@hku.hk'))).toBe(true);
    });

    it('single author single institution: simplest case', () => {
      const inst1 = createInstitution('inst1');
      const institutions = new Map([['inst1', inst1]]);
      const authors = [createAuthor('a1', 'Alice', ['inst1'])];

      const result = computeNumbering(authors, institutions, defaultConfig);

      expect(result.authors).toHaveLength(1);
      expect(result.affiliations).toHaveLength(1);
      expect(result.authors[0].superscripts).toEqual(['1']);
    });

    it('empty authors: returns empty output gracefully', () => {
      const institutions = new Map<string, Institution>();
      const result = computeNumbering([], institutions, defaultConfig);

      expect(result.authors).toHaveLength(0);
      expect(result.affiliations).toHaveLength(0);
      expect(result.footnotes).toHaveLength(0);
    });
  });

  describe('renderAffiliationText', () => {
    it('full components renders correctly', () => {
      const inst = createInstitution('inst1', {
        division: 'Division of X',
        department: 'Department of Y',
        faculty: 'Faculty of Z',
      });

      const text = renderAffiliationText(inst, defaultConfig);

      expect(text).toContain('Division of X');
      expect(text).toContain('Department of Y');
      expect(text).toContain('Faculty of Z');
      expect(text).toContain('The University of Hong Kong');
      expect(text).toContain('Hong Kong SAR, China');
    });

    it('with toggles off: faculty field omitted', () => {
      const inst = createInstitution('inst1', {
        department: 'Department of Y',
        faculty: 'Faculty of Z',
      });

      const config = { ...defaultConfig, includeFaculty: false };
      const text = renderAffiliationText(inst, config);

      expect(text).toContain('Department of Y');
      expect(text).not.toContain('Faculty of Z');
    });

    it('HK suffix: same institution renders differently with different hkSuffix', () => {
      const inst = createInstitution('inst1');

      const text1 = renderAffiliationText(inst, { ...defaultConfig, hkSuffix: 'Hong Kong' });
      const text2 = renderAffiliationText(inst, { ...defaultConfig, hkSuffix: 'Hong Kong SAR, China' });

      expect(text1).toContain('Hong Kong');
      expect(text1).not.toContain('SAR');
      expect(text2).toContain('Hong Kong SAR, China');
    });
  });
});
