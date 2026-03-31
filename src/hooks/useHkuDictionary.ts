import { useRef, useMemo } from 'react';
import type { HkuDictionary, HkuUnit, Institution } from '@/types';
import { loadDictionary, searchUnits, buildInstitutionFromUnit } from '@/lib/hku-dictionary';

export function useHkuDictionary() {
  const dictRef = useRef<HkuDictionary | null>(null);
  if (!dictRef.current) {
    dictRef.current = loadDictionary();
  }
  const dict = dictRef.current;

  const search = useMemo(
    () => (query: string): HkuUnit[] => searchUnits(dict, query),
    [dict]
  );

  const buildInstitution = useMemo(
    () => (unitId: string, hkSuffix: string): Institution =>
      buildInstitutionFromUnit(dict, unitId, hkSuffix),
    [dict]
  );

  return { dict, search, buildInstitution };
}
