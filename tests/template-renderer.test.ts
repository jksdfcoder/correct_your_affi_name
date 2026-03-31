import { describe, it, expect } from 'vitest';
import {
  renderToHtml,
  renderToPlainText,
  applyPreset,
  renderAuthorLine,
  renderAffiliationList,
} from '@/lib/template-renderer';
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

// Helper to create test data
function createTestOutput(): NumberedOutput {
  const author1: Author = {
    id: 'a1',
    name: 'San Zhang',
    email: 'san@hku.hk',
    affiliationIds: ['hku:med', 'hku:skl'],
    isCorresponding: true,
    isCoFirst: false,
    order: 0,
  };

  const author2: Author = {
    id: 'a2',
    name: 'Si Li',
    affiliationIds: ['tsinghua:cs'],
    isCorresponding: false,
    isCoFirst: true,
    order: 1,
  };

  const inst1: Institution = {
    id: 'hku:med',
    source: 'hku',
    components: {
      department: 'Department of Medicine',
      faculty: 'Faculty of Medicine',
      university: 'The University of Hong Kong',
      city: 'Hong Kong',
      country: 'Hong Kong',
    },
  };

  const inst2: Institution = {
    id: 'hku:skl',
    source: 'hku',
    components: {
      lab: 'State Key Laboratory',
      university: 'The University of Hong Kong',
      city: 'Hong Kong',
      country: 'Hong Kong',
    },
  };

  const inst3: Institution = {
    id: 'tsinghua:cs',
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
    { number: '1', institution: inst1, displayText: 'Department of Medicine, Faculty of Medicine, The University of Hong Kong, Hong Kong, Hong Kong SAR, China' },
    { number: '2', institution: inst2, displayText: 'State Key Laboratory, The University of Hong Kong, Hong Kong, Hong Kong SAR, China' },
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

describe('template-renderer', () => {
  describe('renderToHtml', () => {
    it('renders basic output with correct superscripts', () => {
      const output = createTestOutput();
      const html = renderToHtml(output, defaultConfig);

      expect(html).toContain('<sup>1,2,*</sup>');
      expect(html).toContain('<sup>3,†</sup>');
      expect(html).toContain('San Zhang');
      expect(html).toContain('Si Li');
    });

    it('renders affiliations with superscript numbers', () => {
      const output = createTestOutput();
      const html = renderToHtml(output, defaultConfig);

      expect(html).toContain('<sup>1</sup>');
      expect(html).toContain('<sup>2</sup>');
      expect(html).toContain('<sup>3</sup>');
      expect(html).toContain('Department of Medicine');
      expect(html).toContain('State Key Laboratory');
      expect(html).toContain('Tsinghua University');
    });

    it('renders footnotes with symbols', () => {
      const output = createTestOutput();
      const html = renderToHtml(output, defaultConfig);

      expect(html).toContain('<sup>†</sup>');
      expect(html).toContain('These authors contributed equally');
      expect(html).toContain('<sup>*</sup>');
      expect(html).toContain('Corresponding author');
    });

    it('contains HK suffix in affiliation output', () => {
      const output = createTestOutput();
      const html = renderToHtml(output, defaultConfig);

      expect(html).toContain('Hong Kong SAR, China');
    });

    it('returns empty paragraphs for empty output', () => {
      const emptyOutput: NumberedOutput = {
        authors: [],
        affiliations: [],
        footnotes: [],
      };
      const html = renderToHtml(emptyOutput, defaultConfig);

      expect(html).toBe('<p></p>');
    });
  });

  describe('renderToPlainText', () => {
    it('renders without HTML tags', () => {
      const output = createTestOutput();
      const text = renderToPlainText(output, defaultConfig);

      expect(text).not.toContain('<sup>');
      expect(text).not.toContain('</sup>');
      expect(text).not.toContain('<p>');
      expect(text).toContain('San Zhang');
      expect(text).toContain('Si Li');
    });

    it('uses bracketed numbers for superscripts', () => {
      const output = createTestOutput();
      const text = renderToPlainText(output, defaultConfig);

      // Author superscripts should be [1,2,*] format
      expect(text).toMatch(/San Zhang\s*\[1,2,\*\]/);
      expect(text).toMatch(/Si Li\s*\[3,†\]/);
    });

    it('renders affiliations with bracketed numbers', () => {
      const output = createTestOutput();
      const text = renderToPlainText(output, defaultConfig);

      expect(text).toContain('[1]');
      expect(text).toContain('[2]');
      expect(text).toContain('[3]');
    });
  });

  describe('applyPreset', () => {
    it('returns correct values for nature preset', () => {
      const config = applyPreset('nature');

      expect(config.superscriptStyle).toBe('numeric');
      expect(config.includeFaculty).toBe(true);
      expect(config.includeDepartment).toBe(true);
      expect(config.separator).toBe(',');
    });

    it('returns correct values for ieee preset', () => {
      const config = applyPreset('ieee');

      expect(config.superscriptStyle).toBe('numeric');
      expect(config.includeFaculty).toBe(false);
      expect(config.separator).toBe('.');
    });

    it('returns correct values for apa preset', () => {
      const config = applyPreset('apa');

      expect(config.superscriptStyle).toBe('numeric');
      expect(config.includeFaculty).toBe(true);
      expect(config.includeDepartment).toBe(true);
    });

    it('returns empty object for custom preset', () => {
      const config = applyPreset('custom');

      expect(Object.keys(config)).toHaveLength(0);
    });
  });

  describe('renderAuthorLine', () => {
    it('renders author names with superscripts separated by commas', () => {
      const output = createTestOutput();
      const line = renderAuthorLine(output.authors, defaultConfig);

      expect(line).toContain('San Zhang<sup>1,2,*</sup>');
      expect(line).toContain('Si Li<sup>3,†</sup>');
      expect(line).toContain(', '); // Comma separator between authors
    });

    it('handles single author', () => {
      const singleAuthor: NumberedAuthor[] = [{
        author: {
          id: 'a1',
          name: 'Single Author',
          affiliationIds: ['inst1'],
          isCorresponding: false,
          isCoFirst: false,
          order: 0,
        },
        superscripts: ['1'],
        symbols: [],
      }];

      const line = renderAuthorLine(singleAuthor, defaultConfig);

      expect(line).toBe('Single Author<sup>1</sup>');
    });

    it('handles author with no superscripts', () => {
      const noSuper: NumberedAuthor[] = [{
        author: {
          id: 'a1',
          name: 'No Affiliation',
          affiliationIds: [],
          isCorresponding: false,
          isCoFirst: false,
          order: 0,
        },
        superscripts: [],
        symbols: [],
      }];

      const line = renderAuthorLine(noSuper, defaultConfig);

      expect(line).toBe('No Affiliation');
    });
  });

  describe('renderAffiliationList', () => {
    it('renders numbered affiliations as HTML paragraphs', () => {
      const output = createTestOutput();
      const list = renderAffiliationList(output.affiliations, defaultConfig);

      expect(list).toContain('<p><sup>1</sup>');
      expect(list).toContain('<p><sup>2</sup>');
      expect(list).toContain('<p><sup>3</sup>');
      expect(list).toContain('</p>');
    });

    it('includes display text for each affiliation', () => {
      const output = createTestOutput();
      const list = renderAffiliationList(output.affiliations, defaultConfig);

      expect(list).toContain('Department of Medicine');
      expect(list).toContain('State Key Laboratory');
      expect(list).toContain('Tsinghua University');
    });

    it('returns empty string for empty affiliations', () => {
      const list = renderAffiliationList([], defaultConfig);

      expect(list).toBe('');
    });
  });
});
