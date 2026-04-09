import type { HkuDictionary, HkuUnit } from '@/types';

/** Levenshtein distance between two strings (lowercased compare). */
export function levenshtein(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
}

/** Best fuzzy match when substring search returns nothing. */
export function findClosestHkuUnit(
  dict: HkuDictionary,
  query: string
): { unit: HkuUnit; label: string; distance: number } | null {
  const q = query.trim();
  if (q.length < 2) return null;
  const maxDist = Math.min(5, Math.max(2, Math.floor(q.length * 0.45)));
  let best: { unit: HkuUnit; label: string; distance: number } | null = null;
  for (const unit of dict.units) {
    const candidates: string[] = [unit.name, ...unit.aliases];
    for (const label of candidates) {
      const d = levenshtein(q, label);
      if (d <= maxDist && (!best || d < best.distance)) {
        best = { unit, label, distance: d };
      }
    }
  }
  return best;
}

/** Character-level diff for highlighting insertions/edits vs query (uses `suggestion` casing for display). */
export function diffQueryToSuggestion(
  query: string,
  suggestion: string
): { text: string; added: boolean }[] {
  const a = query.toLowerCase();
  const b = suggestion.toLowerCase();
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  type Op = { t: 'm' | 'i' | 'd'; j?: number };
  const ops: Op[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ t: 'm', j: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] <= dp[i - 1][j])) {
      ops.push({ t: 'i', j: j - 1 });
      j--;
    } else if (i > 0) {
      ops.push({ t: 'd' });
      i--;
    } else {
      ops.push({ t: 'i', j: j - 1 });
      j--;
    }
  }
  ops.reverse();
  const segments: { text: string; added: boolean }[] = [];
  let buf = '';
  let added = false;
  const flush = () => {
    if (buf) {
      segments.push({ text: buf, added });
      buf = '';
    }
  };
  for (const op of ops) {
    if (op.t === 'm' && op.j !== undefined) {
      const ch = suggestion[op.j];
      if (added) {
        flush();
        added = false;
      }
      buf += ch;
    } else if (op.t === 'i' && op.j !== undefined) {
      const ch = suggestion[op.j];
      if (!added && buf) flush();
      added = true;
      buf += ch;
    }
  }
  flush();
  return segments.length ? segments : [{ text: suggestion, added: true }];
}
