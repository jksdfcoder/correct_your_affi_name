import { useEffect, useRef, useState } from 'react';

const MD_BREAKPOINT = 767;

/** Left inset from viewport for edge-open (plus safe area via env in CSS on body is not readable here; use generous px). */
const EDGE_OPEN_PX = 36;
const MIN_OPEN_DX = 56;
const MIN_CLOSE_DX = 64;
/** Horizontal movement must dominate vertical to avoid fighting scroll. */
const AXIS_RATIO = 1.3;
function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
}

function isPrimaryInput(el: EventTarget | null): boolean {
  return (
    el instanceof Element &&
    !!el.closest('input, textarea, select, [contenteditable="true"], [data-radix-select-trigger]')
  );
}

function isInsideRoleDialog(el: EventTarget | null): boolean {
  return el instanceof Element && !!el.closest('[role="dialog"]');
}

/**
 * Mobile / coarse pointer: swipe right from the left screen edge opens the workspace;
 * swipe left on the dimmed scrim closes it (avoids conflicting with vertical list scroll and DnD rows).
 */
export function useMobileWorkspaceSwipe(
  open: boolean,
  setOpen: (next: boolean) => void,
  enabled: boolean
): void {
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!enabled || !isCoarsePointer()) return;

    type Mode = 'open-edge' | 'close-overlay';
    let mode: Mode | null = null;
    let startX = 0;
    let startY = 0;

    const removeMoveListeners = () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchCancel);
      mode = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!mode || e.touches.length !== 1) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (mode === 'open-edge' && dx > 14 && Math.abs(dx) > Math.abs(dy) * AXIS_RATIO) {
        e.preventDefault();
      }
      if (mode === 'close-overlay' && dx < -14 && Math.abs(dx) > Math.abs(dy) * AXIS_RATIO) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!mode) return;
      const t = e.changedTouches[0];
      if (!t) {
        removeMoveListeners();
        return;
      }
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const horizontal = Math.abs(dx) > Math.abs(dy) * AXIS_RATIO;

      if (horizontal) {
        if (mode === 'open-edge' && !openRef.current && dx > MIN_OPEN_DX) {
          setOpen(true);
        } else if (openRef.current && mode === 'close-overlay' && dx < -MIN_CLOSE_DX) {
          setOpen(false);
        }
      }
      removeMoveListeners();
    };

    const onTouchCancel = () => {
      removeMoveListeners();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      if (!touch || isPrimaryInput(e.target)) return;

      const o = openRef.current;

      if (!o && touch.clientX <= EDGE_OPEN_PX) {
        if (document.querySelector('[role="dialog"]')) return;
        mode = 'open-edge';
        startX = touch.clientX;
        startY = touch.clientY;
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: true });
        document.addEventListener('touchcancel', onTouchCancel, { passive: true });
        return;
      }

      if (o && e.target instanceof Element && !isInsideRoleDialog(e.target)) {
        mode = 'close-overlay';
        startX = touch.clientX;
        startY = touch.clientY;
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: true });
        document.addEventListener('touchcancel', onTouchCancel, { passive: true });
      }
    };

    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart, { capture: true });
      removeMoveListeners();
    };
  }, [enabled, setOpen]);
}

export function useMatchMaxWidthMd(): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MD_BREAKPOINT}px)`).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MD_BREAKPOINT}px)`);
    const fn = () => setMatches(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  return matches;
}
