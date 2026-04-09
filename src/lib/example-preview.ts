import type { Author, Institution, NumberedOutput, TemplateConfig } from '@/types';
import { getNextSuperscript, renderAffiliationText } from '@/lib/numbering-engine';

const EXAMPLE_HKU_ID = 'example:hku';
const EXAMPLE_COLLAB_ID = 'example:collab';

const EXAMPLE_INSTITUTIONS: Map<string, Institution> = new Map([
  [
    EXAMPLE_HKU_ID,
    {
      id: EXAMPLE_HKU_ID,
      source: 'custom',
      components: {
        department: 'Department of Example',
        university: 'The University of Hong Kong',
        city: 'Hong Kong',
        country: 'China',
      },
    },
  ],
  [
    EXAMPLE_COLLAB_ID,
    {
      id: EXAMPLE_COLLAB_ID,
      source: 'custom',
      components: {
        university: 'Collaborating Institute',
        city: 'City',
        country: 'Country',
      },
    },
  ],
]);

const EXAMPLE_AUTHORS: Author[] = [
  {
    id: 'example:jane',
    name: 'Jane Doe',
    affiliationIds: [EXAMPLE_HKU_ID],
    order: 0,
    isCorresponding: false,
    isCoFirst: false,
  },
  {
    id: 'example:john',
    name: 'John Smith',
    affiliationIds: [EXAMPLE_HKU_ID, EXAMPLE_COLLAB_ID],
    order: 1,
    isCorresponding: false,
    isCoFirst: false,
  },
];

const EXAMPLE_ORDER = [EXAMPLE_HKU_ID, EXAMPLE_COLLAB_ID] as const;

/**
 * Synthetic numbered output used when the affiliation pool is empty so the
 * placeholder preview respects the same template options as real output.
 */
export function getExampleNumberedOutput(config: TemplateConfig): NumberedOutput {
  const institutionToNumber = new Map<string, string>();
  EXAMPLE_ORDER.forEach((id, i) => {
    institutionToNumber.set(id, getNextSuperscript(i, config.superscriptStyle));
  });

  const authors = EXAMPLE_AUTHORS.map((author) => ({
    author,
    superscripts: author.affiliationIds
      .map((id) => institutionToNumber.get(id))
      .filter((s): s is string => s !== undefined),
    symbols: [] as string[],
  }));

  const affiliations = EXAMPLE_ORDER.map((id) => {
    const institution = EXAMPLE_INSTITUTIONS.get(id)!;
    return {
      number: institutionToNumber.get(id)!,
      institution,
      displayText: renderAffiliationText(institution, config),
    };
  });

  return { authors, affiliations, footnotes: [] };
}
