import { useState, useMemo, useEffect, useRef, type Ref } from 'react';
import { useHkuDictionary } from '@/hooks/useHkuDictionary';
import { useRorSearch } from '@/hooks/useRorSearch';
import { useAuthorStore } from '@/stores/author-store';
import { buildInstitutionFromUnit } from '@/lib/hku-dictionary';
import { findClosestHkuUnit, diffQueryToSuggestion } from '@/lib/hku-fuzzy';
import { rorToInstitution } from '@/lib/ror-client';
import type { Institution } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, Building, Globe2, Plus, Building2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ReportAffiliationDialog } from '@/components/ReportAffiliationDialog';

/**
 * Inline panel: add institutions to the shared pool (no modal).
 */
export function AffiliationBuilder({
  className,
  hkuUnitsTabRef,
  hkuPrimaryInputRef,
}: {
  className?: string;
  hkuUnitsTabRef?: Ref<HTMLButtonElement>;
  hkuPrimaryInputRef?: Ref<HTMLInputElement>;
}) {
  const { dict, search: searchHku } = useHkuDictionary();
  const { results: rorResults, isLoading: rorLoading, search: searchRor } = useRorSearch();
  const addInstitution = useAuthorStore((state) => state.addInstitution);
  const hkSuffix = useAuthorStore((state) => state.templateConfig.hkSuffix);

  const [tab, setTab] = useState('hku');
  const [hkuQuery, setHkuQuery] = useState('');
  const [correctionMeta, setCorrectionMeta] = useState<{ raw: string; applied: string } | null>(
    null
  );
  const [externalQuery, setExternalQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const hkuListRef = useRef<HTMLDivElement>(null);
  const externalListRef = useRef<HTMLDivElement>(null);

  const hkuResults = useMemo(
    () => (hkuQuery.trim().length > 0 ? searchHku(hkuQuery) : []),
    [hkuQuery, searchHku]
  );

  const fuzzyMatch = useMemo(() => {
    const q = hkuQuery.trim();
    if (q.length < 2 || hkuResults.length > 0) return null;
    return findClosestHkuUnit(dict, q);
  }, [dict, hkuQuery, hkuResults.length]);

  const handleSelectInstitution = (institution: Institution) => {
    addInstitution(institution);
    toast.success('Affiliation added to list');
    setHkuQuery('');
    setCorrectionMeta(null);
    setExternalQuery('');
    setCustomName('');
    setCustomCity('');
    setCustomCountry('');
  };

  const handleHkuInputChange = (v: string) => {
    setHkuQuery(v);
    if (correctionMeta && v !== correctionMeta.applied) {
      setCorrectionMeta(null);
    }
  };

  const handleHkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Backspace' || !correctionMeta) return;
    if (hkuQuery !== correctionMeta.applied) return;
    e.preventDefault();
    const raw = correctionMeta.raw;
    setHkuQuery(raw);
    setCorrectionMeta(null);
    const el = e.currentTarget;
    queueMicrotask(() => {
      el.setSelectionRange(raw.length, raw.length);
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customCity || !customCountry) return;

    const newCustomInstitution: Institution = {
      id: `custom:${Date.now()}`,
      source: 'custom',
      components: {
        university: customName,
        city: customCity,
        country: customCountry,
      },
    };

    handleSelectInstitution(newCustomInstitution);
  };

  const handleDiyFromHkuQuery = () => {
    const t = hkuQuery.trim();
    if (!t) return;
    const newCustomInstitution: Institution = {
      id: `custom:${Date.now()}`,
      source: 'custom',
      components: {
        university: t,
        // HKU tab DIY: use same geographic tail as dictionary rows (hkSuffix); avoids empty ", ," in preview.
        city: 'Hong Kong',
        country: '',
      },
    };
    handleSelectInstitution(newCustomInstitution);
  };

  const hkuEmpty =
    hkuQuery.trim().length > 0 && hkuResults.length === 0 && !fuzzyMatch;

  /** Avoid fixed-height + overflow-y-auto showing a scrollbar on the empty intro state. */
  const hkuListScrollable =
    hkuQuery.trim().length > 0 || (!!fuzzyMatch && hkuQuery.trim().length >= 2);
  const externalListScrollable =
    rorLoading || rorResults.length > 0 || externalQuery.trim().length > 1;

  useEffect(() => {
    if (hkuListRef.current) {
      hkuListRef.current.scrollTop = 0;
    }
  }, [tab, hkuQuery, hkuResults.length, fuzzyMatch]);

  useEffect(() => {
    if (externalListRef.current) {
      externalListRef.current.scrollTop = 0;
    }
  }, [tab, externalQuery, rorLoading, rorResults.length]);

  return (
    <section
      id="affiliation-builder"
      className={cn('flex min-h-0 flex-col overflow-hidden', className)}
      aria-label="Add affiliations to the pool"
    >
      <ReportAffiliationDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        defaultAffiliationName={hkuQuery}
        searchKeywords={hkuQuery}
      />
      <div className="shrink-0 border-b border-border/80 bg-card/90 px-4 py-2.5 sm:px-5">
        <h2 className="font-serif text-base font-bold text-foreground sm:text-lg">
          Affiliation builder
        </h2>
      </div>

      <div className="shrink-0 overflow-hidden p-4 sm:p-5">
        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-col overflow-hidden">
          <TabsList className="mb-2 grid w-full max-w-2xl grid-cols-3 rounded-full bg-muted/40 p-1">
            <TabsTrigger
              ref={hkuUnitsTabRef}
              value="hku"
              className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft"
            >
              <Building className="mr-2 h-4 w-4" aria-hidden />
              HKU Units
            </TabsTrigger>
            <TabsTrigger
              value="external"
              className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft"
            >
              <Globe2 className="mr-2 h-4 w-4" aria-hidden />
              External
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft"
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="hku"
            tabIndex={-1}
            className="m-0 mt-0 hidden min-h-0 flex-col gap-0 data-[state=active]:flex"
          >
            {/* Fixed block height: list scrolls inside so the card does not resize when results load (avoids "jump" / stuck flex). */}
            <div className="flex h-[clamp(220px,45dvh,360px)] flex-col overflow-hidden rounded-[1.25rem] border border-border/60 bg-card/50">
              <Command
                shouldFilter={false}
                vimBindings={false}
                className="flex min-h-0 flex-1 flex-col bg-transparent"
              >
                <CommandInput
                  ref={hkuPrimaryInputRef}
                  id="affiliation-builder-primary-input"
                  placeholder="Keywords: faculty, department, lab…"
                  value={hkuQuery}
                  onValueChange={handleHkuInputChange}
                  onKeyDown={handleHkuKeyDown}
                  className="rounded-none border-0 border-b border-border/60"
                />
                <CommandList
                  ref={hkuListRef}
                  className={cn(
                    'max-h-none min-h-0 flex-1',
                    hkuListScrollable ? 'overflow-y-auto' : 'overflow-y-hidden'
                  )}
                >
                  {hkuQuery.trim().length === 0 ? (
                    <div className="flex flex-col items-center px-4 py-8 text-center text-sm text-muted-foreground">
                      <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
                      <p>Type keywords to search the HKU dictionary.</p>
                      <p className="mt-1 text-xs">
                        Use arrow keys and Enter to select. (DIY) appears in Results — Enter saves your
                        text as a custom institution.
                      </p>
                    </div>
                  ) : null}

                  {fuzzyMatch && hkuQuery.trim().length >= 2 ? (
                    <CommandGroup heading="Closest match — Enter to use spelling">
                      <CommandItem
                        value={`fuzzy-${fuzzyMatch.unit.id}`}
                        onSelect={() => {
                          setCorrectionMeta({ raw: hkuQuery.trim(), applied: fuzzyMatch.label });
                          setHkuQuery(fuzzyMatch.label);
                        }}
                        className="flex flex-col items-start gap-1 py-3"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          Use corrected keywords (green = suggested edits). Backspace reverts.
                        </span>
                        <span className="text-sm">
                          {diffQueryToSuggestion(hkuQuery.trim(), fuzzyMatch.label).map((seg, i) => (
                            <span
                              key={i}
                              className={
                                seg.added
                                  ? 'font-semibold text-green-600 dark:text-green-500'
                                  : undefined
                              }
                            >
                              {seg.text}
                            </span>
                          ))}
                        </span>
                      </CommandItem>
                    </CommandGroup>
                  ) : null}

                  {hkuQuery.trim().length > 0 ? (
                    <CommandGroup heading="Results">
                      {hkuResults.map((unit) => (
                        <CommandItem
                          key={unit.id}
                          value={unit.id}
                          onSelect={() =>
                            handleSelectInstitution(
                              buildInstitutionFromUnit(dict, unit.id, hkSuffix)
                            )
                          }
                          className="flex flex-col items-start gap-1 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{unit.name}</span>
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 py-0 text-[10px] capitalize"
                            >
                              {unit.type}
                            </Badge>
                          </div>
                          {unit.aliases.length > 0 && (
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {unit.aliases.join(' • ')}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                      <CommandItem
                        value="__diy__"
                        disabled={!hkuQuery.trim()}
                        onSelect={handleDiyFromHkuQuery}
                        className="flex flex-col items-start gap-1 border-t border-border/50 py-3 data-[selected=true]:border-secondary/40"
                      >
                        <div className="flex w-full min-w-0 items-start gap-2">
                          <PenLine
                            className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                            aria-hidden
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="font-medium">(DIY) Add typed text as custom institution</span>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {hkuQuery.trim()}
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Highlight this row and press Enter to save.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-8 shrink-0 self-start rounded-lg bg-foreground px-3 text-xs font-bold text-background hover:bg-foreground/90 sm:mt-0.5"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportDialogOpen(true);
                              }}
                            >
                              Report to us
                            </Button>
                          </div>
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  ) : null}

                  {hkuEmpty ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      No HKU substring matches. Use the (DIY) row in Results and press Enter.
                    </p>
                  ) : null}
                </CommandList>
              </Command>
            </div>
          </TabsContent>

          <TabsContent
            value="external"
            tabIndex={-1}
            className="m-0 mt-0 hidden min-h-0 flex-col gap-3 overflow-hidden data-[state=active]:flex"
          >
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="affiliation-builder-external-input"
                placeholder="Search ROR (e.g. Stanford, Oxford)"
                title="Search the ROR registry — e.g. Stanford, Oxford"
                className="pl-11"
                value={externalQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  setExternalQuery(v);
                  searchRor(v);
                }}
              />
            </div>

            <div
              ref={externalListRef}
              className={cn(
                /* No flex-1 here: with a fixed h-clamp, flex-1 grows to fit content and kills internal scroll. */
                'h-[clamp(180px,40dvh,320px)] min-h-0 shrink-0 rounded-[1.25rem] border border-border/60',
                externalListScrollable ? 'overflow-y-auto overscroll-y-contain' : 'overflow-y-hidden'
              )}
            >
              {rorLoading ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  Searching global registry…
                </div>
              ) : rorResults.length > 0 ? (
                <div className="flex flex-col">
                  {rorResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSelectInstitution(rorToInstitution(result))}
                      className="flex flex-col items-start gap-1 border-b border-border/40 p-4 text-left transition-colors last:border-0 hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
                    >
                      <span className="font-medium">{result.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {result.addresses?.[0]?.city && (
                          <span>{result.addresses[0].city},{' '}</span>
                        )}
                        <span>{result.country.country_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : externalQuery.length > 1 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  No institutions found.
                </div>
              ) : (
                <div className="flex flex-col items-center px-4 py-12 text-center text-sm text-muted-foreground">
                  <Globe2 className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden />
                  <p>Search the global ROR registry.</p>
                  <p className="mt-1 text-xs">Over 100,000 research organizations worldwide.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="custom"
            tabIndex={-1}
            className="m-0 mt-0 hidden min-h-0 overflow-visible data-[state=active]:block"
          >
            <form
              onSubmit={handleCustomSubmit}
              className="flex max-w-2xl flex-col gap-4 pt-1"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aff-inst-name">
                    Institution Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="aff-inst-name"
                    placeholder="e.g., Independent Researcher"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aff-inst-city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="aff-inst-city"
                      placeholder="e.g., Geneva"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aff-inst-country">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="aff-inst-country"
                      placeholder="e.g., Switzerland"
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={!customName || !customCity || !customCountry}>
                  Add custom institution
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
