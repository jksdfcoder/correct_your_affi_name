import type { HkuDictionary, HkuUnit, Institution, UnitType } from '@/types';
import dictionaryData from '@/data/hku-dictionary.json';

export function loadDictionary(): HkuDictionary {
  return dictionaryData as HkuDictionary;
}

export function getUnitById(dict: HkuDictionary, id: string): HkuUnit | undefined {
  return dict.units.find(u => u.id === id);
}

export function getChildren(dict: HkuDictionary, parentId: string): HkuUnit[] {
  return dict.units.filter(u => u.parent_id === parentId);
}

export function getAncestors(dict: HkuDictionary, unitId: string): HkuUnit[] {
  const ancestors: HkuUnit[] = [];
  let current = getUnitById(dict, unitId);
  const visited = new Set<string>();
  while (current && current.parent_id) {
    if (visited.has(current.id)) break; // cycle guard
    visited.add(current.id);
    const parent = getUnitById(dict, current.parent_id);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }
  return ancestors;
}

export function searchUnits(dict: HkuDictionary, query: string): HkuUnit[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const scored = dict.units.map(unit => {
    const name = unit.name.toLowerCase();
    let score = 0;
    if (name === q) score = 4;
    else if (name.startsWith(q)) score = 3;
    else if (name.includes(q)) score = 2;
    else if (unit.aliases.some(a => a.toLowerCase().includes(q))) score = 1;
    return { unit, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(s => s.unit);
}

export function buildInstitutionFromUnit(
  dict: HkuDictionary,
  unitId: string,
  hkSuffix: string
): Institution {
  const unit = getUnitById(dict, unitId);
  if (!unit) throw new Error(`Unit not found: ${unitId}`);
  
  const ancestors = getAncestors(dict, unitId);
  const allUnits = [unit, ...ancestors]; // from leaf to root

  const components: Institution['components'] = {
    university: dict.university.name,
    city: 'Hong Kong',
    country: hkSuffix,
  };

  for (const u of allUnits) {
    switch (u.type) {
      case 'division': components.division = u.name; break;
      case 'department': components.department = u.name; break;
      case 'faculty': components.faculty = u.name; break;
      case 'lab': components.lab = u.name; break;
      case 'centre': components.centre = u.name; break;
      case 'hospital': components.hospital = u.name; break;
      case 'institute': components.institute = u.name; break;
      case 'school': components.school = u.name; break;
    }
  }

  return {
    id: `hku:${unitId}`,
    source: 'hku',
    components,
  };
}

export function getUnitsByType(dict: HkuDictionary, type: UnitType): HkuUnit[] {
  return dict.units.filter(u => u.type === type);
}
