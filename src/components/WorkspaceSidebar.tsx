import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type Ref,
} from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Trash2,
  GripVertical,
  Building2,
  Users,
  Search,
  Download,
  PanelLeftClose,
  PanelLeft,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useAuthorStore } from '@/stores/author-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { buildAuthorsAffiliationsCsv, downloadCsv } from '@/lib/author-csv';
import { getNextSuperscript } from '@/lib/numbering-engine';
import type { Author, Institution, SuperscriptStyle } from '@/types';
import { toast } from 'sonner';

function affKey(instId: string) {
  return `aff:${encodeURIComponent(instId)}`;
}
function parseAffKey(key: string): string | null {
  if (!key.startsWith('aff:')) return null;
  return decodeURIComponent(key.slice(4));
}
function authKey(authorId: string) {
  return `auth:${encodeURIComponent(authorId)}`;
}
function parseAuthKey(key: string): string | null {
  if (!key.startsWith('auth:')) return null;
  return decodeURIComponent(key.slice(5));
}

function focusAffiliationBuilderPrimaryInput() {
  document.getElementById('affiliation-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  requestAnimationFrame(() => {
    document.getElementById('affiliation-builder-primary-input')?.focus();
  });
}

/** Prefer same-list hits so affiliation reorder is not stolen by author rows (esp. dragging up). */
const workspaceCollisionDetection: CollisionDetection = (args) => {
  const activeId = String(args.active.id);
  const draggingAff = activeId.startsWith('aff:');
  const draggingAuth = activeId.startsWith('auth:');

  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    if (draggingAff) {
      const affHit = pointerHits.find((h) => String(h.id).startsWith('aff:'));
      const authHit = pointerHits.find((h) => String(h.id).startsWith('auth:'));
      if (affHit) return [affHit];
      if (authHit) return [authHit];
    }
    if (draggingAuth) {
      const authHit = pointerHits.find((h) => String(h.id).startsWith('auth:'));
      if (authHit) return [authHit];
    }
  }

  const centerHits = closestCenter(args);
  if (!centerHits.length) return centerHits;

  if (draggingAff) {
    const affOnly = centerHits.filter((h) => String(h.id).startsWith('aff:'));
    if (affOnly.length) return affOnly;
    return centerHits.filter((h) => String(h.id).startsWith('auth:'));
  }

  if (draggingAuth) {
    const authOnly = centerHits.filter((h) => String(h.id).startsWith('auth:'));
    if (authOnly.length) return authOnly;
  }

  return centerHits;
};

function stopDragPropagation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function shortInstitutionLabel(inst: Institution): string {
  const c = inst.components;
  if (inst.source === 'hku') {
    return (
      c.department ||
      c.faculty ||
      c.lab ||
      c.centre ||
      c.school ||
      c.institute ||
      c.university ||
      'HKU'
    );
  }
  return c.university;
}

function SortableAffiliationRow({
  id,
  label,
  numberLabel,
  onRemove,
  index,
  count,
  onMoveUp,
  onMoveDown,
}: {
  id: string;
  label: string;
  numberLabel: string;
  onRemove: () => void;
  index: number;
  count: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: affKey(id),
    data: { type: 'affiliation', institutionId: id },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex cursor-grab touch-none items-stretch gap-0.5 rounded-xl border border-border/60 bg-card/80 active:cursor-grabbing',
        isDragging && 'z-10'
      )}
      {...attributes}
      tabIndex={-1}
      {...listeners}
    >
      <span
        className="flex min-h-11 min-w-10 shrink-0 items-center justify-center text-muted-foreground pointer-events-none select-none"
        aria-hidden
      >
        <GripVertical className="h-4 w-4 shrink-0" />
      </span>
      <div
        className="flex flex-col justify-center gap-0.5 py-1"
        role="group"
        aria-label="Reorder affiliation in list"
        onPointerDown={stopDragPropagation}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label="Move affiliation up in list"
          disabled={index <= 0}
          onClick={onMoveUp}
        >
          <ChevronUp className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label="Move affiliation down in list"
          disabled={index >= count - 1}
          onClick={onMoveDown}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-1">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
          {numberLabel}
        </span>
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        onPointerDown={stopDragPropagation}
        aria-label="Remove affiliation from pool"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function SortableAuthorRow({
  author,
  institutionOrder,
  superscriptStyle,
  onRemove,
  onUpdate,
  assignOptions,
  poolHasAffiliations,
  authorIndex,
  authorCount,
  onMoveAuthorUp,
  onMoveAuthorDown,
  onUnlinkAffiliation,
  onAssignAffiliation,
}: {
  author: Author;
  institutionOrder: string[];
  superscriptStyle: SuperscriptStyle;
  onRemove: () => void;
  onUpdate: (u: Partial<Author>) => void;
  assignOptions: { id: string; label: string }[];
  poolHasAffiliations: boolean;
  authorIndex: number;
  authorCount: number;
  onMoveAuthorUp: () => void;
  onMoveAuthorDown: () => void;
  onUnlinkAffiliation: (institutionId: string) => void;
  onAssignAffiliation: (institutionId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: authKey(author.id),
    data: { type: 'author', authorId: author.id },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [name, setName] = useState(author.name);
  const [email, setEmail] = useState(author.email || '');

  useEffect(() => {
    setName(author.name);
  }, [author.name]);
  useEffect(() => {
    setEmail(author.email || '');
  }, [author.email]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab touch-none rounded-xl border border-border/60 bg-card/80 p-2 active:cursor-grabbing',
        isDragging && 'z-10 ring-2 ring-primary/30'
      )}
      {...attributes}
      tabIndex={-1}
      {...listeners}
    >
      <div className="flex items-start gap-0.5">
        <span
          className="mt-1 flex min-h-11 min-w-10 shrink-0 items-center justify-center text-muted-foreground pointer-events-none select-none"
          aria-hidden
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <div
          className="mt-1 flex flex-col gap-0.5"
          role="group"
          aria-label="Reorder author in list"
          onPointerDown={stopDragPropagation}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            aria-label="Move author up in list"
            disabled={authorIndex <= 0}
            onClick={onMoveAuthorUp}
          >
            <ChevronUp className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            aria-label="Move author down in list"
            disabled={authorIndex >= authorCount - 1}
            onClick={onMoveAuthorDown}
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div
          className="min-w-0 flex-1 space-y-2"
          onPointerDown={stopDragPropagation}
        >
          <div className="flex items-center gap-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim() && name !== author.name) onUpdate({ name: name.trim() });
              }}
              className="h-8 flex-1 border-transparent px-1 text-sm font-medium hover:border-border"
              aria-label="Author name"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              aria-label="Remove author"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {author.affiliationIds.map((instId) => {
              const idx = institutionOrder.indexOf(instId);
              const num = idx >= 0 ? getNextSuperscript(idx, superscriptStyle) : '?';
              return (
                <Badge
                  key={instId}
                  variant="secondary"
                  className="gap-0.5 bg-primary/10 pl-1.5 pr-0.5 text-xs text-primary"
                >
                  {num}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-primary/20"
                    onClick={() => onUnlinkAffiliation(instId)}
                    aria-label="Unlink affiliation"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              );
            })}
            {author.affiliationIds.length === 0 && (
              <span className="text-[11px] text-muted-foreground">Drop affiliation here</span>
            )}
          </div>
          {poolHasAffiliations ? (
            assignOptions.length > 0 ? (
              <div className="flex items-center gap-2">
                <Label className="sr-only" htmlFor={`assign-${author.id}`}>
                  Link affiliation from pool
                </Label>
                <Select
                  key={`${author.id}-${author.affiliationIds.join(',')}`}
                  onValueChange={(instId) => {
                    onAssignAffiliation(instId);
                    toast.success('Affiliation linked');
                  }}
                >
                  <SelectTrigger id={`assign-${author.id}`} className="h-9 min-h-11 text-xs">
                    <SelectValue placeholder="+ Link affiliation" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                All pool affiliations linked to this author.
              </p>
            )
          ) : null}
          <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-2">
            <div className="flex items-center gap-1.5">
              <Checkbox
                id={`cf-${author.id}`}
                checked={author.isCoFirst}
                onCheckedChange={(c) => onUpdate({ isCoFirst: c === true })}
              />
              <Label htmlFor={`cf-${author.id}`} className="text-xs">
                Co-first
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id={`corr-${author.id}`}
                checked={author.isCorresponding}
                onCheckedChange={(c) => onUpdate({ isCorresponding: c === true })}
              />
              <Label htmlFor={`corr-${author.id}`} className="text-xs">
                Corresponding
              </Label>
            </div>
          </div>
          {author.isCorresponding && (
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => onUpdate({ email })}
              placeholder="Email"
              className="h-8 text-xs"
            />
          )}
        </div>
      </div>
    </div>
  );
}

type WorkspaceSidebarProps = {
  className?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  selectedAuthorId: string | null;
  onSelectAuthor: (id: string) => void;
  /** Sidebar entry for main Tab cycle: Add when expanded, Expand when collapsed */
  workspaceCycleEntryRef?: Ref<HTMLButtonElement>;
  addAuthorButtonRef?: Ref<HTMLButtonElement>;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
  } else {
    (ref as { current: T | null }).current = value;
  }
}

export function WorkspaceSidebar({
  className,
  collapsed,
  onToggleCollapsed,
  selectedAuthorId,
  onSelectAuthor,
  workspaceCycleEntryRef,
  addAuthorButtonRef,
}: WorkspaceSidebarProps) {
  const authors = useAuthorStore((s) => s.authors);
  const institutions = useAuthorStore((s) => s.institutions);
  const institutionOrder = useAuthorStore((s) => s.institutionOrder);
  const templateConfig = useAuthorStore((s) => s.templateConfig);
  const addAuthor = useAuthorStore((s) => s.addAuthor);
  const removeAuthor = useAuthorStore((s) => s.removeAuthor);
  const updateAuthor = useAuthorStore((s) => s.updateAuthor);
  const reorderAuthors = useAuthorStore((s) => s.reorderAuthors);
  const reorderInstitutions = useAuthorStore((s) => s.reorderInstitutions);
  const removeInstitution = useAuthorStore((s) => s.removeInstitution);
  const assignAffiliation = useAuthorStore((s) => s.assignAffiliation);
  const removeAffiliation = useAuthorStore((s) => s.removeAffiliation);

  const [q, setQ] = useState('');
  const [activeDrag, setActiveDrag] = useState<{ kind: 'aff' | 'auth'; id: string } | null>(null);
  const [topFrac, setTopFrac] = useState(0.42);
  const [resizing, setResizing] = useState(false);
  const expandSidebarBtnRef = useRef<HTMLButtonElement | null>(null) as MutableRefObject<
    HTMLButtonElement | null
  >;
  const collapseSidebarBtnRef = useRef<HTMLButtonElement | null>(null) as MutableRefObject<
    HTMLButtonElement | null
  >;

  const filteredAuthors = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return authors;
    return authors.filter((a) => a.name.toLowerCase().includes(t));
  }, [authors, q]);

  const affSortableIds = useMemo(
    () => institutionOrder.map((id) => affKey(id)),
    [institutionOrder]
  );
  const authSortableIds = useMemo(
    () => filteredAuthors.map((a) => authKey(a.id)),
    [filteredAuthors]
  );

  const assignOptions = useMemo(
    () =>
      institutionOrder
        .map((id, idx) => {
          const inst = institutions.get(id);
          if (!inst) return null;
          return {
            id,
            label: `${getNextSuperscript(idx, templateConfig.superscriptStyle)} — ${shortInstitutionLabel(inst)}`,
          };
        })
        .filter((o): o is { id: string; label: string } => o !== null),
    [institutionOrder, institutions, templateConfig.superscriptStyle]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const onDragStart = useCallback((e: DragStartEvent) => {
    const k = String(e.active.id);
    const aff = parseAffKey(k);
    if (aff) {
      setActiveDrag({ kind: 'aff', id: aff });
      return;
    }
    const au = parseAuthKey(k);
    if (au) setActiveDrag({ kind: 'auth', id: au });
  }, []);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      setActiveDrag(null);
      if (!over) return;

      const activeStr = String(active.id);
      const overStr = String(over.id);

      const affActive = parseAffKey(activeStr);
      const authOver = parseAuthKey(overStr);
      if (affActive && authOver) {
        assignAffiliation(authOver, affActive);
        toast.success('Affiliation assigned');
        onSelectAuthor(authOver);
        return;
      }

      const affOver = parseAffKey(overStr);
      if (affActive && affOver && affActive !== affOver) {
        const oldIndex = institutionOrder.indexOf(affActive);
        const newIndex = institutionOrder.indexOf(affOver);
        if (oldIndex >= 0 && newIndex >= 0) {
          reorderInstitutions(oldIndex, newIndex);
        }
        return;
      }

      const authActive = parseAuthKey(activeStr);
      if (authActive && authOver) {
        const visOld = filteredAuthors.findIndex((a) => a.id === authActive);
        const visNew = filteredAuthors.findIndex((a) => a.id === authOver);
        if (visOld >= 0 && visNew >= 0 && visOld !== visNew) {
          const fullOld = authors.findIndex((a) => a.id === authActive);
          const fullNew = authors.findIndex((a) => a.id === authOver);
          if (fullOld >= 0 && fullNew >= 0) {
            reorderAuthors(fullOld, fullNew);
          }
        }
      }
    },
    [
      assignAffiliation,
      authors,
      filteredAuthors,
      institutionOrder,
      onSelectAuthor,
      reorderAuthors,
      reorderInstitutions,
    ]
  );

  const onDragCancel = useCallback(() => setActiveDrag(null), []);

  useEffect(() => {
    const clear = () => setActiveDrag(null);
    window.addEventListener('blur', clear);
    window.addEventListener('pointercancel', clear);
    return () => {
      window.removeEventListener('blur', clear);
      window.removeEventListener('pointercancel', clear);
    };
  }, []);

  const exportCsv = () => {
    if (authors.length === 0) {
      toast.message('Add at least one author to export CSV');
      return;
    }
    const csv = buildAuthorsAffiliationsCsv(authors, institutions);
    downloadCsv(`authors-affiliations-${Date.now()}.csv`, csv);
    toast.success('CSV downloaded');
  };

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setResizing(true);
      const startY = e.clientY;
      const startFrac = topFrac;
      const sidebar = (e.target as HTMLElement).closest('[data-workspace-sidebar]') as HTMLElement;
      const h = sidebar?.getBoundingClientRect().height ?? 400;

      const move = (ev: MouseEvent) => {
        const dy = ev.clientY - startY;
        const next = Math.min(0.72, Math.max(0.22, startFrac + dy / h));
        setTopFrac(next);
      };
      const up = () => {
        setResizing(false);
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    },
    [topFrac]
  );

  if (collapsed) {
    return (
      <div
        className={cn(
          'flex w-12 shrink-0 flex-col items-center border-r border-border/80 bg-card/80 py-3',
          className
        )}
      >
        <Button
          ref={(node) => {
            expandSidebarBtnRef.current = node;
            assignRef(workspaceCycleEntryRef, node);
          }}
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => {
            onToggleCollapsed();
            requestAnimationFrame(() => collapseSidebarBtnRef.current?.focus());
          }}
          aria-label="Expand workspace sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <aside
      data-workspace-sidebar
      className={cn(
        /* min-w-0: flex default min-width:auto can exceed 320px when list rows have wide min-content */
        'flex min-w-0 w-[min(100%,320px)] max-w-[320px] shrink-0 flex-col border-r border-border/80 bg-card/80',
        resizing && 'select-none',
        className
      )}
    >
      <div className="flex items-center justify-between gap-1 border-b border-border/80 px-2 py-2">
        <span className="truncate pl-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Workspace
        </span>
        <Button
          ref={collapseSidebarBtnRef}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={() => {
            onToggleCollapsed();
            requestAnimationFrame(() => expandSidebarBtnRef.current?.focus());
          }}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <p className="border-b border-border/40 px-3 py-1.5 text-[11px] text-muted-foreground">
        {institutionOrder.length} affiliation{institutionOrder.length === 1 ? '' : 's'} ·{' '}
        {authors.length} author{authors.length === 1 ? '' : 's'}
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={workspaceCollisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="flex min-h-[120px] flex-col overflow-hidden border-b border-border/40"
            style={{ flex: topFrac }}
          >
            <div className="flex items-center gap-1 border-b border-border/30 px-2 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="text-xs font-semibold">Affiliations</span>
              <Button
                ref={(node) => assignRef(workspaceCycleEntryRef, node)}
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 rounded-full px-2 text-[11px]"
                onClick={focusAffiliationBuilderPrimaryInput}
              >
                Add
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 pb-2 pt-1">
              {institutionOrder.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                  Use the builder on the right to add affiliations.
                </p>
              ) : (
                <SortableContext items={affSortableIds} strategy={verticalListSortingStrategy}>
                  {institutionOrder.map((instId, idx) => {
                    const inst = institutions.get(instId);
                    if (!inst) return null;
                    return (
                      <SortableAffiliationRow
                        key={instId}
                        id={instId}
                        label={shortInstitutionLabel(inst)}
                        numberLabel={getNextSuperscript(idx, templateConfig.superscriptStyle)}
                        index={idx}
                        count={institutionOrder.length}
                        onMoveUp={() => {
                          if (idx > 0) reorderInstitutions(idx, idx - 1);
                        }}
                        onMoveDown={() => {
                          if (idx < institutionOrder.length - 1) reorderInstitutions(idx, idx + 1);
                        }}
                        onRemove={() => removeInstitution(instId)}
                      />
                    );
                  })}
                </SortableContext>
              )}
            </div>
          </div>

          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize workspace panels. Press Arrow Up or Arrow Down to adjust the split."
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
              e.preventDefault();
              const delta = e.key === 'ArrowUp' ? -0.05 : 0.05;
              setTopFrac((f) => Math.min(0.72, Math.max(0.22, f + delta)));
            }}
            onMouseDown={startResize}
            className="h-2 shrink-0 cursor-row-resize border-y border-border/50 bg-muted/30 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />

          <div className="flex min-h-[140px] flex-1 flex-col overflow-hidden" style={{ flex: 1 - topFrac }}>
            <div className="flex items-center gap-1 border-b border-border/30 px-2 py-1.5">
              <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="text-xs font-semibold">Authors</span>
            </div>
            <div className="flex flex-col gap-2 p-2">
              <Button
                ref={(node) => assignRef(addAuthorButtonRef, node)}
                type="button"
                size="sm"
                className="w-full rounded-full text-xs"
                onClick={() => {
                  const a = addAuthor('New Author');
                  onSelectAuthor(a.id);
                  toast.success('Author added');
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Author
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-9 rounded-full pl-8 text-xs"
                  aria-label="Search authors"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-full text-xs"
                onClick={exportCsv}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-3">
              {filteredAuthors.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No authors yet. Add one above.
                </p>
              ) : (
                <SortableContext items={authSortableIds} strategy={verticalListSortingStrategy}>
                  {filteredAuthors.map((author) => {
                    const fullIndex = authors.findIndex((a) => a.id === author.id);
                    return (
                      <div
                        key={author.id}
                        className={cn(
                          selectedAuthorId === author.id && 'ring-1 ring-primary/30 rounded-xl'
                        )}
                      >
                        <SortableAuthorRow
                          author={author}
                          institutionOrder={institutionOrder}
                          superscriptStyle={templateConfig.superscriptStyle}
                          onRemove={() => removeAuthor(author.id)}
                          onUpdate={(u) => updateAuthor(author.id, u)}
                          assignOptions={assignOptions.filter(
                            (o) => !author.affiliationIds.includes(o.id)
                          )}
                          poolHasAffiliations={institutionOrder.length > 0}
                          authorIndex={fullIndex}
                          authorCount={authors.length}
                          onMoveAuthorUp={() => {
                            if (fullIndex > 0) reorderAuthors(fullIndex, fullIndex - 1);
                          }}
                          onMoveAuthorDown={() => {
                            if (fullIndex >= 0 && fullIndex < authors.length - 1) {
                              reorderAuthors(fullIndex, fullIndex + 1);
                            }
                          }}
                          onUnlinkAffiliation={(instId) => removeAffiliation(author.id, instId)}
                          onAssignAffiliation={(instId) => assignAffiliation(author.id, instId)}
                        />
                      </div>
                    );
                  })}
                </SortableContext>
              )}
            </div>
          </div>
        </div>

        <DragOverlay
          dropAnimation={null}
          zIndex={200}
          className="pointer-events-none"
        >
          {activeDrag?.kind === 'aff' && institutions.get(activeDrag.id) ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
              <span className="text-xs font-bold text-primary">
                {getNextSuperscript(
                  institutionOrder.indexOf(activeDrag.id),
                  templateConfig.superscriptStyle
                )}
              </span>
              <span className="text-sm">{shortInstitutionLabel(institutions.get(activeDrag.id)!)}</span>
            </div>
          ) : activeDrag?.kind === 'auth' ? (
            <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-lg">
              {authors.find((a) => a.id === activeDrag.id)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </aside>
  );
}
