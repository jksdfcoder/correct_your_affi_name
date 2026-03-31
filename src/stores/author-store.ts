import { create } from 'zustand';
import type { Author, Institution, TemplateConfig, NumberedOutput } from '@/types';
import { computeNumbering } from '@/lib/numbering-engine';

interface AuthorStoreState {
  authors: Author[];
  institutions: Map<string, Institution>;
  templateConfig: TemplateConfig;
}

interface AuthorStoreActions {
  addAuthor: (name: string) => Author;
  removeAuthor: (id: string) => void;
  updateAuthor: (id: string, updates: Partial<Author>) => void;
  reorderAuthors: (fromIndex: number, toIndex: number) => void;
  addAffiliation: (authorId: string, institution: Institution) => void;
  removeAffiliation: (authorId: string, institutionId: string) => void;
  setTemplateConfig: (config: Partial<TemplateConfig>) => void;
  getNumberedOutput: () => NumberedOutput;
}

type AuthorStore = AuthorStoreState & AuthorStoreActions;

const defaultTemplateConfig: TemplateConfig = {
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
};

/**
 * Generate a unique ID for authors
 */
function generateId(): string {
  return `author-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useAuthorStore = create<AuthorStore>((set, get) => ({
  authors: [],
  institutions: new Map(),
  templateConfig: defaultTemplateConfig,

  addAuthor: (name: string): Author => {
    const id = generateId();
    const order = get().authors.length;
    const newAuthor: Author = {
      id,
      name,
      affiliationIds: [],
      isCorresponding: false,
      isCoFirst: false,
      order,
    };

    set(state => ({
      authors: [...state.authors, newAuthor],
    }));

    return newAuthor;
  },

  removeAuthor: (id: string): void => {
    set(state => {
      const newAuthors = state.authors
        .filter(a => a.id !== id)
        .map((a, index) => ({ ...a, order: index }));

      // Find institutions that are no longer referenced
      const usedInstitutionIds = new Set<string>();
      for (const author of newAuthors) {
        for (const instId of author.affiliationIds) {
          usedInstitutionIds.add(instId);
        }
      }

      const newInstitutions = new Map(state.institutions);
      for (const instId of state.institutions.keys()) {
        if (!usedInstitutionIds.has(instId)) {
          newInstitutions.delete(instId);
        }
      }

      return {
        authors: newAuthors,
        institutions: newInstitutions,
      };
    });
  },

  updateAuthor: (id: string, updates: Partial<Author>): void => {
    set(state => ({
      authors: state.authors.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  reorderAuthors: (fromIndex: number, toIndex: number): void => {
    set(state => {
      const authors = [...state.authors];
      const [movedAuthor] = authors.splice(fromIndex, 1);
      authors.splice(toIndex, 0, movedAuthor);

      // Update order field for all authors
      const reorderedAuthors = authors.map((a, index) => ({ ...a, order: index }));

      return { authors: reorderedAuthors };
    });
  },

  addAffiliation: (authorId: string, institution: Institution): void => {
    set(state => {
      const newInstitutions = new Map(state.institutions);
      if (!newInstitutions.has(institution.id)) {
        newInstitutions.set(institution.id, institution);
      }

      const newAuthors = state.authors.map(a => {
        if (a.id === authorId && !a.affiliationIds.includes(institution.id)) {
          return {
            ...a,
            affiliationIds: [...a.affiliationIds, institution.id],
          };
        }
        return a;
      });

      return {
        authors: newAuthors,
        institutions: newInstitutions,
      };
    });
  },

  removeAffiliation: (authorId: string, institutionId: string): void => {
    set(state => {
      const newAuthors = state.authors.map(a => {
        if (a.id === authorId) {
          return {
            ...a,
            affiliationIds: a.affiliationIds.filter(id => id !== institutionId),
          };
        }
        return a;
      });

      // Check if any author still uses this institution
      const isStillUsed = newAuthors.some(a => a.affiliationIds.includes(institutionId));

      const newInstitutions = new Map(state.institutions);
      if (!isStillUsed) {
        newInstitutions.delete(institutionId);
      }

      return {
        authors: newAuthors,
        institutions: newInstitutions,
      };
    });
  },

  setTemplateConfig: (config: Partial<TemplateConfig>): void => {
    set(state => ({
      templateConfig: { ...state.templateConfig, ...config },
    }));
  },

  getNumberedOutput: (): NumberedOutput => {
    const state = get();
    return computeNumbering(state.authors, state.institutions, state.templateConfig);
  },
}));
