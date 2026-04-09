import type {
  Author,
  Institution,
  TemplateConfig,
  NumberedOutput,
  NumberedAuthor,
  NumberedAffiliation,
  Footnote,
  SuperscriptStyle,
} from '@/types';

/**
 * Get the next superscript based on index and style
 */
export function getNextSuperscript(index: number, style: SuperscriptStyle): string {
  switch (style) {
    case 'numeric':
      return String(index + 1);
    case 'alphabetic': {
      // a-z, then aa, ab, etc.
      if (index < 26) {
        return String.fromCharCode(97 + index); // 'a' = 97
      }
      const first = Math.floor(index / 26) - 1;
      const second = index % 26;
      return String.fromCharCode(97 + first) + String.fromCharCode(97 + second);
    }
    case 'symbol': {
      const symbols = ['*', '†', '‡', '§', '¶', '‖', '**', '††', '‡‡'];
      return symbols[index % symbols.length];
    }
    default:
      return String(index + 1);
  }
}

/**
 * Render affiliation text from institution components based on template config
 */
export function renderAffiliationText(
  institution: Institution,
  config: TemplateConfig
): string {
  const parts: string[] = [];
  const c = institution.components;

  // Order: division/lab/hospital/centre/institute → department → faculty → university → city → country
  if (c.division) parts.push(c.division);
  if (config.includeLab && c.lab) parts.push(c.lab);
  if (config.includeHospital && c.hospital) parts.push(c.hospital);
  if (c.centre) parts.push(c.centre);
  if (c.institute) parts.push(c.institute);
  if (c.school) parts.push(c.school);
  if (config.includeDepartment && c.department) parts.push(c.department);
  if (config.includeFaculty && c.faculty) parts.push(c.faculty);
  parts.push(c.university);

  // Hong Kong: do not emit city then hkSuffix — that duplicates "Hong Kong" (e.g. "…, Hong Kong, Hong Kong SAR, China").
  // The configured hkSuffix is the full location tail (e.g. "Pok Fu Lam, Hong Kong SAR, China", "Hong Kong, China").
  if (c.city === 'Hong Kong') {
    parts.push(config.hkSuffix);
  } else {
    parts.push(c.city);
    parts.push(c.country);
  }

  if (config.includeZipcode && c.zipcode) {
    // Insert zipcode before country
    parts.splice(parts.length - 1, 0, c.zipcode);
  }

  return parts.join(config.separator + ' ');
}

/**
 * Build ordered list of referenced institution IDs.
 * When globalInstitutionOrder is provided, referenced IDs follow that order first; any stragglers follow author walk order.
 */
function resolveReferencedInstitutionOrder(
  authors: Author[],
  globalInstitutionOrder: string[] | undefined
): string[] {
  const referenced = new Set<string>();
  for (const author of authors) {
    for (const id of author.affiliationIds) {
      referenced.add(id);
    }
  }

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  if (globalInstitutionOrder?.length) {
    for (const id of globalInstitutionOrder) {
      if (referenced.has(id) && !seen.has(id)) {
        orderedIds.push(id);
        seen.add(id);
      }
    }
  }

  for (const author of authors) {
    for (const id of author.affiliationIds) {
      if (referenced.has(id) && !seen.has(id)) {
        orderedIds.push(id);
        seen.add(id);
      }
    }
  }

  return orderedIds;
}

/**
 * Core numbering algorithm: compute numbered output from authors and institutions.
 * When globalInstitutionOrder is set (affiliation pool order), numbering follows it for referenced affiliations only.
 * When no authors but globalInstitutionOrder has entries, returns numbered affiliation list only (preview / pool).
 */
export function computeNumbering(
  authors: Author[],
  institutions: Map<string, Institution>,
  config: TemplateConfig,
  globalInstitutionOrder?: string[]
): NumberedOutput {
  if (authors.length === 0) {
    if (!globalInstitutionOrder?.length) {
      return { authors: [], affiliations: [], footnotes: [] };
    }
    const numberedAffiliations: NumberedAffiliation[] = [];
    globalInstitutionOrder.forEach((instId, idx) => {
      const institution = institutions.get(instId);
      if (!institution) return;
      const number = getNextSuperscript(idx, config.superscriptStyle);
      numberedAffiliations.push({
        number,
        institution,
        displayText: renderAffiliationText(institution, config),
      });
    });
    return { authors: [], affiliations: numberedAffiliations, footnotes: [] };
  }

  const institutionOrder = resolveReferencedInstitutionOrder(authors, globalInstitutionOrder);
  const institutionToNumber = new Map<string, string>();

  institutionOrder.forEach((instId, i) => {
    institutionToNumber.set(instId, getNextSuperscript(i, config.superscriptStyle));
  });

  const numberedAuthors: NumberedAuthor[] = authors.map(author => {
    const superscripts = author.affiliationIds
      .map(id => institutionToNumber.get(id))
      .filter((s): s is string => s !== undefined);

    const symbols: string[] = [];
    if (author.isCoFirst) {
      symbols.push(config.coFirstSymbol);
    }
    if (author.isCorresponding) {
      symbols.push(config.correspondingSymbol);
    }

    return { author, superscripts, symbols };
  });

  const numberedAffiliations: NumberedAffiliation[] = institutionOrder.map(instId => {
    const institution = institutions.get(instId);
    if (!institution) {
      throw new Error(`Institution not found: ${instId}`);
    }
    const number = institutionToNumber.get(instId)!;
    const displayText = renderAffiliationText(institution, config);
    return { number, institution, displayText };
  });

  const footnotes: Footnote[] = [];

  const hasCoFirst = authors.some(a => a.isCoFirst);
  if (hasCoFirst) {
    footnotes.push({
      symbol: config.coFirstSymbol,
      text: config.coFirstFootnote,
    });
  }

  const correspondingAuthors = authors.filter(a => a.isCorresponding);
  for (const author of correspondingAuthors) {
    footnotes.push({
      symbol: config.correspondingSymbol,
      text: `Corresponding author. Email: ${author.email || 'N/A'}`,
    });
  }

  return { authors: numberedAuthors, affiliations: numberedAffiliations, footnotes };
}
