import type {
  NumberedOutput,
  NumberedAuthor,
  NumberedAffiliation,
  TemplateConfig,
  TemplatePreset,
  Footnote,
} from '@/types';

/**
 * Render the author line with superscripts (HTML format)
 */
export function renderAuthorLine(
  numberedAuthors: NumberedAuthor[],
  _config: TemplateConfig
): string {
  if (numberedAuthors.length === 0) return '';

  return numberedAuthors
    .map(({ author, superscripts, symbols }) => {
      const allSuperscripts = [...superscripts, ...symbols];
      if (allSuperscripts.length === 0) {
        return author.name;
      }
      return `${author.name}<sup>${allSuperscripts.join(',')}</sup>`;
    })
    .join(', ');
}

/**
 * Render the numbered affiliation list (HTML format)
 */
export function renderAffiliationList(
  numberedAffiliations: NumberedAffiliation[],
  _config: TemplateConfig
): string {
  if (numberedAffiliations.length === 0) return '';

  return numberedAffiliations
    .map(({ number, displayText }) => `<p><sup>${number}</sup> ${displayText}</p>`)
    .join('\n');
}

/**
 * Render footnotes (HTML format)
 */
function renderFootnotes(footnotes: Footnote[]): string {
  if (footnotes.length === 0) return '';

  return footnotes
    .map(({ symbol, text }) => `<p><sup>${symbol}</sup> ${text}</p>`)
    .join('\n');
}

/**
 * Render full output to HTML with <sup> tags for superscripts
 */
export function renderToHtml(
  output: NumberedOutput,
  config: TemplateConfig
): string {
  const affiliationList = renderAffiliationList(output.affiliations, config);
  const footnoteList = renderFootnotes(output.footnotes);

  if (output.authors.length === 0) {
    if (!affiliationList) return '<p></p>';
    return affiliationList + (footnoteList ? `\n${footnoteList}` : '');
  }

  const authorLine = `<p>${renderAuthorLine(output.authors, config)}</p>`;
  const parts = [authorLine];
  if (affiliationList) parts.push(affiliationList);
  if (footnoteList) parts.push(footnoteList);

  return parts.join('\n');
}

/**
 * Render the author line for plain text (bracketed superscripts)
 */
function renderAuthorLinePlainText(
  numberedAuthors: NumberedAuthor[]
): string {
  if (numberedAuthors.length === 0) return '';

  return numberedAuthors
    .map(({ author, superscripts, symbols }) => {
      const allSuperscripts = [...superscripts, ...symbols];
      if (allSuperscripts.length === 0) {
        return author.name;
      }
      return `${author.name} [${allSuperscripts.join(',')}]`;
    })
    .join(', ');
}

/**
 * Render the numbered affiliation list for plain text
 */
function renderAffiliationListPlainText(
  numberedAffiliations: NumberedAffiliation[]
): string {
  if (numberedAffiliations.length === 0) return '';

  return numberedAffiliations
    .map(({ number, displayText }) => `[${number}] ${displayText}`)
    .join('\n');
}

/**
 * Render footnotes for plain text
 */
function renderFootnotesPlainText(footnotes: Footnote[]): string {
  if (footnotes.length === 0) return '';

  return footnotes
    .map(({ symbol, text }) => `[${symbol}] ${text}`)
    .join('\n');
}

/**
 * Render full output to plain text (no HTML tags)
 */
export function renderToPlainText(
  output: NumberedOutput,
  _config: TemplateConfig
): string {
  const affiliationList = renderAffiliationListPlainText(output.affiliations);
  const footnoteList = renderFootnotesPlainText(output.footnotes);

  if (output.authors.length === 0) {
    if (!affiliationList) return '';
    const parts = [affiliationList];
    if (footnoteList) parts.push(footnoteList);
    return parts.join('\n\n');
  }

  const authorLine = renderAuthorLinePlainText(output.authors);
  const parts = [authorLine];
  if (affiliationList) parts.push(affiliationList);
  if (footnoteList) parts.push(footnoteList);

  return parts.join('\n\n');
}

/**
 * Apply preset configuration overrides
 */
export function applyPreset(preset: TemplatePreset): Partial<TemplateConfig> {
  switch (preset) {
    case 'nature':
      return {
        superscriptStyle: 'numeric',
        includeFaculty: true,
        includeDepartment: true,
        includeZipcode: false,
        includeLab: true,
        includeHospital: true,
        separator: ',',
      };

    case 'ieee':
      return {
        superscriptStyle: 'numeric',
        includeFaculty: false,
        includeDepartment: true,
        includeZipcode: false,
        includeLab: true,
        includeHospital: false,
        separator: '.',
      };

    case 'apa':
      return {
        superscriptStyle: 'numeric',
        includeFaculty: true,
        includeDepartment: true,
        includeZipcode: false,
        includeLab: true,
        includeHospital: true,
        separator: ',',
      };

    case 'custom':
    default:
      return {};
  }
}
