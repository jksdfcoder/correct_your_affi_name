import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthorStore } from '@/stores/author-store';
import type { Institution } from '@/types';

describe('author-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthorStore.setState({
      authors: [],
      institutions: new Map(),
      institutionOrder: [],
      templateConfig: {
        preset: 'nature',
        superscriptStyle: 'numeric',
        includeFaculty: true,
        includeDepartment: true,
        includeZipcode: false,
        includeLab: true,
        includeHospital: true,
        separator: ',',
        hkSuffix: 'Hong Kong SAR, China',
        coFirstSymbol: '†',
        correspondingSymbol: '*',
        coFirstFootnote: 'These authors contributed equally to this work.',
      },
    });
  });

  describe('addAuthor', () => {
    it('adds author with correct defaults', () => {
      const store = useAuthorStore.getState();
      const author = store.addAuthor('San Zhang');

      expect(author.name).toBe('San Zhang');
      expect(author.id).toBeDefined();
      expect(author.affiliationIds).toEqual([]);
      expect(author.isCorresponding).toBe(false);
      expect(author.isCoFirst).toBe(false);
      expect(author.order).toBe(0);
    });

    it('assigns sequential order to multiple authors', () => {
      const store = useAuthorStore.getState();
      store.addAuthor('Author 1');
      store.addAuthor('Author 2');
      const author3 = store.addAuthor('Author 3');

      expect(author3.order).toBe(2);
      expect(useAuthorStore.getState().authors).toHaveLength(3);
    });

    it('generates unique IDs', () => {
      const store = useAuthorStore.getState();
      const author1 = store.addAuthor('Author 1');
      const author2 = store.addAuthor('Author 2');

      expect(author1.id).not.toBe(author2.id);
    });
  });

  describe('removeAuthor', () => {
    it('removes author and recomputes orders', () => {
      const store = useAuthorStore.getState();
      const author1 = store.addAuthor('Author 1');
      store.addAuthor('Author 2');
      store.addAuthor('Author 3');

      store.removeAuthor(author1.id);

      const state = useAuthorStore.getState();
      expect(state.authors).toHaveLength(2);
      expect(state.authors[0].order).toBe(0);
      expect(state.authors[1].order).toBe(1);
    });
  });

  describe('updateAuthor', () => {
    it('updates author fields', () => {
      const store = useAuthorStore.getState();
      const author = store.addAuthor('San Zhang');

      store.updateAuthor(author.id, { 
        name: 'San Zhang Updated',
        email: 'san@hku.hk',
        isCorresponding: true,
      });

      const updated = useAuthorStore.getState().authors[0];
      expect(updated.name).toBe('San Zhang Updated');
      expect(updated.email).toBe('san@hku.hk');
      expect(updated.isCorresponding).toBe(true);
    });
  });

  describe('reorderAuthors', () => {
    it('moves author from index 0 to index 2', () => {
      const store = useAuthorStore.getState();
      store.addAuthor('Author A'); // order 0
      store.addAuthor('Author B'); // order 1
      store.addAuthor('Author C'); // order 2

      store.reorderAuthors(0, 2);

      const state = useAuthorStore.getState();
      expect(state.authors[0].name).toBe('Author B');
      expect(state.authors[0].order).toBe(0);
      expect(state.authors[1].name).toBe('Author C');
      expect(state.authors[1].order).toBe(1);
      expect(state.authors[2].name).toBe('Author A');
      expect(state.authors[2].order).toBe(2);
    });

    it('moves author from index 2 to index 0', () => {
      const store = useAuthorStore.getState();
      store.addAuthor('Author A');
      store.addAuthor('Author B');
      store.addAuthor('Author C');

      store.reorderAuthors(2, 0);

      const state = useAuthorStore.getState();
      expect(state.authors[0].name).toBe('Author C');
      expect(state.authors[1].name).toBe('Author A');
      expect(state.authors[2].name).toBe('Author B');
    });
  });

  describe('addAffiliation', () => {
    it('adds institution to map and to author affiliationIds', () => {
      const store = useAuthorStore.getState();
      const author = store.addAuthor('San Zhang');

      const institution: Institution = {
        id: 'hku:fac-medicine',
        source: 'hku',
        components: {
          faculty: 'Faculty of Medicine',
          university: 'The University of Hong Kong',
          city: 'Hong Kong',
          country: 'Hong Kong',
        },
      };

      store.addAffiliation(author.id, institution);

      const state = useAuthorStore.getState();
      expect(state.authors[0].affiliationIds).toContain('hku:fac-medicine');
      expect(state.institutions.get('hku:fac-medicine')).toEqual(institution);
    });

    it('does not duplicate institution in map when shared', () => {
      const store = useAuthorStore.getState();
      const author1 = store.addAuthor('Author 1');
      const author2 = store.addAuthor('Author 2');

      const institution: Institution = {
        id: 'hku:fac-medicine',
        source: 'hku',
        components: {
          faculty: 'Faculty of Medicine',
          university: 'The University of Hong Kong',
          city: 'Hong Kong',
          country: 'Hong Kong',
        },
      };

      store.addAffiliation(author1.id, institution);
      store.addAffiliation(author2.id, institution);

      const state = useAuthorStore.getState();
      expect(state.institutions.size).toBe(1);
      expect(state.authors[0].affiliationIds).toContain('hku:fac-medicine');
      expect(state.authors[1].affiliationIds).toContain('hku:fac-medicine');
    });
  });

  describe('removeAffiliation', () => {
    it('removes from author and cleans up orphaned institution', () => {
      const store = useAuthorStore.getState();
      const author = store.addAuthor('San Zhang');

      const institution: Institution = {
        id: 'hku:fac-medicine',
        source: 'hku',
        components: {
          faculty: 'Faculty of Medicine',
          university: 'The University of Hong Kong',
          city: 'Hong Kong',
          country: 'Hong Kong',
        },
      };

      store.addAffiliation(author.id, institution);
      store.removeAffiliation(author.id, 'hku:fac-medicine');

      const state = useAuthorStore.getState();
      expect(state.authors[0].affiliationIds).not.toContain('hku:fac-medicine');
      // Pool model: institution remains until removeInstitution
      expect(state.institutions.has('hku:fac-medicine')).toBe(true);
      expect(state.institutionOrder).toContain('hku:fac-medicine');
    });

    it('keeps shared institution when removing from one author', () => {
      const store = useAuthorStore.getState();
      const author1 = store.addAuthor('Author 1');
      const author2 = store.addAuthor('Author 2');

      const institution: Institution = {
        id: 'hku:fac-medicine',
        source: 'hku',
        components: {
          faculty: 'Faculty of Medicine',
          university: 'The University of Hong Kong',
          city: 'Hong Kong',
          country: 'Hong Kong',
        },
      };

      store.addAffiliation(author1.id, institution);
      store.addAffiliation(author2.id, institution);
      store.removeAffiliation(author1.id, 'hku:fac-medicine');

      const state = useAuthorStore.getState();
      expect(state.authors[0].affiliationIds).not.toContain('hku:fac-medicine');
      expect(state.authors[1].affiliationIds).toContain('hku:fac-medicine');
      // Institution should still be in map because author2 still uses it
      expect(state.institutions.has('hku:fac-medicine')).toBe(true);
    });
  });

  describe('setTemplateConfig', () => {
    it('merges partial config correctly', () => {
      const store = useAuthorStore.getState();

      store.setTemplateConfig({ 
        preset: 'ieee',
        includeFaculty: false,
      });

      const state = useAuthorStore.getState();
      expect(state.templateConfig.preset).toBe('ieee');
      expect(state.templateConfig.includeFaculty).toBe(false);
      // Other values should remain
      expect(state.templateConfig.superscriptStyle).toBe('numeric');
      expect(state.templateConfig.hkSuffix).toBe('Hong Kong SAR, China');
    });
  });

  describe('getNumberedOutput', () => {
    it('returns correctly structured NumberedOutput', () => {
      const store = useAuthorStore.getState();
      const author = store.addAuthor('San Zhang');
      store.updateAuthor(author.id, { isCorresponding: true, email: 'san@hku.hk' });

      const institution: Institution = {
        id: 'hku:fac-medicine',
        source: 'hku',
        components: {
          faculty: 'Faculty of Medicine',
          university: 'The University of Hong Kong',
          city: 'Hong Kong',
          country: 'Hong Kong',
        },
      };

      store.addAffiliation(author.id, institution);

      const output = store.getNumberedOutput();

      expect(output.authors).toHaveLength(1);
      expect(output.authors[0].superscripts).toEqual(['1']);
      expect(output.authors[0].symbols).toContain('*');
      expect(output.affiliations).toHaveLength(1);
      expect(output.affiliations[0].number).toBe('1');
      expect(output.footnotes.length).toBeGreaterThan(0);
    });

    it('returns empty output when no authors and empty pool', () => {
      const store = useAuthorStore.getState();
      const output = store.getNumberedOutput();

      expect(output.authors).toEqual([]);
      expect(output.affiliations).toEqual([]);
      expect(output.footnotes).toEqual([]);
    });

    it('returns numbered affiliations only when pool has items but no authors', () => {
      const store = useAuthorStore.getState();
      const institution: Institution = {
        id: 'hku:fac-medicine',
        source: 'hku',
        components: {
          faculty: 'Faculty of Medicine',
          university: 'The University of Hong Kong',
          city: 'Hong Kong',
          country: 'Hong Kong',
        },
      };
      store.addInstitution(institution);
      const output = store.getNumberedOutput();
      expect(output.authors).toHaveLength(0);
      expect(output.affiliations).toHaveLength(1);
      expect(output.affiliations[0].number).toBe('1');
    });
  });

  describe('addInstitution / assignAffiliation / removeInstitution', () => {
    it('addInstitution appends to order', () => {
      const store = useAuthorStore.getState();
      const inst: Institution = {
        id: 'i1',
        source: 'custom',
        components: { university: 'U', city: 'C', country: 'K' },
      };
      store.addInstitution(inst);
      expect(useAuthorStore.getState().institutionOrder).toEqual(['i1']);
      expect(useAuthorStore.getState().institutions.get('i1')).toEqual(inst);
    });

    it('assignAffiliation links existing pool item', () => {
      const store = useAuthorStore.getState();
      const author = store.addAuthor('A');
      const inst: Institution = {
        id: 'i1',
        source: 'custom',
        components: { university: 'U', city: 'C', country: 'K' },
      };
      store.addInstitution(inst);
      store.assignAffiliation(author.id, 'i1');
      expect(useAuthorStore.getState().authors[0].affiliationIds).toContain('i1');
    });

    it('removeInstitution clears pool and author links', () => {
      const store = useAuthorStore.getState();
      const author = store.addAuthor('A');
      const inst: Institution = {
        id: 'i1',
        source: 'custom',
        components: { university: 'U', city: 'C', country: 'K' },
      };
      store.addInstitution(inst);
      store.assignAffiliation(author.id, 'i1');
      store.removeInstitution('i1');
      const state = useAuthorStore.getState();
      expect(state.institutions.has('i1')).toBe(false);
      expect(state.institutionOrder).not.toContain('i1');
      expect(state.authors[0].affiliationIds).toEqual([]);
    });
  });
});
