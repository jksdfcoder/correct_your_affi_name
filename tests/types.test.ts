import { describe, expect, it } from 'vitest';
import type {
  Author,
  Institution,
  InstitutionComponents,
  TemplateConfig,
  HkuUnit,
  HkuDictionary,
  RorSearchResult,
  NumberedOutput,
} from '@/types';

describe('TypeScript type definitions', () => {
  it('Author type can be instantiated with required fields', () => {
    const author: Author = {
      id: 'test-id',
      name: 'John Doe',
      affiliationIds: ['hku:fac-medicine'],
      isCorresponding: false,
      isCoFirst: false,
      order: 0,
    };
    expect(author.id).toBe('test-id');
    expect(author.name).toBe('John Doe');
    expect(author.affiliationIds).toHaveLength(1);
  });

  it('Institution type accepts all component fields', () => {
    const components: InstitutionComponents = {
      division: 'Division of Cardiology',
      department: 'Department of Medicine',
      faculty: 'Li Ka Shing Faculty of Medicine',
      university: 'The University of Hong Kong',
      city: 'Hong Kong',
      country: 'Hong Kong SAR, China',
    };
    const institution: Institution = {
      id: 'hku:div-cardiology',
      source: 'hku',
      components,
    };
    expect(institution.source).toBe('hku');
    expect(institution.components.university).toBe('The University of Hong Kong');
  });

  it('TemplateConfig has expected shape with nature preset defaults', () => {
    const config: TemplateConfig = {
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
    expect(config.preset).toBe('nature');
    expect(config.hkSuffix).toBe('Hong Kong SAR, China');
    expect(config.coFirstSymbol).toBe('†');
  });

  it('HkuUnit type accepts all unit types', () => {
    const unit: HkuUnit = {
      id: 'fac-medicine',
      type: 'faculty',
      name: 'Li Ka Shing Faculty of Medicine',
      aliases: ['HKUMed'],
      parent_id: null,
    };
    expect(unit.type).toBe('faculty');
    expect(unit.parent_id).toBeNull();
  });

  it('NumberedOutput has correct structure', () => {
    const output: NumberedOutput = {
      authors: [],
      affiliations: [],
      footnotes: [],
    };
    expect(output.authors).toHaveLength(0);
    expect(output.affiliations).toHaveLength(0);
    expect(output.footnotes).toHaveLength(0);
  });

  it('HkuDictionary and RorSearchResult compile', () => {
    const hkuDictionary: HkuDictionary = {
      version: '1.0.0',
      university: {
        name: 'The University of Hong Kong',
        short_name: 'HKU',
        city: 'Hong Kong',
        country: 'Hong Kong SAR, China',
        ror_id: 'https://ror.org/02zhqgq86',
      },
      units: [],
    };

    const rorResult: RorSearchResult = {
      id: 'https://ror.org/02zhqgq86',
      name: 'The University of Hong Kong',
      aliases: ['HKU'],
      country: { country_name: 'Hong Kong', country_code: 'HK' },
      addresses: [{ city: 'Hong Kong', state: null, country_geonames_id: 1819730 }],
      types: ['education'],
    };

    expect(hkuDictionary.version).toBe('1.0.0');
    expect(rorResult.country.country_code).toBe('HK');
  });
});
