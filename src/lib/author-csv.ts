import type { Author, Institution } from '@/types';

function escapeCsvField(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function institutionToLine(inst: Institution): string {
  const c = inst.components;
  const parts = [
    c.division,
    c.department,
    c.faculty,
    c.lab,
    c.centre,
    c.hospital,
    c.institute,
    c.school,
    c.university,
    c.city,
    c.country,
  ].filter(Boolean);
  return parts.join(', ');
}

/** CSV: one row per author with name, email flags, and pipe-separated affiliation lines */
export function buildAuthorsAffiliationsCsv(
  authors: Author[],
  institutions: Map<string, Institution>
): string {
  const header = [
    'author_order',
    'author_name',
    'email',
    'is_corresponding',
    'is_co_first',
    'affiliation_count',
    'affiliations_pipe_separated',
  ];
  const rows = authors
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((a, i) => {
      const affLines = a.affiliationIds
        .map(id => institutions.get(id))
        .filter(Boolean)
        .map(inst => institutionToLine(inst!));
      return [
        String(i + 1),
        a.name,
        a.email ?? '',
        a.isCorresponding ? 'yes' : 'no',
        a.isCoFirst ? 'yes' : 'no',
        String(affLines.length),
        affLines.join(' | '),
      ].map(escapeCsvField);
    });
  return [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
