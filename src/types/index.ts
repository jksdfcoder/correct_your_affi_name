// === HKU Dictionary Types ===
export type UnitType = 'faculty' | 'department' | 'division' | 'lab' | 'centre' | 'hospital' | 'institute' | 'school' | 'programme';

export interface HkuUnit {
  id: string;
  type: UnitType;
  name: string;
  aliases: string[];
  parent_id: string | null;
}

export interface HkuUniversity {
  name: string;
  short_name: string;
  city: string;
  country: string;
  ror_id: string;
}

export interface HkuDictionary {
  version: string;
  university: HkuUniversity;
  units: HkuUnit[];
}

// === Institution Types (unified for HKU + external) ===
export interface Institution {
  id: string;
  source: 'hku' | 'ror' | 'custom';
  components: InstitutionComponents;
  displayName?: string;
}

export interface InstitutionComponents {
  division?: string;
  department?: string;
  faculty?: string;
  lab?: string;
  centre?: string;
  hospital?: string;
  institute?: string;
  school?: string;
  university: string;
  city: string;
  country: string;
  zipcode?: string;
}

// === Author Types ===
export interface Author {
  id: string;
  name: string;
  email?: string;
  affiliationIds: string[];
  isCorresponding: boolean;
  isCoFirst: boolean;
  order: number;
}

// === Template Types ===
export type SuperscriptStyle = 'numeric' | 'alphabetic' | 'symbol';
export type TemplatePreset = 'nature' | 'ieee' | 'apa' | 'custom';

export interface TemplateConfig {
  preset: TemplatePreset;
  superscriptStyle: SuperscriptStyle;
  includeFaculty: boolean;
  includeDepartment: boolean;
  includeZipcode: boolean;
  includeLab: boolean;
  includeHospital: boolean;
  separator: ',' | '.';
  hkSuffix: 'Hong Kong' | 'Hong Kong, China' | 'Hong Kong SAR, China';
  coFirstSymbol: string;
  correspondingSymbol: string;
  coFirstFootnote: string;
}

// === Numbering Engine Output ===
export interface NumberedOutput {
  authors: NumberedAuthor[];
  affiliations: NumberedAffiliation[];
  footnotes: Footnote[];
}

export interface NumberedAuthor {
  author: Author;
  superscripts: string[];
  symbols: string[];
}

export interface NumberedAffiliation {
  number: string;
  institution: Institution;
  displayText: string;
}

export interface Footnote {
  symbol: string;
  text: string;
}

// === ROR API Types ===
export interface RorSearchResult {
  id: string;
  name: string;
  aliases: string[];
  country: { country_name: string; country_code: string };
  addresses: Array<{ city: string; state: string | null; country_geonames_id: number }>;
  types: string[];
}

// === App State ===
export interface AppState {
  authors: Author[];
  institutions: Map<string, Institution>;
  templateConfig: TemplateConfig;
}
