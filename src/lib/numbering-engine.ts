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
  const sep = config.separator + ' ';

  const pushTrim = (s: string | undefined) => {
    const t = s?.trim();
    if (t) parts.push(t);
  };

  // Order: division → lab/hospital → department → faculty → centre/institute/school → university → location.
  // Department before faculty; centre/institute/school after, so HKU dictionary rows typed as "institute"
  // (e.g. Li Ka Shing Faculty of Medicine) still render after the department (e.g. Department of Surgery).
  if (c.division) pushTrim(c.division);
  if (config.includeLab && c.lab) pushTrim(c.lab);
  if (config.includeHospital && c.hospital) pushTrim(c.hospital);
  if (config.includeDepartment && c.department) pushTrim(c.department);
  if (config.includeFaculty && c.faculty) pushTrim(c.faculty);
  if (c.centre) pushTrim(c.centre);
  if (c.institute) pushTrim(c.institute);
  if (c.school) pushTrim(c.school);
  pushTrim(c.university);

  // Hong Kong: do not emit city then hkSuffix — that duplicates "Hong Kong" (e.g. "…, Hong Kong, Hong Kong SAR, China").
  // The configured hkSuffix is the full location tail (e.g. "Pok Fu Lam, Hong Kong SAR, China", "Hong Kong, China").
  if (c.city?.trim() === 'Hong Kong') {
    pushTrim(config.hkSuffix);
  } else {
    pushTrim(c.city);
    pushTrim(c.country);
  }

  if (config.includeZipcode && c.zipcode?.trim()) {
    const z = c.zipcode.trim();
    // Before last segment when there is a location tail; otherwise append (e.g. DIY with university only).
    if (parts.length >= 2) {
      parts.splice(parts.length - 1, 0, z);
    } else {
      parts.push(z);
    }
  }

  return parts.join(sep);
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
