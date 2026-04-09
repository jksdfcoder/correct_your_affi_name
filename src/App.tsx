import { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { AffiliationBuilder } from '@/components/AffiliationBuilder';
import { PreviewPanel } from '@/components/PreviewPanel';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { cn } from '@/lib/utils';
import { useAuthorStore } from '@/stores/author-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAppModuleKeyboard } from '@/hooks/useAppModuleKeyboard';
import { useHideOnScrollDown } from '@/hooks/useHideOnScrollDown';
import { useMobileWorkspaceSwipe, useMatchMaxWidthMd } from '@/hooks/useMobileWorkspaceSwipe';

function AppShell() {
  const authors = useAuthorStore((s) => s.authors);

  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileWorkspaceOpen, setMobileWorkspaceOpen] = useState(false);
  const [kbdHelpOpen, setKbdHelpOpen] = useState(false);

  const workspaceFabRef = useRef<HTMLButtonElement>(null);
  const formattingButtonRef = useRef<HTMLButtonElement>(null);
  const workspaceCycleEntryRef = useRef<HTMLButtonElement>(null);
  const addAuthorCycleRef = useRef<HTMLButtonElement>(null);
  const hkuUnitsTabRef = useRef<HTMLButtonElement>(null);
  const hkuPrimaryInputRef = useRef<HTMLInputElement>(null);
  const mobileMainScrollRef = useRef<HTMLDivElement>(null);
  const desktopSidebarMountRef = useRef<HTMLDivElement>(null);
  const builderModuleRef = useRef<HTMLDivElement>(null);
  const previewModuleRef = useRef<HTMLDivElement>(null);

  const mobileLayout = useMatchMaxWidthMd();

  useAppModuleKeyboard({
    sidebarRoots: [workspaceFabRef, desktopSidebarMountRef],
    builderRef: builderModuleRef,
    settingsRef: formattingButtonRef,
    previewRef: previewModuleRef,
    mainTabCycle: {
      workspaceEntry: workspaceCycleEntryRef,
      addAuthor: addAuthorCycleRef,
      hkuTab: hkuUnitsTabRef,
      hkuPrimaryInput: hkuPrimaryInputRef,
      formatting: formattingButtonRef,
    },
  });

  const workspaceBarHidden = useHideOnScrollDown(mobileMainScrollRef, {
    disabled: mobileWorkspaceOpen,
  });
  useMobileWorkspaceSwipe(mobileWorkspaceOpen, setMobileWorkspaceOpen, mobileLayout);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || !e.shiftKey) return;
      const t = e.target;
      if (t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }
      e.preventDefault();
      setKbdHelpOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (authors.length === 0) {
      setSelectedAuthorId(null);
      return;
    }
    setSelectedAuthorId((cur) =>
      cur && authors.some((a) => a.id === cur) ? cur : authors[0]!.id
    );
  }, [authors]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -left-32 top-16 h-[min(420px,80vw)] w-[min(420px,80vw)] rounded-[40%_60%_70%_30%/50%_40%_60%_50%] bg-primary/20 blur-3xl motion-reduce:animate-none animate-pulse"
          style={{ animationDuration: '5s' }}
        />
        <div
          className="absolute -right-24 bottom-24 h-[min(360px,70vw)] w-[min(360px,70vw)] rounded-[60%_40%_30%_70%/40%_50%_50%_60%] bg-secondary/15 blur-3xl motion-reduce:animate-none animate-pulse"
          style={{ animationDuration: '6s' }}
        />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col">
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 min-h-0 flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
          <h1 className="sr-only" tabIndex={-1}>
            Correct your affiliation name
          </h1>
          <KeyboardShortcutsDialog open={kbdHelpOpen} onOpenChange={setKbdHelpOpen} />

          {/* Mobile workspace bar: fixed top, clears safe area; hides on scroll down (see mobileMainScrollRef). */}
          <div
            className={cn(
              'fixed inset-x-0 top-0 z-40 md:hidden',
              'border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-md',
              'pt-[env(safe-area-inset-top)]',
              'transition-transform duration-300 ease-out motion-reduce:transition-none',
              workspaceBarHidden && '-translate-y-full pointer-events-none'
            )}
            aria-hidden={workspaceBarHidden}
          >
            <div className="mx-auto flex w-full max-w-[1600px] justify-start px-3 pb-2 pt-1 sm:px-5">
              <Button
                ref={workspaceFabRef}
                type="button"
                variant="outline"
                size="sm"
                tabIndex={workspaceBarHidden ? -1 : undefined}
                className="h-10 min-h-10 rounded-full shadow-sm"
                onClick={() => setMobileWorkspaceOpen(true)}
                aria-label="Open workspace sidebar"
              >
                <Menu className="mr-2 h-4 w-4" />
                Workspace
              </Button>
            </div>
          </div>

            <Dialog open={mobileWorkspaceOpen} onOpenChange={setMobileWorkspaceOpen}>
              <DialogContent
                aria-describedby={undefined}
                className="fixed left-0 top-0 z-[100] flex h-full max-h-none w-[min(100vw,340px)] max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-r p-0 data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-left-0 sm:rounded-none"
              >
                <DialogTitle className="sr-only">Workspace</DialogTitle>
                <WorkspaceSidebar
                  className="min-h-0 flex-1 border-0 bg-transparent"
                  selectedAuthorId={selectedAuthorId}
                  onSelectAuthor={(id) => {
                    setSelectedAuthorId(id);
                    setMobileWorkspaceOpen(false);
                  }}
                  collapsed={false}
                  onToggleCollapsed={() => setMobileWorkspaceOpen(false)}
                  workspaceCycleEntryRef={mobileLayout ? workspaceCycleEntryRef : undefined}
                  addAuthorButtonRef={mobileLayout ? addAuthorCycleRef : undefined}
                />
              </DialogContent>
            </Dialog>

            <div
              className={cn(
                'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/90 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] backdrop-blur-md md:flex-row md:pt-0',
                workspaceBarHidden
                  ? 'max-md:pt-[max(0.75rem,env(safe-area-inset-top))]'
                  : 'max-md:pt-[calc(env(safe-area-inset-top)+3.25rem)]'
              )}
            >
            <div ref={desktopSidebarMountRef} className="hidden min-h-0 min-w-0 md:flex">
              <WorkspaceSidebar
                selectedAuthorId={selectedAuthorId}
                onSelectAuthor={setSelectedAuthorId}
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
                workspaceCycleEntryRef={mobileLayout ? undefined : workspaceCycleEntryRef}
                addAuthorButtonRef={mobileLayout ? undefined : addAuthorCycleRef}
              />
            </div>

            {/* Single min-height source of truth: avoid competing min-h-0 vs min-h-[dvh] (layout jump / flex "stuck"). */}
            <div
              ref={mobileMainScrollRef}
              data-app-main-column
              className="flex min-h-0 flex-1 flex-col overflow-hidden max-md:overflow-y-auto max-md:overscroll-y-contain"
            >
              <div
                ref={builderModuleRef}
                className="flex min-h-0 max-h-[min(52dvh,560px)] shrink-0 flex-col overflow-hidden border-b border-border/80"
              >
                <AffiliationBuilder
                  hkuUnitsTabRef={hkuUnitsTabRef}
                  hkuPrimaryInputRef={hkuPrimaryInputRef}
                  className="flex min-h-0 flex-col overflow-hidden"
                />
              </div>

              <div
                ref={previewModuleRef}
                className="flex min-h-0 flex-1 flex-col overflow-hidden max-md:flex-none max-md:min-h-0"
              >
                <PreviewPanel formattingButtonRef={formattingButtonRef} />
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}

export default App;
