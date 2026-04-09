import { create } from 'zustand';
import type { Author, Institution, TemplateConfig, NumberedOutput } from '@/types';
import { computeNumbering } from '@/lib/numbering-engine';

interface AuthorStoreState {
  authors: Author[];
  institutions: Map<string, Institution>;
  /** User-defined order for the affiliation pool (numbering follows this for referenced items). */
  institutionOrder: string[];
  templateConfig: TemplateConfig;
}

interface AuthorStoreActions {
  addAuthor: (name: string) => Author;
  removeAuthor: (id: string) => void;
  updateAuthor: (id: string, updates: Partial<Author>) => void;
  reorderAuthors: (fromIndex: number, toIndex: number) => void;
  /** Add institution to pool only (no author link). */
  addInstitution: (institution: Institution) => void;
  /** Remove from pool, order, and all authors. */
  removeInstitution: (institutionId: string) => void;
  reorderInstitutions: (fromIndex: number, toIndex: number) => void;
  /** Link existing pool institution to author. */
  assignAffiliation: (authorId: string, institutionId: string) => void;
  addAffiliation: (authorId: string, institution: Institution) => void;
  /** Unlink from author only; institution stays in pool. */
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

function generateId(): string {
  return `author-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useAuthorStore = create<AuthorStore>((set, get) => ({
  authors: [],
  institutions: new Map(),
  institutionOrder: [],
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

      return { authors: newAuthors };
    });
  },

  updateAuthor: (id: string, updates: Partial<Author>): void => {
    set(state => ({
      authors: state.authors.map(a => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  reorderAuthors: (fromIndex: number, toIndex: number): void => {
    set(state => {
      const authors = [...state.authors];
      const [movedAuthor] = authors.splice(fromIndex, 1);
      authors.splice(toIndex, 0, movedAuthor);

      const reorderedAuthors = authors.map((a, index) => ({ ...a, order: index }));

      return { authors: reorderedAuthors };
    });
  },

  addInstitution: (institution: Institution): void => {
    set(state => {
      const newInstitutions = new Map(state.institutions);
      let newOrder = [...state.institutionOrder];

      if (!newInstitutions.has(institution.id)) {
        newInstitutions.set(institution.id, institution);
        if (!newOrder.includes(institution.id)) {
          newOrder.push(institution.id);
        }
      } else if (!newOrder.includes(institution.id)) {
        newOrder.push(institution.id);
      }

      return { institutions: newInstitutions, institutionOrder: newOrder };
    });
  },

  removeInstitution: (institutionId: string): void => {
    set(state => {
      const newInstitutions = new Map(state.institutions);
      newInstitutions.delete(institutionId);
      const newOrder = state.institutionOrder.filter(id => id !== institutionId);
      const newAuthors = state.authors.map(a => ({
        ...a,
        affiliationIds: a.affiliationIds.filter(id => id !== institutionId),
      }));

      return {
        institutions: newInstitutions,
        institutionOrder: newOrder,
        authors: newAuthors,
      };
    });
  },

  reorderInstitutions: (fromIndex: number, toIndex: number): void => {
    set(state => {
      const order = [...state.institutionOrder];
      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);
      return { institutionOrder: order };
    });
  },

  assignAffiliation: (authorId: string, institutionId: string): void => {
    set(state => {
      if (!state.institutions.has(institutionId)) return state;
      const newAuthors = state.authors.map(a => {
        if (a.id !== authorId) return a;
        if (a.affiliationIds.includes(institutionId)) return a;
        return {
          ...a,
          affiliationIds: [...a.affiliationIds, institutionId],
        };
      });
      return { authors: newAuthors };
    });
  },

  addAffiliation: (authorId: string, institution: Institution): void => {
    get().addInstitution(institution);
    get().assignAffiliation(authorId, institution.id);
  },

  removeAffiliation: (authorId: string, institutionId: string): void => {
    set(state => ({
      authors: state.authors.map(a => {
        if (a.id !== authorId) return a;
        return {
          ...a,
          affiliationIds: a.affiliationIds.filter(id => id !== institutionId),
        };
      }),
    }));
  },

  setTemplateConfig: (config: Partial<TemplateConfig>): void => {
    set(state => ({
      templateConfig: { ...state.templateConfig, ...config },
    }));
  },

  getNumberedOutput: (): NumberedOutput => {
    const state = get();
    return computeNumbering(
      state.authors,
      state.institutions,
      state.templateConfig,
      state.institutionOrder
    );
  },
}));
