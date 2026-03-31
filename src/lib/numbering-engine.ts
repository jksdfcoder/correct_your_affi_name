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
  parts.push(c.city);
  
  // Apply hkSuffix for country
  if (c.city === 'Hong Kong') {
    parts.push(config.hkSuffix);
  } else {
    parts.push(c.country);
  }

  if (config.includeZipcode && c.zipcode) {
    // Insert zipcode before country
    parts.splice(parts.length - 1, 0, c.zipcode);
  }

  return parts.join(config.separator + ' ');
}

/**
 * Core numbering algorithm: compute numbered output from authors and institutions
 */
export function computeNumbering(
  authors: Author[],
  institutions: Map<string, Institution>,
  config: TemplateConfig
): NumberedOutput {
  if (authors.length === 0) {
    return { authors: [], affiliations: [], footnotes: [] };
  }

  // Step 1: Collect unique institution IDs in order of first appearance
  const institutionOrder: string[] = [];
  const institutionToNumber = new Map<string, string>();

  for (const author of authors) {
    for (const instId of author.affiliationIds) {
      if (!institutionToNumber.has(instId)) {
        const superscript = getNextSuperscript(institutionOrder.length, config.superscriptStyle);
        institutionToNumber.set(instId, superscript);
        institutionOrder.push(instId);
      }
    }
  }

  // Step 2: Build numbered authors
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

  // Step 3: Build numbered affiliations
  const numberedAffiliations: NumberedAffiliation[] = institutionOrder.map(instId => {
    const institution = institutions.get(instId);
    if (!institution) {
      throw new Error(`Institution not found: ${instId}`);
    }
    const number = institutionToNumber.get(instId)!;
    const displayText = renderAffiliationText(institution, config);
    return { number, institution, displayText };
  });

  // Step 4: Build footnotes
  const footnotes: Footnote[] = [];
  
  // Co-first author footnote (only if at least one co-first author exists)
  const hasCoFirst = authors.some(a => a.isCoFirst);
  if (hasCoFirst) {
    footnotes.push({
      symbol: config.coFirstSymbol,
      text: config.coFirstFootnote,
    });
  }

  // Corresponding author footnotes
  const correspondingAuthors = authors.filter(a => a.isCorresponding);
  for (const author of correspondingAuthors) {
    footnotes.push({
      symbol: config.correspondingSymbol,
      text: `Corresponding author. Email: ${author.email || 'N/A'}`,
    });
  }

  return { authors: numberedAuthors, affiliations: numberedAffiliations, footnotes };
}
