import { useEffect, useRef, type RefObject } from 'react';

/** Radix Tabs: inactive triggers stay in the tab order with tabindex="-1"; we still use them as cycle anchors. */
function isCycleAnchor(el: HTMLElement | null): el is HTMLElement {
  if (!el || isAncestorHidden(el)) return false;
  if (el.hasAttribute('disabled')) return false;
  return true;
}

function activateTabTriggerIfNeeded(el: HTMLElement) {
  if (el.getAttribute('role') !== 'tab') return;
  el.click();
}

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function isAncestorHidden(el: Element): boolean {
  let p: Element | null = el;
  while (p) {
    if (p instanceof HTMLElement) {
      const s = getComputedStyle(p);
      if (s.display === 'none' || s.visibility === 'hidden') return true;
      if (p.getAttribute('aria-hidden') === 'true') return true;
    }
    p = p.parentElement;
  }
  return false;
}

function getFocusablesIn(root: HTMLElement | null): HTMLElement[] {
  if (!root || isAncestorHidden(root)) return [];
  const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return [...nodes].filter((el) => {
    if (isAncestorHidden(el)) return false;
    if (el.getAttribute('tabindex') === '-1') return false;
    return true;
  }).sort((a, b) => {
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

function findModuleIndex(active: Element | null, modules: HTMLElement[]): number {
  if (!active || !(active instanceof HTMLElement)) return -1;
  for (let i = 0; i < modules.length; i++) {
    if (modules[i].contains(active)) return i;
  }
  return -1;
}

/** Portals / overlays: keep native Tab and nested keyboard behavior. */
function shouldDeferKeyboard(active: Element | null): boolean {
  if (!active) return true;
  if (active.closest('[role="dialog"]')) return true;
  if (active.closest('[role="alertdialog"]')) return true;
  if (active.closest('[role="listbox"]')) return true;
  if (active.closest('[data-radix-popper-content-wrapper]')) return true;
  if (active.closest('[data-radix-select-content]')) return true;
  return false;
}

export type MainTabCycleRefs = {
  /** Add (expanded) or Expand sidebar (collapsed) */
  workspaceEntry: RefObject<HTMLElement | null>;
  addAuthor: RefObject<HTMLElement | null>;
  /** HKU Units tab trigger (may be tabindex=-1 when another builder tab is selected) */
  hkuTab: RefObject<HTMLElement | null>;
  /** HKU keyword search inside the builder (after tab; before Formatting) */
  hkuPrimaryInput: RefObject<HTMLElement | null>;
  formatting: RefObject<HTMLElement | null>;
};

type ModuleRefs = {
  /** Mobile FAB + desktop sidebar wrapper (both may exist in DOM; hidden roots yield no focusables). */
  sidebarRoots: RefObject<HTMLElement | null>[];
  builderRef: RefObject<HTMLElement | null>;
  settingsRef: RefObject<HTMLElement | null>;
  previewRef: RefObject<HTMLElement | null>;
  /** Tab / Shift+Tab loop: Sidebar entry → Add Author → HKU Units tab → HKU search → Formatting → … */
  mainTabCycle?: MainTabCycleRefs;
};

/**
 * Tab: when focus is on a main-cycle anchor (sidebar Add/Expand → Add Author → HKU Units tab → HKU search → Formatting),
 * Tab / Shift+Tab moves along that loop. Other fields keep normal tab order.
 * Arrow keys: roving focus inside the current region (bubble phase; respects cmdk etc.).
 */
export function useAppModuleKeyboard(refs: ModuleRefs) {
  const refsLatest = useRef(refs);
  refsLatest.current = refs;

  useEffect(() => {
    const getModules = (): HTMLElement[] => {
      const { sidebarRoots, builderRef, settingsRef, previewRef } = refsLatest.current;
      const sidebarEls = sidebarRoots
        .map((r) => r.current)
        .filter((n): n is HTMLElement => n !== null);
      const rest = [builderRef.current, settingsRef.current, previewRef.current].filter(
        (n): n is HTMLElement => n !== null
      );
      return [...sidebarEls, ...rest];
    };

    const onTabCapture = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
      const ae = document.activeElement;
      if (!(ae instanceof HTMLElement)) return;
      if (shouldDeferKeyboard(ae)) return;

      const cycle = refsLatest.current.mainTabCycle;
      if (cycle) {
        const anchors = [
          cycle.workspaceEntry.current,
          cycle.addAuthor.current,
          cycle.hkuTab.current,
          cycle.hkuPrimaryInput.current,
          cycle.formatting.current,
        ].filter(isCycleAnchor);

        const i = anchors.indexOf(ae);
        if (i >= 0) {
          e.preventDefault();
          const forward = !e.shiftKey;
          for (let step = 1; step <= anchors.length; step++) {
            const j = (i + (forward ? step : -step) + anchors.length * 8) % anchors.length;
            const next = anchors[j];
            if (next && isCycleAnchor(next)) {
              next.focus();
              activateTabTriggerIfNeeded(next);
              return;
            }
          }
          return;
        }
      }

      /** From External primary search only: Tab moves to tab strip (HKU cycle covers HKU search field). */
      if (!e.shiftKey && ae.id === 'affiliation-builder-external-input') {
        const root = ae.closest('#affiliation-builder');
        const tablist = root?.querySelector('[role="tablist"]');
        if (tablist) {
          const activeTab =
            tablist.querySelector<HTMLElement>('[role="tab"][data-state="active"]') ??
            tablist.querySelector<HTMLElement>('[data-state="active"][role="tab"]');
          const firstTab = tablist.querySelector<HTMLElement>('[role="tab"]');
          const toFocus = activeTab ?? firstTab;
          if (toFocus) {
            e.preventDefault();
            toFocus.focus();
            return;
          }
        }
      }
    };

    const onArrowBubble = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      if (e.defaultPrevented) return;
      const ae = document.activeElement;
      if (!(ae instanceof HTMLElement)) return;
      if (shouldDeferKeyboard(ae)) return;

      const modules = getModules();
      const mi = findModuleIndex(ae, modules);
      if (mi < 0) return;

      const list = getFocusablesIn(modules[mi]);
      if (list.length === 0) return;
      const idx = list.indexOf(ae);
      if (idx < 0) return;

      if (
        (ae instanceof HTMLInputElement || ae instanceof HTMLTextAreaElement) &&
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
      ) {
        return;
      }

      e.preventDefault();
      const delta = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1;
      const ni = (idx + delta + list.length) % list.length;
      list[ni]?.focus();
    };

    document.addEventListener('keydown', onTabCapture, true);
    document.addEventListener('keydown', onArrowBubble, false);
    return () => {
      document.removeEventListener('keydown', onTabCapture, true);
      document.removeEventListener('keydown', onArrowBubble, false);
    };
  }, []);
}
