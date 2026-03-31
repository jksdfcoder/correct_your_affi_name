import { describe, it, expect } from 'vitest';
import {
  loadDictionary, getUnitById, getChildren, getAncestors,
  searchUnits, buildInstitutionFromUnit, getUnitsByType
} from '@/lib/hku-dictionary';

describe('HKU Dictionary', () => {
  const dict = loadDictionary();

  it('loadDictionary returns valid dictionary with units', () => {
    expect(dict.units.length).toBeGreaterThan(0);
    expect(dict.university.name).toBe('The University of Hong Kong');
  });

  it('getUnitById returns correct unit', () => {
    const unit = getUnitById(dict, 'fac-medicine');
    expect(unit).toBeDefined();
    expect(unit?.name).toBe('Li Ka Shing Faculty of Medicine');
  });

  it('getUnitById returns undefined for unknown id', () => {
    expect(getUnitById(dict, 'nonexistent')).toBeUndefined();
  });

  it('getChildren returns direct children of a parent', () => {
    const children = getChildren(dict, 'fac-medicine');
    expect(children.length).toBeGreaterThan(0);
    expect(children.every(c => c.parent_id === 'fac-medicine')).toBe(true);
  });

  it('getAncestors for division returns [department, faculty] in order', () => {
    const ancestors = getAncestors(dict, 'div-cardiology');
    expect(ancestors.length).toBeGreaterThanOrEqual(1);
    // ancestors should be ordered from immediate parent to root
    expect(ancestors[0].id).toBe('dept-medicine');
  });

  it('getAncestors for faculty returns empty array', () => {
    const ancestors = getAncestors(dict, 'fac-medicine');
    expect(ancestors).toHaveLength(0);
  });

  it('searchUnits finds by partial name (case insensitive)', () => {
    const results = searchUnits(dict, 'cardio');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(u => u.name.toLowerCase().includes('cardio'))).toBe(true);
  });

  it('searchUnits finds by alias (QMH)', () => {
    const results = searchUnits(dict, 'QMH');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Queen Mary Hospital');
  });

  it('searchUnits returns empty array for empty query', () => {
    expect(searchUnits(dict, '')).toHaveLength(0);
  });

  it('buildInstitutionFromUnit for division assembles full hierarchy', () => {
    const inst = buildInstitutionFromUnit(dict, 'div-cardiology', 'Hong Kong SAR, China');
    expect(inst.components.university).toBe('The University of Hong Kong');
    expect(inst.components.division).toBe('Division of Cardiology');
    expect(inst.components.department).toBe('Department of Medicine');
    expect(inst.source).toBe('hku');
    expect(inst.id).toBe('hku:div-cardiology');
  });

  it('buildInstitutionFromUnit hkSuffix flows into country', () => {
    const inst1 = buildInstitutionFromUnit(dict, 'fac-medicine', 'Hong Kong');
    const inst2 = buildInstitutionFromUnit(dict, 'fac-medicine', 'Hong Kong SAR, China');
    expect(inst1.components.country).toBe('Hong Kong');
    expect(inst2.components.country).toBe('Hong Kong SAR, China');
  });

  it('getUnitsByType returns only units of specified type', () => {
    const labs = getUnitsByType(dict, 'lab');
    expect(labs.length).toBeGreaterThan(0);
    expect(labs.every(u => u.type === 'lab')).toBe(true);
  });
});
