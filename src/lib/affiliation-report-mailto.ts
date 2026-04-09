/** Override in `.env`: `VITE_AFFILIATION_REPORT_EMAIL=you@example.com` */
export const AFFILIATION_REPORT_EMAIL =
  (import.meta.env.VITE_AFFILIATION_REPORT_EMAIL as string | undefined) || 'jksdfmeister@gmail.com';

export function buildAffiliationReportMailto(params: {
  affiliationName: string;
  department: string;
  faculty: string;
  searchKeywords?: string;
}): string {
  const subject = encodeURIComponent('Affiliation builder — report / missing unit');
  const lines = [
    `Affiliation name: ${params.affiliationName.trim()}`,
    `Department: ${params.department.trim() || '(not provided)'}`,
    `Faculty: ${params.faculty.trim() || '(not provided)'}`,
  ];
  if (params.searchKeywords?.trim()) {
    lines.push('', `HKU search keywords: ${params.searchKeywords.trim()}`);
  }
  const body = encodeURIComponent(lines.join('\n'));
  return `mailto:${AFFILIATION_REPORT_EMAIL}?subject=${subject}&body=${body}`;
}
